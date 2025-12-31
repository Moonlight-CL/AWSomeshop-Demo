"""
管理员相关的数据模型
定义管理员功能的请求和响应数据结构
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# ========== 积分管理 ==========

class AdminPointsOverview(BaseModel):
    """管理员积分概览"""
    total_users: int = Field(..., description="总用户数")
    total_points_allocated: int = Field(..., description="总分配积分")
    total_points_used: int = Field(..., description="总使用积分")
    total_points_remaining: int = Field(..., description="剩余积分总数")
    average_balance: float = Field(..., description="平均积分余额")


class UserPointsInfo(BaseModel):
    """用户积分信息"""
    user_id: str = Field(..., description="用户ID")
    username: str = Field(..., description="用户名")
    email: str = Field(..., description="邮箱")
    current_balance: int = Field(..., description="当前积分余额")
    total_earned: int = Field(0, description="累计获得积分")
    total_spent: int = Field(0, description="累计使用积分")
    last_transaction_date: Optional[datetime] = Field(None, description="最后交易时间")

    model_config = ConfigDict(from_attributes=True)


class UserPointsListResponse(BaseModel):
    """用户积分列表响应"""
    items: List[UserPointsInfo] = Field(..., description="用户积分列表")
    total: int = Field(..., description="总记录数")
    page: int = Field(..., description="当前页码")
    page_size: int = Field(..., description="每页记录数")
    total_pages: int = Field(..., description="总页数")


class BulkAllocatePointsRequest(BaseModel):
    """批量分配积分请求"""
    amount: int = Field(..., gt=0, description="分配的积分数量")
    reason: str = Field(..., min_length=1, max_length=500, description="分配原因")
    user_ids: Optional[List[str]] = Field(None, description="指定用户ID列表(为空则为所有用户)")


class AdjustPointsRequest(BaseModel):
    """手动调整积分请求"""
    user_id: str = Field(..., description="用户ID")
    amount: int = Field(..., description="调整的积分数量(正数为增加,负数为扣除)")
    reason: str = Field(..., min_length=1, max_length=500, description="调整原因")


class BulkOperationResponse(BaseModel):
    """批量操作响应"""
    success: bool = Field(..., description="操作是否成功")
    message: str = Field(..., description="响应消息")
    affected_count: int = Field(..., description="影响的用户数")
    failed_users: List[str] = Field(default_factory=list, description="失败的用户ID列表")


# ========== 产品管理 ==========

class CreateProductRequest(BaseModel):
    """创建产品请求"""
    name: str = Field(..., min_length=1, max_length=200, description="产品名称")
    description: str = Field(..., max_length=2000, description="产品描述")
    points_price: int = Field(..., gt=0, description="积分价格")
    stock_quantity: int = Field(..., ge=0, description="库存数量")
    category: Optional[str] = Field(None, max_length=50, description="产品分类")
    image_url: Optional[str] = Field(None, max_length=500, description="图片URL")
    usage_instructions: Optional[str] = Field(None, max_length=2000, description="使用说明")
    terms_conditions: Optional[str] = Field(None, max_length=2000, description="条款和条件")
    expiry_date: Optional[datetime] = Field(None, description="过期日期")


class UpdateProductRequest(BaseModel):
    """更新产品请求"""
    name: Optional[str] = Field(None, min_length=1, max_length=200, description="产品名称")
    description: Optional[str] = Field(None, max_length=2000, description="产品描述")
    points_price: Optional[int] = Field(None, gt=0, description="积分价格")
    stock_quantity: Optional[int] = Field(None, ge=0, description="库存数量")
    category: Optional[str] = Field(None, max_length=50, description="产品分类")
    image_url: Optional[str] = Field(None, max_length=500, description="图片URL")
    usage_instructions: Optional[str] = Field(None, max_length=2000, description="使用说明")
    terms_conditions: Optional[str] = Field(None, max_length=2000, description="条款和条件")
    expiry_date: Optional[datetime] = Field(None, description="过期日期")
    status: Optional[str] = Field(None, description="产品状态")


class UpdateStockRequest(BaseModel):
    """更新库存请求"""
    stock_quantity: int = Field(..., ge=0, description="新的库存数量")
    reason: str = Field(..., min_length=1, max_length=500, description="更新原因")


# ========== 统计报告 ==========

class RedemptionStats(BaseModel):
    """兑换统计"""
    total_orders: int = Field(..., description="总订单数")
    total_points_spent: int = Field(..., description="总消耗积分")
    total_revenue: int = Field(..., description="总收入(积分)")
    average_order_value: float = Field(..., description="平均订单价值")
    top_products: List[dict] = Field(default_factory=list, description="热门产品")


class UserActivityStats(BaseModel):
    """用户活跃度统计"""
    total_users: int = Field(..., description="总用户数")
    active_users: int = Field(..., description="活跃用户数")
    inactive_users: int = Field(..., description="不活跃用户数")
    new_users_this_month: int = Field(..., description="本月新用户")
    redemption_rate: float = Field(..., description="兑换率(%)")


class UsersStats(BaseModel):
    """用户统计"""
    total: int = Field(..., description="总用户数")
    active: int = Field(..., description="活跃用户数")
    new_this_month: int = Field(..., description="本月新增用户")


class PointsStats(BaseModel):
    """积分统计"""
    total_allocated: int = Field(..., description="已分配总积分")
    total_redeemed: int = Field(..., description="已兑换积分")
    total_remaining: int = Field(..., description="剩余积分")


class ProductsStats(BaseModel):
    """产品统计"""
    total: int = Field(..., description="总产品数")
    active: int = Field(..., description="上架产品数")
    out_of_stock: int = Field(..., description="缺货产品数")


class RedemptionsStats(BaseModel):
    """兑换统计"""
    total: int = Field(..., description="总兑换数")
    this_month: int = Field(..., description="本月兑换数")
    pending: int = Field(..., description="待处理订单")
    completed: int = Field(..., description="已完成订单")


class SystemStats(BaseModel):
    """系统综合统计"""
    users: UsersStats = Field(..., description="用户统计")
    points: PointsStats = Field(..., description="积分统计")
    products: ProductsStats = Field(..., description="产品统计")
    redemptions: RedemptionsStats = Field(..., description="兑换统计")


class ExportDataRequest(BaseModel):
    """导出数据请求"""
    data_type: str = Field(..., description="数据类型: users, orders, points_history")
    start_date: Optional[datetime] = Field(None, description="开始日期")
    end_date: Optional[datetime] = Field(None, description="结束日期")
    format: str = Field(default="csv", description="导出格式: csv, json")
