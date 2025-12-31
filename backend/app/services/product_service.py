"""
产品服务
处理产品查询、筛选、库存管理和可用性验证
"""

from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, asc, func
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
import logging

from app.models.product import Product

logger = logging.getLogger(__name__)


class ProductService:
    """产品服务类"""

    @staticmethod
    async def get_product_by_id(
        db: AsyncSession,
        product_id: str
    ) -> Optional[Product]:
        """
        根据ID查询产品

        Args:
            db: 数据库会话
            product_id: 产品ID

        Returns:
            产品对象，如果不存在返回None
        """
        try:
            result = await db.execute(
                select(Product).where(Product.id == product_id)
            )
            return result.scalar_one_or_none()
        except SQLAlchemyError as e:
            logger.error(f"Error getting product {product_id}: {str(e)}")
            raise

    @staticmethod
    async def get_products(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        category: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        available_only: bool = False
    ) -> Tuple[List[Product], int]:
        """
        查询产品列表

        Args:
            db: 数据库会话
            skip: 跳过的记录数（分页）
            limit: 返回的记录数（分页）
            category: 分类筛选（可选）
            status: 状态筛选（可选）
            search: 搜索关键词（可选）
            sort_by: 排序字段（name, points_price, created_at, stock_quantity）
            sort_order: 排序方向（asc, desc）
            available_only: 只返回可用产品（库存>0且状态为active）

        Returns:
            (产品列表, 总记录数)
        """
        try:
            # 构建查询条件
            conditions = []

            if category:
                conditions.append(Product.category == category)

            if status:
                conditions.append(Product.status == status)

            if available_only:
                conditions.append(Product.status == "active")
                conditions.append(Product.stock_quantity > 0)

            if search:
                search_pattern = f"%{search}%"
                conditions.append(
                    or_(
                        Product.name.ilike(search_pattern),
                        Product.description.ilike(search_pattern)
                    )
                )

            # 查询总数
            count_query = select(func.count()).select_from(Product)
            if conditions:
                count_query = count_query.where(and_(*conditions))
            count_result = await db.execute(count_query)
            total = count_result.scalar()

            # 构建排序
            sort_column = getattr(Product, sort_by, Product.created_at)
            if sort_order == "asc":
                order_by = asc(sort_column)
            else:
                order_by = desc(sort_column)

            # 查询产品列表
            query = select(Product)
            if conditions:
                query = query.where(and_(*conditions))
            query = query.order_by(order_by).offset(skip).limit(limit)

            result = await db.execute(query)
            products = result.scalars().all()

            return list(products), total

        except SQLAlchemyError as e:
            logger.error(f"Error getting products: {str(e)}")
            raise

    @staticmethod
    async def check_product_availability(
        db: AsyncSession,
        product_id: str
    ) -> Tuple[bool, str]:
        """
        检查产品是否可兑换

        Args:
            db: 数据库会话
            product_id: 产品ID

        Returns:
            (是否可用, 错误信息)
        """
        try:
            product = await ProductService.get_product_by_id(db, product_id)

            if not product:
                return False, "产品不存在"

            if product.status != "active":
                return False, "产品已下架"

            if product.stock_quantity <= 0:
                return False, "产品库存不足"

            # 检查是否过期
            if product.expiry_date and product.expiry_date < datetime.utcnow():
                return False, "产品已过期"

            return True, ""

        except SQLAlchemyError as e:
            logger.error(f"Error checking product availability {product_id}: {str(e)}")
            raise

    @staticmethod
    async def update_stock(
        db: AsyncSession,
        product_id: str,
        quantity_change: int
    ) -> Tuple[bool, str]:
        """
        更新产品库存

        Args:
            db: 数据库会话
            product_id: 产品ID
            quantity_change: 库存变化量（正数增加，负数减少）

        Returns:
            (是否成功, 错误信息)
        """
        try:
            product = await ProductService.get_product_by_id(db, product_id)

            if not product:
                return False, "产品不存在"

            # 计算新库存
            new_stock = product.stock_quantity + quantity_change

            # 检查库存不能为负数
            if new_stock < 0:
                return False, f"库存不足，当前库存: {product.stock_quantity}"

            # 更新库存
            product.stock_quantity = new_stock

            # 如果库存为0，自动设置状态为inactive
            if new_stock == 0 and product.status == "active":
                product.status = "inactive"
                logger.info(f"Product {product_id} marked as inactive due to zero stock")

            await db.commit()
            await db.refresh(product)

            logger.info(f"Updated stock for product {product_id}: {product.stock_quantity - quantity_change} -> {new_stock}")
            return True, ""

        except SQLAlchemyError as e:
            await db.rollback()
            logger.error(f"Error updating stock for product {product_id}: {str(e)}")
            return False, f"更新库存失败: {str(e)}"

    @staticmethod
    async def validate_product_id(
        db: AsyncSession,
        product_id: str
    ) -> bool:
        """
        验证产品ID是否有效

        Args:
            db: 数据库会话
            product_id: 产品ID

        Returns:
            产品ID是否有效
        """
        try:
            product = await ProductService.get_product_by_id(db, product_id)
            return product is not None
        except SQLAlchemyError as e:
            logger.error(f"Error validating product ID {product_id}: {str(e)}")
            raise

    @staticmethod
    async def get_product_categories(
        db: AsyncSession
    ) -> List[str]:
        """
        获取所有产品分类

        Args:
            db: 数据库会话

        Returns:
            分类列表
        """
        try:
            result = await db.execute(
                select(Product.category)
                .distinct()
                .where(Product.category.isnot(None))
            )
            categories = result.scalars().all()
            return list(categories)
        except SQLAlchemyError as e:
            logger.error(f"Error getting product categories: {str(e)}")
            raise

    @staticmethod
    def is_product_available(product: Product) -> bool:
        """
        判断产品是否可用（内存判断，不查询数据库）

        Args:
            product: 产品对象

        Returns:
            产品是否可用
        """
        if product.status != "active":
            return False

        if product.stock_quantity <= 0:
            return False

        if product.expiry_date and product.expiry_date < datetime.utcnow():
            return False

        return True
