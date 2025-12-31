"""
积分相关的数据模型
定义请求和响应的数据结构
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class PointsBalanceResponse(BaseModel):
    """积分余额响应"""
    user_id: str = Field(..., description="用户ID")
    current_balance: int = Field(..., description="当前积分余额")
    formatted_balance: str = Field(..., description="格式化的积分余额")

    model_config = ConfigDict(from_attributes=True)


class PointsHistoryItem(BaseModel):
    """积分历史记录项"""
    id: str = Field(..., description="记录ID")
    user_id: str = Field(..., description="用户ID")
    amount: int = Field(..., description="积分变动数量（正数为增加，负数为扣除）")
    type: str = Field(..., description="积分类型")
    reason: str = Field(..., description="变动原因")
    operator_id: Optional[str] = Field(None, description="操作人ID")
    balance_before: int = Field(..., description="变动前余额")
    balance_after: int = Field(..., description="变动后余额")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")

    model_config = ConfigDict(from_attributes=True)


class PointsHistoryResponse(BaseModel):
    """积分历史记录响应"""
    items: List[PointsHistoryItem] = Field(..., description="历史记录列表")
    total: int = Field(..., description="总记录数")
    page: int = Field(..., description="当前页码")
    page_size: int = Field(..., description="每页记录数")
    total_pages: int = Field(..., description="总页数")


class PointsHistoryFilter(BaseModel):
    """积分历史筛选参数"""
    page: int = Field(default=1, ge=1, description="页码")
    page_size: int = Field(default=20, ge=1, le=100, description="每页记录数")
    type: Optional[str] = Field(None, description="积分类型筛选")
    start_date: Optional[datetime] = Field(None, description="开始日期")
    end_date: Optional[datetime] = Field(None, description="结束日期")


class AddPointsRequest(BaseModel):
    """增加积分请求"""
    user_id: str = Field(..., description="用户ID")
    amount: int = Field(..., gt=0, description="增加的积分数量")
    reason: str = Field(..., min_length=1, max_length=500, description="增加原因")
    type: str = Field(default="allocation", description="积分类型")


class DeductPointsRequest(BaseModel):
    """扣除积分请求"""
    user_id: str = Field(..., description="用户ID")
    amount: int = Field(..., gt=0, description="扣除的积分数量")
    reason: str = Field(..., min_length=1, max_length=500, description="扣除原因")
    type: str = Field(default="deduction", description="积分类型")


class PointsOperationResponse(BaseModel):
    """积分操作响应"""
    success: bool = Field(..., description="操作是否成功")
    message: str = Field(..., description="响应消息")
    balance_after: Optional[int] = Field(None, description="操作后的余额")
