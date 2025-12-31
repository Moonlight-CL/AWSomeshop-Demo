"""
产品模型
管理可兑换的数字产品
"""

from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Product(BaseModel):
    """
    产品模型
    存储数字产品信息（礼品卡、代金券等）
    """
    
    __tablename__ = "products"
    
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    points_price = Column(Integer, nullable=False)
    stock_quantity = Column(Integer, default=0, nullable=False)
    category = Column(String(50), nullable=True, index=True)
    status = Column(String(20), default="active", nullable=False, index=True)  # active, inactive
    usage_instructions = Column(Text, nullable=True)
    terms_conditions = Column(Text, nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    
    # 关系
    orders = relationship("Order", back_populates="product")

    @property
    def is_available(self) -> bool:
        """判断产品是否可兑换"""
        return self.status == "active" and self.stock_quantity > 0

    def __repr__(self) -> str:
        return f"<Product(id={self.id}, name={self.name}, price={self.points_price}, stock={self.stock_quantity})>"
