"""
管理员统计和报告路由
提供系统统计数据和数据导出功能
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import Optional
from datetime import datetime, timedelta
import io
import csv
import json

from app.core.database import get_db
from app.models.user import User
from app.models.order import Order
from app.models.product import Product
from app.models.points import PointsHistory
from app.middleware.admin import get_admin_user
from app.schemas.admin import (
    RedemptionStats,
    UserActivityStats,
    SystemStats,
    AdminPointsOverview,
    ExportDataRequest,
)

router = APIRouter(prefix="/api/admin/stats", tags=["管理员-统计报告"])


@router.get("/redemption", response_model=RedemptionStats)
async def get_redemption_stats(
    start_date: Optional[datetime] = Query(None, description="开始日期"),
    end_date: Optional[datetime] = Query(None, description="结束日期"),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    获取兑换统计数据
    """
    # 构建查询条件
    conditions = []
    if start_date:
        conditions.append(Order.created_at >= start_date)
    if end_date:
        conditions.append(Order.created_at <= end_date)

    # 统计订单数和总消耗积分
    query = select(
        func.count(Order.id).label("total_orders"),
        func.sum(Order.points_spent).label("total_points"),
        func.avg(Order.points_spent).label("avg_points")
    )

    if conditions:
        query = query.where(and_(*conditions))

    result = (await db.execute(query)).first()

    total_orders = result.total_orders or 0
    total_points = int(result.total_points or 0)
    avg_points = float(result.avg_points or 0)

    # 获取热门产品
    top_products_query = select(
        Product.id,
        Product.name,
        func.count(Order.id).label("order_count"),
        func.sum(Order.points_spent).label("total_points")
    ).join(
        Order, Product.id == Order.product_id
    ).group_by(
        Product.id, Product.name
    ).order_by(
        func.count(Order.id).desc()
    ).limit(10)

    if conditions:
        top_products_query = top_products_query.where(and_(*conditions))

    top_products_result = await db.execute(top_products_query)
    top_products = [
        {
            "product_id": row.id,
            "product_name": row.name,
            "order_count": row.order_count,
            "total_points": int(row.total_points or 0)
        }
        for row in top_products_result
    ]

    return RedemptionStats(
        total_orders=total_orders,
        total_points_spent=total_points,
        total_revenue=total_points,  # 收入即消耗的积分
        average_order_value=avg_points,
        top_products=top_products,
    )


@router.get("/user-activity", response_model=UserActivityStats)
async def get_user_activity_stats(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    获取用户活跃度统计
    """
    # 总用户数
    total_users_query = select(func.count(User.id))
    total_users = (await db.execute(total_users_query)).scalar() or 0

    # 活跃用户(最近30天有积分变动)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_users_query = select(func.count(func.distinct(PointsHistory.user_id))).where(
        PointsHistory.created_at >= thirty_days_ago
    )
    active_users = (await db.execute(active_users_query)).scalar() or 0

    # 不活跃用户
    inactive_users = total_users - active_users

    # 本月新用户
    first_day_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    new_users_query = select(func.count(User.id)).where(
        User.created_at >= first_day_of_month
    )
    new_users = (await db.execute(new_users_query)).scalar() or 0

    # 兑换率(有过兑换的用户 / 总用户)
    users_with_orders_query = select(func.count(func.distinct(Order.user_id)))
    users_with_orders = (await db.execute(users_with_orders_query)).scalar() or 0
    redemption_rate = (users_with_orders / total_users * 100) if total_users > 0 else 0

    return UserActivityStats(
        total_users=total_users,
        active_users=active_users,
        inactive_users=inactive_users,
        new_users_this_month=new_users,
        redemption_rate=round(redemption_rate, 2),
    )


@router.get("/system", response_model=SystemStats)
async def get_system_stats(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    获取系统综合统计
    """
    from app.models.points import Points
    from datetime import datetime, timedelta

    # 用户统计
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0

    # 活跃用户（最近30天有积分变动或兑换的用户）
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_users_query = select(func.count(func.distinct(PointsHistory.user_id))).where(
        PointsHistory.created_at >= thirty_days_ago
    )
    active_users = (await db.execute(active_users_query)).scalar() or 0

    # 本月新用户
    first_day_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    new_users_query = select(func.count(User.id)).where(User.created_at >= first_day_of_month)
    new_users_this_month = (await db.execute(new_users_query)).scalar() or 0

    # 积分统计
    allocated_query = select(func.sum(PointsHistory.amount)).where(PointsHistory.amount > 0)
    redeemed_query = select(func.sum(PointsHistory.amount)).where(
        and_(PointsHistory.amount < 0, PointsHistory.type == 'redemption')
    )
    remaining_query = select(func.sum(Points.current_balance))

    total_allocated = int((await db.execute(allocated_query)).scalar() or 0)
    total_redeemed = abs(int((await db.execute(redeemed_query)).scalar() or 0))
    total_remaining = int((await db.execute(remaining_query)).scalar() or 0)

    # 产品统计
    total_products = (await db.execute(select(func.count(Product.id)))).scalar() or 0
    active_products = (await db.execute(
        select(func.count(Product.id)).where(
            and_(Product.status == 'active', Product.stock_quantity > 0)
        )
    )).scalar() or 0
    out_of_stock = (await db.execute(
        select(func.count(Product.id)).where(Product.stock_quantity == 0)
    )).scalar() or 0

    # 兑换统计
    total_redemptions = (await db.execute(select(func.count(Order.id)))).scalar() or 0
    this_month_redemptions = (await db.execute(
        select(func.count(Order.id)).where(Order.created_at >= first_day_of_month)
    )).scalar() or 0
    pending_orders = (await db.execute(
        select(func.count(Order.id)).where(Order.status == 'pending')
    )).scalar() or 0
    completed_orders = (await db.execute(
        select(func.count(Order.id)).where(Order.status == 'completed')
    )).scalar() or 0

    from app.schemas.admin import UsersStats, PointsStats, ProductsStats, RedemptionsStats

    return SystemStats(
        users=UsersStats(
            total=total_users,
            active=active_users,
            new_this_month=new_users_this_month
        ),
        points=PointsStats(
            total_allocated=total_allocated,
            total_redeemed=total_redeemed,
            total_remaining=total_remaining
        ),
        products=ProductsStats(
            total=total_products,
            active=active_products,
            out_of_stock=out_of_stock
        ),
        redemptions=RedemptionsStats(
            total=total_redemptions,
            this_month=this_month_redemptions,
            pending=pending_orders,
            completed=completed_orders
        )
    )


@router.post("/export")
async def export_data(
    request: ExportDataRequest,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    导出数据
    支持导出用户、订单、积分历史数据
    """
    # 根据数据类型查询
    if request.data_type == "users":
        query = select(User).where(User.is_active == True)
        result = await db.execute(query)
        data = [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "created_at": user.created_at.isoformat() if user.created_at else None,
            }
            for user in result.scalars()
        ]

    elif request.data_type == "orders":
        query = select(Order)
        if request.start_date:
            query = query.where(Order.created_at >= request.start_date)
        if request.end_date:
            query = query.where(Order.created_at <= request.end_date)

        result = await db.execute(query)
        data = [
            {
                "id": order.id,
                "user_id": order.user_id,
                "product_id": order.product_id,
                "points_spent": order.points_spent,
                "status": order.status,
                "created_at": order.created_at.isoformat() if order.created_at else None,
            }
            for order in result.scalars()
        ]

    elif request.data_type == "points_history":
        query = select(PointsHistory)
        if request.start_date:
            query = query.where(PointsHistory.created_at >= request.start_date)
        if request.end_date:
            query = query.where(PointsHistory.created_at <= request.end_date)

        result = await db.execute(query)
        data = [
            {
                "id": record.id,
                "user_id": record.user_id,
                "amount": record.amount,
                "type": record.type,
                "reason": record.reason,
                "balance_before": record.balance_before,
                "balance_after": record.balance_after,
                "created_at": record.created_at.isoformat() if record.created_at else None,
            }
            for record in result.scalars()
        ]

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的数据类型: {request.data_type}"
        )

    # 根据格式导出
    if request.format == "csv":
        output = io.StringIO()
        if data:
            writer = csv.DictWriter(output, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={request.data_type}_{datetime.utcnow().strftime('%Y%m%d')}.csv"
            }
        )

    else:  # json
        json_str = json.dumps(data, ensure_ascii=False, indent=2)
        return StreamingResponse(
            iter([json_str]),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename={request.data_type}_{datetime.utcnow().strftime('%Y%m%d')}.json"
            }
        )
