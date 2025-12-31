"""
管理员积分管理路由
处理管理员的积分分配和调整功能
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.models.user import User
from app.models.points import Points, PointsHistory
from app.middleware.admin import get_admin_user
from app.schemas.admin import (
    AdminPointsOverview,
    UserPointsInfo,
    UserPointsListResponse,
    BulkAllocatePointsRequest,
    AdjustPointsRequest,
    BulkOperationResponse,
)
from app.services.points_service import PointsService

router = APIRouter(prefix="/api/admin/points", tags=["管理员-积分管理"])


@router.get("/overview", response_model=AdminPointsOverview)
async def get_points_overview(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    获取积分系统概览
    """
    # 统计用户数
    total_users_query = select(func.count(User.id)).where(User.is_active == True)
    total_users = (await db.execute(total_users_query)).scalar() or 0

    # 统计积分
    points_query = select(
        func.sum(Points.current_balance).label("remaining"),
        func.avg(Points.current_balance).label("average")
    )
    points_result = (await db.execute(points_query)).first()

    total_remaining = int(points_result.remaining or 0)
    average_balance = float(points_result.average or 0)

    # 统计历史积分(分配和使用)
    allocated_query = select(func.sum(PointsHistory.amount)).where(
        PointsHistory.amount > 0
    )
    used_query = select(func.sum(PointsHistory.amount)).where(
        PointsHistory.amount < 0
    )

    total_allocated = abs((await db.execute(allocated_query)).scalar() or 0)
    total_used = abs((await db.execute(used_query)).scalar() or 0)

    return AdminPointsOverview(
        total_users=total_users,
        total_points_allocated=total_allocated,
        total_points_used=total_used,
        total_points_remaining=total_remaining,
        average_balance=average_balance,
    )


@router.get("/users", response_model=UserPointsListResponse)
async def get_users_points(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页记录数"),
    search: Optional[str] = Query(None, description="搜索用户名或邮箱"),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    获取所有用户的积分信息列表
    """
    # 构建查询
    query = select(User, Points).join(Points, User.id == Points.user_id).where(
        User.is_active == True
    )

    # 搜索过滤
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            (User.username.ilike(search_pattern)) |
            (User.email.ilike(search_pattern))
        )

    # 计算总数
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # 分页
    offset = (page - 1) * page_size
    query = query.order_by(desc(Points.current_balance)).offset(offset).limit(page_size)

    result = await db.execute(query)
    users_points = result.all()

    # 构建响应
    items = []
    for user, points in users_points:
        # 获取最后交易时间
        last_tx_query = select(PointsHistory.created_at).where(
            PointsHistory.user_id == user.id
        ).order_by(desc(PointsHistory.created_at)).limit(1)
        last_tx = (await db.execute(last_tx_query)).scalar()

        # 计算累计获得和使用
        earned_query = select(func.sum(PointsHistory.amount)).where(
            PointsHistory.user_id == user.id,
            PointsHistory.amount > 0
        )
        spent_query = select(func.sum(PointsHistory.amount)).where(
            PointsHistory.user_id == user.id,
            PointsHistory.amount < 0
        )

        total_earned = (await db.execute(earned_query)).scalar() or 0
        total_spent = abs((await db.execute(spent_query)).scalar() or 0)

        items.append(UserPointsInfo(
            user_id=user.id,
            username=user.username,
            email=user.email,
            current_balance=points.current_balance,
            total_earned=total_earned,
            total_spent=total_spent,
            last_transaction_date=last_tx,
        ))

    return UserPointsListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.post("/bulk-allocate", response_model=BulkOperationResponse)
async def bulk_allocate_points(
    request: BulkAllocatePointsRequest,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    批量分配积分
    可以为所有用户或指定用户分配积分
    """

    # 获取目标用户
    if request.user_ids:
        # 指定用户
        query = select(User).where(
            User.id.in_(request.user_ids),
            User.is_active == True
        )
    else:
        # 所有活跃用户
        query = select(User).where(User.is_active == True)

    result = await db.execute(query)
    users = result.scalars().all()

    if not users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到符合条件的用户"
        )

    # 批量分配
    success_count = 0
    failed_users = []

    for user in users:
        try:
            success, error_msg, _ = await PointsService.add_points(
                db=db,
                user_id=user.id,
                amount=request.amount,
                reason=request.reason,
                point_type="allocation",
                operator_id=admin.id
            )
            if not success:
                raise Exception(error_msg)
            success_count += 1
        except Exception as e:
            failed_users.append(user.id)
            print(f"Failed to allocate points to user {user.id}: {e}")

    await db.commit()

    return BulkOperationResponse(
        success=len(failed_users) == 0,
        message=f"成功为 {success_count} 个用户分配了 {request.amount} 积分",
        affected_count=success_count,
        failed_users=failed_users,
    )


@router.post("/adjust", response_model=BulkOperationResponse)
async def adjust_user_points(
    request: AdjustPointsRequest,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    手动调整单个用户的积分
    正数为增加，负数为扣除
    """

    # 验证用户存在
    user_query = select(User).where(User.id == request.user_id, User.is_active == True)
    user = (await db.execute(user_query)).scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"用户 {request.user_id} 不存在或已禁用"
        )

    try:
        if request.amount > 0:
            # 增加积分
            success, error_msg, new_balance = await PointsService.add_points(
                db=db,
                user_id=request.user_id,
                amount=request.amount,
                reason=request.reason,
                point_type="admin_adjust",
                operator_id=admin.id
            )
        else:
            # 扣除积分
            success, error_msg, new_balance = await PointsService.deduct_points(
                db=db,
                user_id=request.user_id,
                amount=abs(request.amount),
                reason=request.reason,
                point_type="admin_adjust",
                operator_id=admin.id
            )

        if not success:
            raise Exception(error_msg)

        operation = "增加" if request.amount > 0 else "扣除"
        return BulkOperationResponse(
            success=True,
            message=f"成功为用户 {user.username} {operation}了 {abs(request.amount)} 积分",
            affected_count=1,
            failed_users=[],
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"积分调整失败: {str(e)}"
        )


@router.get("/history")
async def get_all_points_history(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页记录数"),
    user_id: Optional[str] = Query(None, description="筛选特定用户"),
    type: Optional[str] = Query(None, description="积分类型筛选"),
    start_date: Optional[datetime] = Query(None, description="开始日期"),
    end_date: Optional[datetime] = Query(None, description="结束日期"),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    获取所有用户的积分变动历史（管理员）
    """
    # 构建查询
    query = select(PointsHistory, User).join(User, PointsHistory.user_id == User.id)

    # 筛选条件
    if user_id:
        query = query.where(PointsHistory.user_id == user_id)
    if type:
        query = query.where(PointsHistory.type == type)
    if start_date:
        query = query.where(PointsHistory.created_at >= start_date)
    if end_date:
        query = query.where(PointsHistory.created_at <= end_date)

    # 计算总数
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # 分页和排序
    offset = (page - 1) * page_size
    query = query.order_by(desc(PointsHistory.created_at)).offset(offset).limit(page_size)

    result = await db.execute(query)
    history_records = result.all()

    # 构建响应
    items = []
    for history, user in history_records:
        items.append({
            "id": history.id,
            "user_id": history.user_id,
            "username": user.username,
            "amount": history.amount,
            "type": history.type,
            "reason": history.reason,
            "balance_before": history.balance_before,
            "balance_after": history.balance_after,
            "created_at": history.created_at.isoformat() if history.created_at else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }
