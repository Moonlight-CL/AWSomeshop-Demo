"""
管理员订单管理路由
处理管理员查看和管理所有订单
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.models.user import User
from app.models.order import Order
from app.models.product import Product
from app.middleware.admin import get_admin_user

router = APIRouter(prefix="/api/admin/orders", tags=["管理员-订单管理"])


@router.get("/")
async def get_all_orders(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页记录数"),
    status: Optional[str] = Query(None, description="订单状态筛选"),
    user_id: Optional[str] = Query(None, description="筛选特定用户"),
    start_date: Optional[datetime] = Query(None, description="开始日期"),
    end_date: Optional[datetime] = Query(None, description="结束日期"),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    获取所有订单（管理员）
    """
    # 构建查询 - 关联 User 和 Product 表
    query = select(Order, User, Product).join(
        User, Order.user_id == User.id
    ).join(
        Product, Order.product_id == Product.id
    )

    # 筛选条件
    if status:
        query = query.where(Order.status == status)
    if user_id:
        query = query.where(Order.user_id == user_id)
    if start_date:
        query = query.where(Order.created_at >= start_date)
    if end_date:
        query = query.where(Order.created_at <= end_date)

    # 计算总数
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # 分页和排序
    offset = (page - 1) * page_size
    query = query.order_by(desc(Order.created_at)).offset(offset).limit(page_size)

    result = await db.execute(query)
    order_records = result.all()

    # 构建响应
    items = []
    for order, user, product in order_records:
        items.append({
            "id": order.id,
            "user_id": order.user_id,
            "username": user.username,
            "user_email": user.email,
            "product_id": order.product_id,
            "product_name": product.name,
            "quantity": order.quantity,
            "points_spent": order.points_spent,
            "status": order.status,
            "redemption_code": order.redemption_code,
            "created_at": order.created_at.isoformat() if order.created_at else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }
