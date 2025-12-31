"""
订单和兑换服务
处理积分兑换业务逻辑、订单生成和状态管理
"""

from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
import logging
import secrets
import string
import asyncio

from app.models.order import Order
from app.models.user import User
from app.models.product import Product
from app.services.points_service import PointsService
from app.services.product_service import ProductService
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


class OrderService:
    """订单和兑换服务类"""

    @staticmethod
    def generate_redemption_code() -> str:
        """
        生成兑换码

        Returns:
            16位兑换码
        """
        # 生成16位随机兑换码 (字母+数字)
        alphabet = string.ascii_uppercase + string.digits
        code = ''.join(secrets.choice(alphabet) for _ in range(16))
        return f"{code[:4]}-{code[4:8]}-{code[8:12]}-{code[12:16]}"

    @staticmethod
    async def validate_redemption_prerequisites(
        db: AsyncSession,
        user_id: str,
        product_id: str,
        quantity: int = 1
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        验证兑换前置条件

        Args:
            db: 数据库会话
            user_id: 用户ID
            product_id: 产品ID
            quantity: 兑换数量

        Returns:
            (是否通过, 错误信息, 验证数据)
            验证数据包含: user_balance, product, total_points
        """
        try:
            # 1. 验证产品存在
            product = await ProductService.get_product_by_id(db, product_id)
            if not product:
                return False, "产品不存在", None

            # 2. 检查产品可用性
            is_available, error_msg = await ProductService.check_product_availability(db, product_id)
            if not is_available:
                return False, error_msg, None

            # 3. 检查库存是否充足
            if product.stock_quantity < quantity:
                return False, f"库存不足，当前库存: {product.stock_quantity}, 需要: {quantity}", None

            # 4. 检查用户积分余额
            user_balance = await PointsService.get_user_balance(db, user_id)
            if user_balance is None:
                return False, "用户积分记录不存在", None

            # 5. 计算所需积分
            total_points = product.points_price * quantity
            if user_balance < total_points:
                return False, f"积分余额不足，当前余额: {user_balance}, 需要: {total_points}", None

            # 返回验证数据
            validation_data = {
                "user_balance": user_balance,
                "product": product,
                "total_points": total_points
            }

            return True, "", validation_data

        except SQLAlchemyError as e:
            logger.error(f"Error validating redemption prerequisites: {str(e)}")
            return False, f"验证失败: {str(e)}", None

    @staticmethod
    async def create_redemption_order(
        db: AsyncSession,
        user_id: str,
        product_id: str,
        quantity: int = 1
    ) -> Tuple[bool, str, Optional[Order]]:
        """
        创建兑换订单（包含完整的事务处理）

        Args:
            db: 数据库会话
            user_id: 用户ID
            product_id: 产品ID
            quantity: 兑换数量

        Returns:
            (是否成功, 错误信息, 订单对象)
        """
        try:
            # 1. 验证前置条件
            is_valid, error_msg, validation_data = await OrderService.validate_redemption_prerequisites(
                db, user_id, product_id, quantity
            )
            if not is_valid:
                return False, error_msg, None

            product = validation_data["product"]
            total_points = validation_data["total_points"]

            # 2. 开始事务处理
            # 2.1 扣除积分
            success, error_msg, new_balance = await PointsService.deduct_points(
                db=db,
                user_id=user_id,
                amount=total_points,
                reason=f"兑换商品: {product.name} x{quantity}",
                point_type="redemption"
            )
            if not success:
                await db.rollback()
                return False, error_msg, None

            # 2.2 减少库存
            success, error_msg = await ProductService.update_stock(
                db=db,
                product_id=product_id,
                quantity_change=-quantity
            )
            if not success:
                await db.rollback()
                return False, error_msg, None

            # 2.3 生成兑换码
            redemption_code = OrderService.generate_redemption_code()

            # 2.4 创建订单
            order = Order(
                user_id=user_id,
                product_id=product_id,
                quantity=quantity,
                points_spent=total_points,
                status="completed",  # 数字产品立即完成
                redemption_code=redemption_code
            )
            db.add(order)

            # 3. 提交事务
            await db.commit()
            await db.refresh(order)

            logger.info(
                f"Redemption order created successfully: "
                f"user={user_id}, product={product_id}, "
                f"quantity={quantity}, points={total_points}"
            )

            # 4. 异步发送邮件通知（不阻塞订单创建流程）
            try:
                # 查询用户信息获取邮箱
                user_query = select(User).where(User.id == user_id)
                user_result = await db.execute(user_query)
                user = user_result.scalar_one_or_none()

                if user and user.email:
                    # 在后台异步发送邮件，不等待完成
                    asyncio.create_task(
                        NotificationService.send_redemption_success_email(
                            to_email=user.email,
                            order_id=order.id,
                            product_name=product.name,
                            quantity=quantity,
                            points_spent=total_points,
                            redemption_code=redemption_code,
                            redemption_time=order.created_at
                        )
                    )
                    logger.info(f"Email notification task created for user {user_id}")
                else:
                    logger.warning(f"No email found for user {user_id}, skipping notification")

            except Exception as e:
                # 邮件发送失败不应该影响订单创建
                logger.error(f"Error creating email notification task: {str(e)}")

            return True, "", order

        except SQLAlchemyError as e:
            await db.rollback()
            logger.error(f"Error creating redemption order: {str(e)}")
            return False, f"创建订单失败: {str(e)}", None
        except Exception as e:
            await db.rollback()
            logger.error(f"Unexpected error in create_redemption_order: {str(e)}")
            return False, f"系统错误: {str(e)}", None

    @staticmethod
    async def get_order_by_id(
        db: AsyncSession,
        order_id: str,
        user_id: Optional[str] = None
    ) -> Optional[Order]:
        """
        根据ID查询订单

        Args:
            db: 数据库会话
            order_id: 订单ID
            user_id: 用户ID（可选，用于权限验证）

        Returns:
            订单对象，如果不存在返回None
        """
        try:
            query = select(Order).where(Order.id == order_id)

            # 如果提供了user_id，添加用户过滤（数据隔离）
            if user_id:
                query = query.where(Order.user_id == user_id)

            result = await db.execute(query)
            return result.scalar_one_or_none()
        except SQLAlchemyError as e:
            logger.error(f"Error getting order {order_id}: {str(e)}")
            raise

    @staticmethod
    async def get_user_orders(
        db: AsyncSession,
        user_id: str,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None
    ) -> Tuple[List[Order], int]:
        """
        查询用户订单历史

        Args:
            db: 数据库会话
            user_id: 用户ID
            skip: 跳过的记录数（分页）
            limit: 返回的记录数（分页）
            status: 状态筛选（可选）

        Returns:
            (订单列表, 总记录数)
        """
        try:
            # 构建查询条件
            conditions = [Order.user_id == user_id]

            if status:
                conditions.append(Order.status == status)

            # 查询总数
            count_query = select(func.count()).select_from(Order).where(and_(*conditions))
            count_result = await db.execute(count_query)
            total = count_result.scalar()

            # 查询订单列表（按时间倒序，eager load product关系）
            query = (
                select(Order)
                .options(selectinload(Order.product))
                .where(and_(*conditions))
                .order_by(desc(Order.created_at))
                .offset(skip)
                .limit(limit)
            )

            result = await db.execute(query)
            orders = result.scalars().all()

            return list(orders), total

        except SQLAlchemyError as e:
            logger.error(f"Error getting user orders for user {user_id}: {str(e)}")
            raise

    @staticmethod
    async def get_order_with_details(
        db: AsyncSession,
        order_id: str,
        user_id: Optional[str] = None
    ) -> Optional[dict]:
        """
        获取订单详情（包含关联的产品和用户信息）

        Args:
            db: 数据库会话
            order_id: 订单ID
            user_id: 用户ID（可选，用于权限验证）

        Returns:
            包含完整信息的订单字典
        """
        try:
            # 查询订单（包含关联数据）
            query = (
                select(Order, Product, User)
                .join(Product, Order.product_id == Product.id)
                .join(User, Order.user_id == User.id)
                .where(Order.id == order_id)
            )

            if user_id:
                query = query.where(Order.user_id == user_id)

            result = await db.execute(query)
            row = result.first()

            if not row:
                return None

            order, product, user = row

            return {
                "order": order,
                "product": product,
                "user": user
            }

        except SQLAlchemyError as e:
            logger.error(f"Error getting order details {order_id}: {str(e)}")
            raise
