"""
认证路由
处理用户登录、登出和用户信息查询
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import uuid
import logging

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.services.auth_service import AuthService
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    UserProfile,
    LogoutResponse,
    ErrorResponse
)
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/auth",
    tags=["认证"]
)


@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    responses={
        401: {"model": ErrorResponse, "description": "认证失败"},
        423: {"model": ErrorResponse, "description": "账户被锁定"},
    },
    summary="用户登录",
    description="使用用户名和密码进行登录，返回JWT访问令牌"
)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    用户登录端点
    
    - 验证用户凭据
    - 检查登录失败锁定
    - 生成JWT令牌
    - 返回用户信息
    """
    request_id = str(uuid.uuid4())
    
    # 检查是否被锁定
    is_locked, remaining_seconds = AuthService.check_login_attempts(login_data.username)
    if is_locked:
        logger.warning(
            f"Login attempt for locked account: {login_data.username} | "
            f"Request ID: {request_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail={
                "error": {
                    "code": "ACCOUNT_LOCKED",
                    "message": f"账户已被锁定，请在{remaining_seconds}秒后重试",
                    "remaining_seconds": remaining_seconds,
                    "timestamp": datetime.utcnow().isoformat(),
                    "request_id": request_id,
                }
            }
        )
    
    # 认证用户
    user = await AuthService.authenticate_user(db, login_data.username, login_data.password)
    
    if not user:
        # 记录失败尝试
        AuthService.record_failed_login(login_data.username)
        logger.warning(
            f"Failed login attempt for user: {login_data.username} | "
            f"Request ID: {request_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "code": "INVALID_CREDENTIALS",
                    "message": "用户名或密码错误",
                    "timestamp": datetime.utcnow().isoformat(),
                    "request_id": request_id,
                }
            }
        )
    
    # 重置登录尝试
    AuthService.reset_login_attempts(login_data.username)
    
    # 生成访问令牌
    access_token = AuthService.create_access_token(
        data={"sub": user.id, "username": user.username, "role": user.role}
    )
    
    logger.info(
        f"Successful login for user: {user.username} (ID: {user.id}) | "
        f"Request ID: {request_id}"
    )
    
    # 返回响应
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserProfile.model_validate(user)
    )


@router.get(
    "/profile",
    response_model=UserProfile,
    status_code=status.HTTP_200_OK,
    responses={
        401: {"model": ErrorResponse, "description": "未认证"},
    },
    summary="获取用户信息",
    description="获取当前登录用户的详细信息"
)
async def get_profile(
    current_user: User = Depends(get_current_active_user)
):
    """
    获取用户信息端点

    - 需要有效的JWT令牌
    - 返回当前用户的详细信息
    """
    logger.info(f"Profile accessed by user: {current_user.username} (ID: {current_user.id})")

    return UserProfile.model_validate(current_user)


@router.get(
    "/me",
    response_model=UserProfile,
    status_code=status.HTTP_200_OK,
    responses={
        401: {"model": ErrorResponse, "description": "未认证"},
    },
    summary="获取当前用户信息",
    description="获取当前登录用户的详细信息（/profile的别名）"
)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """
    获取当前用户信息端点（/profile的别名）

    - 需要有效的JWT令牌
    - 返回当前用户的详细信息
    """
    logger.info(f"User info accessed by: {current_user.username} (ID: {current_user.id})")

    return UserProfile.model_validate(current_user)


@router.post(
    "/logout",
    response_model=LogoutResponse,
    status_code=status.HTTP_200_OK,
    responses={
        401: {"model": ErrorResponse, "description": "未认证"},
    },
    summary="用户登出",
    description="登出当前用户（客户端应清除令牌）"
)
async def logout(
    current_user: User = Depends(get_current_active_user)
):
    """
    用户登出端点
    
    - 需要有效的JWT令牌
    - 由于使用无状态JWT，实际的令牌失效由客户端处理
    - 服务端记录登出日志
    """
    logger.info(f"User logged out: {current_user.username} (ID: {current_user.id})")
    
    return LogoutResponse(
        message="登出成功"
    )
