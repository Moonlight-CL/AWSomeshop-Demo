"""
用户模型
管理员工和管理员用户信息
"""

from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class User(BaseModel):
    """
    用户模型
    存储员工和管理员的基本信息
    """
    
    __tablename__ = "users"
    
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="employee", nullable=False)  # employee, admin
    is_active = Column(Boolean, default=True, nullable=False)
    
    # 关系
    points = relationship("Points", back_populates="user", uselist=False, cascade="all, delete-orphan")
    points_history = relationship("PointsHistory", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, username={self.username}, role={self.role})>"
