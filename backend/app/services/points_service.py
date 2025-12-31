"""
积分服务
处理积分余额查询、积分变动记录、积分分配和扣除业务逻辑
"""

from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func
from sqlalchemy.exc import SQLAlchemyError
import logging

from app.models.points import Points, PointsHistory
from app.models.user import User

logger = logging.getLogger(__name__)


class PointsService:
    """积分服务类"""

    @staticmethod
    def format_points(points: int) -> str:
        """
        格式化积分数字显示

        Args:
            points: 积分数量

        Returns:
            格式化后的积分字符串（例如：1,000）
        """
        return f"{points:,}"

    @staticmethod
    async def get_user_balance(
        db: AsyncSession,
        user_id: str
    ) -> Optional[int]:
        """
        查询用户积分余额

        Args:
            db: 数据库会话
            user_id: 用户ID

        Returns:
            积分余额，如果用户不存在返回None
        """
        try:
            result = await db.execute(
                select(Points).where(Points.user_id == user_id)
            )
            points = result.scalar_one_or_none()

            if not points:
                logger.info(f"User {user_id} has no points record")
                return None

            return points.current_balance
        except SQLAlchemyError as e:
            logger.error(f"Error getting balance for user {user_id}: {str(e)}")
            raise

    @staticmethod
    async def get_user_points_record(
        db: AsyncSession,
        user_id: str
    ) -> Optional[Points]:
        """
        获取用户积分记录对象

        Args:
            db: 数据库会话
            user_id: 用户ID

        Returns:
            积分记录对象，如果不存在返回None
        """
        try:
            result = await db.execute(
                select(Points).where(Points.user_id == user_id)
            )
            return result.scalar_one_or_none()
        except SQLAlchemyError as e:
            logger.error(f"Error getting points record for user {user_id}: {str(e)}")
            raise

    @staticmethod
    async def initialize_user_points(
        db: AsyncSession,
        user_id: str,
        initial_balance: int = 0
    ) -> Points:
        """
        初始化用户积分记录

        Args:
            db: 数据库会话
            user_id: 用户ID
            initial_balance: 初始积分余额

        Returns:
            创建的积分记录
        """
        try:
            points = Points(
                user_id=user_id,
                current_balance=initial_balance
            )
            db.add(points)
            await db.commit()
            await db.refresh(points)

            logger.info(f"Initialized points for user {user_id} with balance {initial_balance}")
            return points
        except SQLAlchemyError as e:
            await db.rollback()
            logger.error(f"Error initializing points for user {user_id}: {str(e)}")
            raise

    @staticmethod
    async def add_points(
        db: AsyncSession,
        user_id: str,
        amount: int,
        reason: str,
        point_type: str = "allocation",
        operator_id: Optional[str] = None
    ) -> Tuple[bool, str, Optional[int]]:
        """
        增加用户积分

        Args:
            db: 数据库会话
            user_id: 用户ID
            amount: 增加的积分数量（必须为正数）
            reason: 积分变动原因
            point_type: 积分类型（allocation, adjustment等）
            operator_id: 操作人ID（管理员操作时记录）

        Returns:
            (是否成功, 错误信息, 变动后的余额)
        """
        if amount <= 0:
            return False, "积分数量必须大于0", None

        try:
            # 获取用户积分记录
            points = await PointsService.get_user_points_record(db, user_id)

            if not points:
                # 如果用户没有积分记录，先初始化
                points = await PointsService.initialize_user_points(db, user_id, 0)

            # 记录变动前的余额
            balance_before = points.current_balance
            balance_after = balance_before + amount

            # 更新余额
            points.current_balance = balance_after

            # 创建历史记录
            history = PointsHistory(
                user_id=user_id,
                amount=amount,
                type=point_type,
                reason=reason,
                operator_id=operator_id,
                balance_before=balance_before,
                balance_after=balance_after
            )
            db.add(history)

            # 提交事务
            await db.commit()
            await db.refresh(points)

            logger.info(f"Added {amount} points to user {user_id}, new balance: {balance_after}")
            return True, "", balance_after

        except SQLAlchemyError as e:
            await db.rollback()
            logger.error(f"Error adding points for user {user_id}: {str(e)}")
            return False, f"积分增加失败: {str(e)}", None

    @staticmethod
    async def deduct_points(
        db: AsyncSession,
        user_id: str,
        amount: int,
        reason: str,
        point_type: str = "deduction",
        operator_id: Optional[str] = None
    ) -> Tuple[bool, str, Optional[int]]:
        """
        扣除用户积分

        Args:
            db: 数据库会话
            user_id: 用户ID
            amount: 扣除的积分数量（必须为正数）
            reason: 积分变动原因
            point_type: 积分类型（deduction, redemption等）
            operator_id: 操作人ID（管理员操作时记录）

        Returns:
            (是否成功, 错误信息, 变动后的余额)
        """
        if amount <= 0:
            return False, "积分数量必须大于0", None

        try:
            # 获取用户积分记录
            points = await PointsService.get_user_points_record(db, user_id)

            if not points:
                return False, "用户积分记录不存在", None

            # 检查余额是否充足
            if points.current_balance < amount:
                return False, f"积分余额不足，当前余额: {points.current_balance}, 需要: {amount}", None

            # 记录变动前的余额
            balance_before = points.current_balance
            balance_after = balance_before - amount

            # 更新余额
            points.current_balance = balance_after

            # 创建历史记录（金额记录为负数）
            history = PointsHistory(
                user_id=user_id,
                amount=-amount,
                type=point_type,
                reason=reason,
                operator_id=operator_id,
                balance_before=balance_before,
                balance_after=balance_after
            )
            db.add(history)

            # 提交事务
            await db.commit()
            await db.refresh(points)

            logger.info(f"Deducted {amount} points from user {user_id}, new balance: {balance_after}")
            return True, "", balance_after

        except SQLAlchemyError as e:
            await db.rollback()
            logger.error(f"Error deducting points for user {user_id}: {str(e)}")
            return False, f"积分扣除失败: {str(e)}", None

    @staticmethod
    async def get_points_history(
        db: AsyncSession,
        user_id: str,
        skip: int = 0,
        limit: int = 20,
        point_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Tuple[List[PointsHistory], int]:
        """
        查询用户积分变动历史

        Args:
            db: 数据库会话
            user_id: 用户ID
            skip: 跳过的记录数（分页）
            limit: 返回的记录数（分页）
            point_type: 积分类型筛选（可选）
            start_date: 开始日期（可选）
            end_date: 结束日期（可选）

        Returns:
            (历史记录列表, 总记录数)
        """
        try:
            # 构建查询条件
            conditions = [PointsHistory.user_id == user_id]

            if point_type:
                conditions.append(PointsHistory.type == point_type)

            if start_date:
                conditions.append(PointsHistory.created_at >= start_date)

            if end_date:
                conditions.append(PointsHistory.created_at <= end_date)

            # 查询总数
            count_query = select(func.count()).select_from(PointsHistory).where(and_(*conditions))
            count_result = await db.execute(count_query)
            total = count_result.scalar()

            # 查询历史记录（按时间倒序）
            query = (
                select(PointsHistory)
                .where(and_(*conditions))
                .order_by(desc(PointsHistory.created_at))
                .offset(skip)
                .limit(limit)
            )

            result = await db.execute(query)
            history = result.scalars().all()

            return list(history), total

        except SQLAlchemyError as e:
            logger.error(f"Error getting points history for user {user_id}: {str(e)}")
            raise

    @staticmethod
    async def validate_user_exists(
        db: AsyncSession,
        user_id: str
    ) -> bool:
        """
        验证用户是否存在

        Args:
            db: 数据库会话
            user_id: 用户ID

        Returns:
            用户是否存在
        """
        try:
            result = await db.execute(
                select(User).where(User.id == user_id, User.is_active == True)
            )
            user = result.scalar_one_or_none()
            return user is not None
        except SQLAlchemyError as e:
            logger.error(f"Error validating user {user_id}: {str(e)}")
            raise
