"""
认证相关的Pydantic schemas
用于请求和响应数据验证
"""

from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional


class LoginRequest(BaseModel):
    """登录请求"""
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    password: str = Field(..., min_length=8, max_length=128, description="密码")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "username": "employee001",
                    "password": "SecurePassword123"
                }
            ]
        }
    }


class UserProfile(BaseModel):
    """用户信息"""
    id: str = Field(..., description="用户ID")
    username: str = Field(..., description="用户名")
    email: str = Field(..., description="邮箱")
    role: str = Field(..., description="角色")
    created_at: datetime = Field(..., description="创建时间")
    is_active: bool = Field(..., description="是否激活")
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "examples": [
                {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "username": "employee001",
                    "email": "employee001@company.com",
                    "role": "employee",
                    "created_at": "2024-01-01T00:00:00",
                    "is_active": True
                }
            ]
        }
    }


class LoginResponse(BaseModel):
    """登录响应"""
    access_token: str = Field(..., description="访问令牌")
    token_type: str = Field(default="bearer", description="令牌类型")
    user: UserProfile = Field(..., description="用户信息")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "token_type": "bearer",
                    "user": {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "username": "employee001",
                        "email": "employee001@company.com",
                        "role": "employee",
                        "created_at": "2024-01-01T00:00:00",
                        "is_active": True
                    }
                }
            ]
        }
    }


class LogoutResponse(BaseModel):
    """登出响应"""
    message: str = Field(..., description="响应消息")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "message": "登出成功"
                }
            ]
        }
    }


class ErrorResponse(BaseModel):
    """错误响应"""
    error: dict = Field(..., description="错误信息")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "error": {
                        "code": "INVALID_CREDENTIALS",
                        "message": "用户名或密码错误",
                        "timestamp": "2024-01-01T00:00:00",
                        "request_id": "550e8400-e29b-41d4-a716-446655440000"
                    }
                }
            ]
        }
    }
