"""
管理员权限中间件
验证用户是否具有管理员权限
"""

from fastapi import HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.core.auth import get_current_user


async def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    要求当前用户必须是管理员

    Args:
        current_user: 当前登录用户

    Returns:
        User: 管理员用户对象

    Raises:
        HTTPException: 如果用户不是管理员
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有管理员可以访问此资源"
        )
    return current_user


async def get_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    获取管理员用户（别名函数，语义更清晰）
    """
    return await require_admin(current_user)
