"""
产品管理路由
处理产品列表查询和产品详情查询
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import math

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.services.product_service import ProductService
from app.schemas.product import (
    ProductResponse,
    ProductListResponse,
    ProductListItem,
    ProductCategoryResponse
)

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=ProductListResponse)
async def get_products(
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页记录数"),
    category: Optional[str] = Query(default=None, description="分类筛选"),
    status: Optional[str] = Query(default=None, description="状态筛选"),
    search: Optional[str] = Query(default=None, description="搜索关键词"),
    sort_by: str = Query(default="created_at", description="排序字段"),
    sort_order: str = Query(default="desc", description="排序方向"),
    available_only: bool = Query(default=True, description="只显示可用产品"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    查询产品列表

    - **page**: 页码（从1开始）
    - **page_size**: 每页记录数（1-100）
    - **category**: 分类筛选（可选）
    - **status**: 状态筛选（可选：active, inactive）
    - **search**: 搜索关键词（搜索产品名称和描述）
    - **sort_by**: 排序字段（name, points_price, created_at, stock_quantity）
    - **sort_order**: 排序方向（asc, desc）
    - **available_only**: 只显示可用产品（默认为true）
    - **返回**: 产品列表（分页）
    - **权限**: 需要登录
    """
    try:
        # 验证排序字段
        valid_sort_fields = ["name", "points_price", "created_at", "stock_quantity"]
        if sort_by not in valid_sort_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"无效的排序字段，支持的字段: {', '.join(valid_sort_fields)}"
            )

        # 验证排序方向
        if sort_order not in ["asc", "desc"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无效的排序方向，支持: asc, desc"
            )

        # 计算分页偏移量
        skip = (page - 1) * page_size

        # 查询产品列表
        products, total = await ProductService.get_products(
            db=db,
            skip=skip,
            limit=page_size,
            category=category,
            status=status,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
            available_only=available_only
        )

        # 计算总页数
        total_pages = math.ceil(total / page_size) if total > 0 else 0

        # 转换为响应模型
        items = []
        for product in products:
            # 先将product转为字典
            product_dict = {
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "image_url": product.image_url,
                "points_price": product.points_price,
                "stock_quantity": product.stock_quantity,
                "category": product.category,
                "status": product.status,
                "created_at": product.created_at,
                "is_available": ProductService.is_product_available(product)
            }
            item = ProductListItem.model_validate(product_dict)
            items.append(item)

        return ProductListResponse(
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
            detail=f"查询产品列表失败: {str(e)}"
        )


@router.get("/categories", response_model=ProductCategoryResponse)
async def get_product_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取所有产品分类

    - **返回**: 分类列表
    - **权限**: 需要登录
    """
    try:
        categories = await ProductService.get_product_categories(db)
        return ProductCategoryResponse(categories=categories)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"查询产品分类失败: {str(e)}"
        )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product_detail(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    查询产品详情

    - **product_id**: 产品ID
    - **返回**: 产品详细信息
    - **权限**: 需要登录
    """
    try:
        # 查询产品
        product = await ProductService.get_product_by_id(db, product_id)

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="产品不存在"
            )

        # 转换为响应模型，手动构建字典包含is_available
        product_dict = {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "image_url": product.image_url,
            "points_price": product.points_price,
            "stock_quantity": product.stock_quantity,
            "category": product.category,
            "status": product.status,
            "usage_instructions": product.usage_instructions,
            "terms_conditions": product.terms_conditions,
            "expiry_date": product.expiry_date,
            "created_at": product.created_at,
            "updated_at": product.updated_at,
            "is_available": ProductService.is_product_available(product)
        }
        response = ProductResponse.model_validate(product_dict)

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"查询产品详情失败: {str(e)}"
        )
