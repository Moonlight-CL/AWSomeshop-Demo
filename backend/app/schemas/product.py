"""
产品相关的数据模型
定义请求和响应的数据结构
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class ProductBase(BaseModel):
    """产品基础信息"""
    name: str = Field(..., description="产品名称")
    description: Optional[str] = Field(None, description="产品描述")
    image_url: Optional[str] = Field(None, description="产品图片URL")
    points_price: int = Field(..., ge=0, description="积分价格")
    stock_quantity: int = Field(..., ge=0, description="库存数量")
    category: Optional[str] = Field(None, description="产品分类")
    status: str = Field(default="active", description="产品状态")
    usage_instructions: Optional[str] = Field(None, description="使用说明")
    terms_conditions: Optional[str] = Field(None, description="条款条件")
    expiry_date: Optional[datetime] = Field(None, description="过期日期")


class ProductResponse(ProductBase):
    """产品响应"""
    id: str = Field(..., description="产品ID")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")
    is_available: bool = Field(..., description="是否可兑换")

    model_config = ConfigDict(from_attributes=True)


class ProductListItem(BaseModel):
    """产品列表项（简化版）"""
    id: str = Field(..., description="产品ID")
    name: str = Field(..., description="产品名称")
    description: Optional[str] = Field(None, description="产品描述")
    image_url: Optional[str] = Field(None, description="产品图片URL")
    points_price: int = Field(..., description="积分价格")
    stock_quantity: int = Field(..., description="库存数量")
    category: Optional[str] = Field(None, description="产品分类")
    status: str = Field(..., description="产品状态")
    is_available: bool = Field(..., description="是否可兑换")
    created_at: datetime = Field(..., description="创建时间")

    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    """产品列表响应"""
    items: List[ProductListItem] = Field(..., description="产品列表")
    total: int = Field(..., description="总记录数")
    page: int = Field(..., description="当前页码")
    page_size: int = Field(..., description="每页记录数")
    total_pages: int = Field(..., description="总页数")


class ProductFilter(BaseModel):
    """产品筛选参数"""
    page: int = Field(default=1, ge=1, description="页码")
    page_size: int = Field(default=20, ge=1, le=100, description="每页记录数")
    category: Optional[str] = Field(None, description="分类筛选")
    status: Optional[str] = Field(None, description="状态筛选")
    search: Optional[str] = Field(None, description="搜索关键词")
    sort_by: str = Field(default="created_at", description="排序字段")
    sort_order: str = Field(default="desc", description="排序方向")
    available_only: bool = Field(default=False, description="只显示可用产品")


class ProductCategoryResponse(BaseModel):
    """产品分类响应"""
    categories: List[str] = Field(..., description="分类列表")


class CreateProductRequest(ProductBase):
    """创建产品请求"""
    pass


class UpdateProductRequest(BaseModel):
    """更新产品请求"""
    name: Optional[str] = Field(None, description="产品名称")
    description: Optional[str] = Field(None, description="产品描述")
    image_url: Optional[str] = Field(None, description="产品图片URL")
    points_price: Optional[int] = Field(None, ge=0, description="积分价格")
    stock_quantity: Optional[int] = Field(None, ge=0, description="库存数量")
    category: Optional[str] = Field(None, description="产品分类")
    status: Optional[str] = Field(None, description="产品状态")
    usage_instructions: Optional[str] = Field(None, description="使用说明")
    terms_conditions: Optional[str] = Field(None, description="条款条件")
    expiry_date: Optional[datetime] = Field(None, description="过期日期")


class UpdateStockRequest(BaseModel):
    """更新库存请求"""
    stock_quantity: int = Field(..., ge=0, description="新的库存数量")
    reason: str = Field(..., min_length=1, max_length=500, description="更新原因")
