"""
订单管理路由
处理积分兑换、订单查询和订单详情
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import math

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.services.order_service import OrderService
from app.schemas.order import (
    RedemptionRequest,
    RedemptionResponse,
    OrderHistoryResponse,
    OrderListItem,
    OrderDetailResponse
)

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("/redeem", response_model=RedemptionResponse)
async def redeem_product(
    request: RedemptionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    兑换产品

    - **product_id**: 产品ID
    - **quantity**: 兑换数量（默认为1）
    - **返回**: 兑换结果（成功时包含订单ID和兑换码）
    - **权限**: 需要登录
    """
    try:
        # 调用订单服务执行兑换
        success, error_msg, order = await OrderService.create_redemption_order(
            db=db,
            user_id=current_user.id,
            product_id=request.product_id,
            quantity=request.quantity
        )

        if not success:
            return RedemptionResponse(
                success=False,
                message=error_msg,
                order_id=None,
                redemption_code=None
            )

        # 兑换成功
        return RedemptionResponse(
            success=True,
            message="兑换成功",
            order_id=order.id,
            redemption_code=order.redemption_code
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"兑换失败: {str(e)}"
        )


@router.get("/history", response_model=OrderHistoryResponse)
async def get_order_history(
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页记录数"),
    status_filter: Optional[str] = Query(default=None, alias="status", description="订单状态筛选"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    查询订单历史

    - **page**: 页码（从1开始）
    - **page_size**: 每页记录数（1-100）
    - **status**: 订单状态筛选（可选：pending, completed, cancelled）
    - **返回**: 订单列表（分页）
    - **权限**: 需要登录（只能查看自己的订单）
    """
    try:
        # 计算分页偏移量
        skip = (page - 1) * page_size

        # 查询订单历史
        orders, total = await OrderService.get_user_orders(
            db=db,
            user_id=current_user.id,
            skip=skip,
            limit=page_size,
            status=status_filter
        )

        # 计算总页数
        total_pages = math.ceil(total / page_size) if total > 0 else 0

        # 转换为响应模型
        items = []
        for order in orders:
            # 构建订单列表项字典
            order_dict = {
                "id": order.id,
                "product_id": order.product_id,
                "product_name": order.product.name if order.product else None,
                "quantity": order.quantity,
                "points_spent": order.points_spent,
                "status": order.status,
                "redemption_code": order.redemption_code,
                "created_at": order.created_at
            }
            item = OrderListItem.model_validate(order_dict)
            items.append(item)

        return OrderHistoryResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"查询订单历史失败: {str(e)}"
        )


@router.get("/{order_id}", response_model=OrderDetailResponse)
async def get_order_detail(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    查询订单详情

    - **order_id**: 订单ID
    - **返回**: 订单详细信息（包含产品信息）
    - **权限**: 需要登录（只能查看自己的订单）
    """
    try:
        # 查询订单详情（包含数据隔离验证）
        order_data = await OrderService.get_order_with_details(
            db=db,
            order_id=order_id,
            user_id=current_user.id
        )

        if not order_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="订单不存在或无权访问"
            )

        # 解构订单数据
        order = order_data["order"]
        product = order_data["product"]

        # 构建详情响应
        order_detail = OrderDetailResponse(
            id=order.id,
            user_id=order.user_id,
            product_id=order.product_id,
            product_name=product.name if product else "未知产品",
            product_description=product.description if product else None,
            quantity=order.quantity,
            points_spent=order.points_spent,
            status=order.status,
            redemption_code=order.redemption_code,
            created_at=order.created_at,
            updated_at=order.updated_at
        )

        return order_detail

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"查询订单详情失败: {str(e)}"
        )
