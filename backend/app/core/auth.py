"""
认证中间件和依赖项
提供JWT令牌验证和用户身份验证
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.user import User
from app.services.auth_service import AuthService

# HTTP Bearer认证方案
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    获取当前认证用户
    
    Args:
        credentials: HTTP Bearer凭据
        db: 数据库会话
        
    Returns:
        当前用户对象
        
    Raises:
        HTTPException: 认证失败时抛出401错误
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的认证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 验证令牌
    token = credentials.credentials
    payload = AuthService.verify_token(token)
    
    if payload is None:
        raise credentials_exception
    
    # 获取用户ID
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # 查询用户
    result = await db.execute(
        select(User).where(User.id == user_id, User.is_active == True)
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    获取当前活跃用户
    
    Args:
        current_user: 当前用户
        
    Returns:
        当前活跃用户对象
        
    Raises:
        HTTPException: 用户未激活时抛出400错误
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户账户未激活"
        )
    return current_user


async def get_current_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    获取当前管理员用户
    
    Args:
        current_user: 当前用户
        
    Returns:
        当前管理员用户对象
        
    Raises:
        HTTPException: 用户不是管理员时抛出403错误
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    return current_user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[str]:
    """
    获取可选的当前用户（用于可选认证的端点）
    
    Args:
        credentials: HTTP Bearer凭据（可选）
        
    Returns:
        用户ID或None
    """
    if credentials is None:
        return None
    
    token = credentials.credentials
    payload = AuthService.verify_token(token)
    
    if payload is None:
        return None
    
    return payload.get("sub")
