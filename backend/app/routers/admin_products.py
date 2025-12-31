"""
管理员产品管理路由
处理管理员的产品CRUD操作
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.core.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.models.audit_log import AuditLog
from app.middleware.admin import get_admin_user
from app.schemas.product import (
    ProductResponse,
    CreateProductRequest,
    UpdateProductRequest,
    UpdateStockRequest,
)

router = APIRouter(prefix="/api/admin/products", tags=["管理员-产品管理"])


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    request: CreateProductRequest,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    创建新产品
    """
    # 创建产品
    product = Product(
        name=request.name,
        description=request.description,
        points_price=request.points_price,
        stock_quantity=request.stock_quantity,
        category=request.category,
        image_url=request.image_url,
        usage_instructions=request.usage_instructions,
        terms_conditions=request.terms_conditions,
        expiry_date=request.expiry_date,
        status="active",
    )

    db.add(product)
    await db.flush()

    # 记录审计日志
    audit_log = AuditLog(
        user_id=admin.id,
        action="create_product",
        resource_type="product",
        resource_id=product.id,
        details={"product_name": product.name, "points_price": product.points_price}
    )
    db.add(audit_log)

    await db.commit()
    await db.refresh(product)

    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    request: UpdateProductRequest,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    更新产品信息
    """
    # 查询产品
    query = select(Product).where(Product.id == product_id)
    product = (await db.execute(query)).scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"产品 {product_id} 不存在"
        )

    # 更新字段
    update_data = request.model_dump(exclude_unset=True)
    changes = {}

    for field, value in update_data.items():
        if value is not None:
            old_value = getattr(product, field)
            if old_value != value:
                changes[field] = {"old": old_value, "new": value}
                setattr(product, field, value)

    if changes:
        # 记录审计日志
        audit_log = AuditLog(
            user_id=admin.id,
            action="update_product",
            resource_type="product",
            resource_id=product.id,
            details={"product_name": product.name, "changes": changes}
        )
        db.add(audit_log)

        await db.commit()
        await db.refresh(product)

    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    删除产品(软删除，设置状态为inactive)
    """
    # 查询产品
    query = select(Product).where(Product.id == product_id)
    product = (await db.execute(query)).scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"产品 {product_id} 不存在"
        )

    # 软删除
    product.status = "inactive"

    # 记录审计日志
    audit_log = AuditLog(
        user_id=admin.id,
        action="delete_product",
        resource_type="product",
        resource_id=product.id,
        details={"product_name": product.name}
    )
    db.add(audit_log)

    await db.commit()


@router.post("/{product_id}/activate", status_code=status.HTTP_204_NO_CONTENT)
async def activate_product(
    product_id: str,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    上架产品(将状态设置为active)
    """
    # 查询产品
    query = select(Product).where(Product.id == product_id)
    product = (await db.execute(query)).scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"产品 {product_id} 不存在"
        )

    # 检查产品是否已经上架
    if product.status == "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"产品 {product.name} 已经是上架状态"
        )

    # 上架
    product.status = "active"

    # 记录审计日志
    audit_log = AuditLog(
        user_id=admin.id,
        action="activate_product",
        resource_type="product",
        resource_id=product.id,
        details={"product_name": product.name}
    )
    db.add(audit_log)

    await db.commit()


@router.delete("/{product_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
async def permanently_delete_product(
    product_id: str,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    物理删除产品
    只有在没有兑换记录时才能删除
    """
    # 查询产品
    query = select(Product).where(Product.id == product_id)
    product = (await db.execute(query)).scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"产品 {product_id} 不存在"
        )

    # 检查是否有兑换记录
    from sqlalchemy import func
    order_count_query = select(func.count(Order.id)).where(Order.product_id == product_id)
    order_count = (await db.execute(order_count_query)).scalar()

    if order_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"产品 {product.name} 存在兑换记录，无法物理删除。请使用下架功能。"
        )

    # 记录审计日志
    audit_log = AuditLog(
        user_id=admin.id,
        action="permanent_delete_product",
        resource_type="product",
        resource_id=product.id,
        details={"product_name": product.name, "points_price": product.points_price}
    )
    db.add(audit_log)

    # 物理删除产品
    await db.delete(product)
    await db.commit()


@router.patch("/{product_id}/stock", response_model=ProductResponse)
async def update_product_stock(
    product_id: str,
    request: UpdateStockRequest,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    更新产品库存
    """
    # 查询产品
    query = select(Product).where(Product.id == product_id)
    product = (await db.execute(query)).scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"产品 {product_id} 不存在"
        )

    old_stock = product.stock_quantity
    product.stock_quantity = request.stock_quantity

    # 根据库存自动更新状态
    if request.stock_quantity == 0:
        product.status = "out_of_stock"
    elif product.status == "out_of_stock" and request.stock_quantity > 0:
        product.status = "active"

    # 记录审计日志
    audit_log = AuditLog(
        user_id=admin.id,
        action="update_stock",
        resource_type="product",
        resource_id=product.id,
        details={
            "product_name": product.name,
            "old_stock": old_stock,
            "new_stock": request.stock_quantity,
            "reason": request.reason
        }
    )
    db.add(audit_log)

    await db.commit()
    await db.refresh(product)

    return product
