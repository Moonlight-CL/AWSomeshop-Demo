"""
数据库模型基类
提供通用字段和方法
"""

from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.ext.declarative import declared_attr
import uuid

from app.core.database import Base


class BaseModel(Base):
    """
    所有数据模型的基类
    提供通用的ID、时间戳字段
    """
    
    __abstract__ = True
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
    
    @declared_attr
    def __tablename__(cls) -> str:
        """自动生成表名（类名的小写复数形式）"""
        return cls.__name__.lower() + "s"
    
    def to_dict(self) -> dict:
        """将模型转换为字典"""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }
    
    def __repr__(self) -> str:
        """模型的字符串表示"""
        return f"<{self.__class__.__name__}(id={self.id})>"
