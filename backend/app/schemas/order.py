"""
订单相关的数据模型
定义请求和响应的数据结构
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class RedemptionRequest(BaseModel):
    """兑换请求"""
    product_id: str = Field(..., description="产品ID")
    quantity: int = Field(default=1, ge=1, description="兑换数量")


class RedemptionConfirmation(BaseModel):
    """兑换确认信息"""
    product_id: str = Field(..., description="产品ID")
    product_name: str = Field(..., description="产品名称")
    quantity: int = Field(..., description="兑换数量")
    points_required: int = Field(..., description="所需积分")
    current_balance: int = Field(..., description="当前余额")
    balance_after: int = Field(..., description="兑换后余额")


class RedemptionResponse(BaseModel):
    """兑换响应"""
    success: bool = Field(..., description="是否成功")
    message: str = Field(..., description="响应消息")
    order_id: Optional[str] = Field(None, description="订单ID")
    redemption_code: Optional[str] = Field(None, description="兑换码")


class OrderBase(BaseModel):
    """订单基础信息"""
    user_id: str = Field(..., description="用户ID")
    product_id: str = Field(..., description="产品ID")
    quantity: int = Field(..., description="兑换数量")
    points_spent: int = Field(..., description="花费积分")
    status: str = Field(..., description="订单状态")
    redemption_code: Optional[str] = Field(None, description="兑换码")


class OrderResponse(OrderBase):
    """订单响应"""
    id: str = Field(..., description="订单ID")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")

    model_config = ConfigDict(from_attributes=True)


class OrderListItem(BaseModel):
    """订单列表项"""
    id: str = Field(..., description="订单ID")
    product_id: str = Field(..., description="产品ID")
    product_name: Optional[str] = Field(None, description="产品名称")
    quantity: int = Field(..., description="兑换数量")
    points_spent: int = Field(..., description="花费积分")
    status: str = Field(..., description="订单状态")
    redemption_code: Optional[str] = Field(None, description="兑换码")
    created_at: datetime = Field(..., description="创建时间")

    model_config = ConfigDict(from_attributes=True)


class OrderHistoryResponse(BaseModel):
    """订单历史响应"""
    items: List[OrderListItem] = Field(..., description="订单列表")
    total: int = Field(..., description="总记录数")
    page: int = Field(..., description="当前页码")
    page_size: int = Field(..., description="每页记录数")
    total_pages: int = Field(..., description="总页数")


class OrderDetailResponse(BaseModel):
    """订单详情响应"""
    id: str = Field(..., description="订单ID")
    user_id: str = Field(..., description="用户ID")
    product_id: str = Field(..., description="产品ID")
    product_name: str = Field(..., description="产品名称")
    product_description: Optional[str] = Field(None, description="产品描述")
    quantity: int = Field(..., description="兑换数量")
    points_spent: int = Field(..., description="花费积分")
    status: str = Field(..., description="订单状态")
    redemption_code: Optional[str] = Field(None, description="兑换码")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")
