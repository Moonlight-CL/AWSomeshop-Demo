"""
订单模型
管理积分兑换订单
"""

from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Order(BaseModel):
    """
    订单模型
    记录用户的积分兑换订单
    """
    
    __tablename__ = "orders"
    
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity = Column(Integer, default=1, nullable=False)
    points_spent = Column(Integer, nullable=False)
    status = Column(String(20), default="processing", nullable=False, index=True)  # processing, completed, cancelled
    redemption_code = Column(String(100), nullable=True)
    
    # 关系
    user = relationship("User", back_populates="orders")
    product = relationship("Product", back_populates="orders")
    
    def __repr__(self) -> str:
        return f"<Order(id={self.id}, user_id={self.user_id}, product_id={self.product_id}, status={self.status})>"
