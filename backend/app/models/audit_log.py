"""
审计日志模型
记录系统关键操作
"""

from sqlalchemy import Column, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class AuditLog(BaseModel):
    """
    审计日志模型
    记录用户登录、积分操作、产品管理等关键操作
    """
    
    __tablename__ = "audit_logs"
    
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(50), nullable=False, index=True)  # login, points_allocation, product_update, etc.
    resource_type = Column(String(50), nullable=True, index=True)  # user, product, order, points
    resource_id = Column(String(36), nullable=True)
    details = Column(JSON, nullable=True)  # 存储操作详情的JSON数据
    ip_address = Column(String(45), nullable=True)  # 支持IPv6
    
    # 关系
    user = relationship("User", back_populates="audit_logs")
    
    def __repr__(self) -> str:
        return f"<AuditLog(id={self.id}, action={self.action}, user_id={self.user_id})>"
