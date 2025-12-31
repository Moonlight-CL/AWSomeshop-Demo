"""
积分模型
管理用户积分余额和历史记录
"""

from sqlalchemy import Column, String, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Points(BaseModel):
    """
    积分余额模型
    存储用户当前积分余额
    """
    
    __tablename__ = "points"
    
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    current_balance = Column(Integer, default=0, nullable=False)
    
    # 关系
    user = relationship("User", back_populates="points")
    
    def __repr__(self) -> str:
        return f"<Points(user_id={self.user_id}, balance={self.current_balance})>"


class PointsHistory(BaseModel):
    """
    积分历史记录模型
    记录所有积分变动
    """
    
    __tablename__ = "points_history"
    
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)  # 正数为增加，负数为扣除
    type = Column(String(20), nullable=False)  # allocation, deduction, adjustment
    reason = Column(Text, nullable=False)
    operator_id = Column(String(36), nullable=True)  # 操作人ID（管理员操作时记录）
    balance_before = Column(Integer, nullable=False)
    balance_after = Column(Integer, nullable=False)
    
    # 关系
    user = relationship("User", back_populates="points_history")
    
    def __repr__(self) -> str:
        return f"<PointsHistory(user_id={self.user_id}, amount={self.amount}, type={self.type})>"
