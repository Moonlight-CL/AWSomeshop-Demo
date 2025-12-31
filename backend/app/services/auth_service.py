"""
认证服务
处理用户认证、JWT令牌生成和验证、登录失败锁定
"""

from datetime import datetime, timedelta
from typing import Optional, Dict
import bcrypt
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)

# 登录失败锁定存储（生产环境应使用Redis）
login_attempts: Dict[str, Dict] = {}


class AuthService:
    """认证服务类"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """
        哈希密码

        Args:
            password: 明文密码

        Returns:
            哈希后的密码
        """
        # Truncate password to 72 bytes for bcrypt compatibility
        password_bytes = password.encode('utf-8')[:72]
        # Generate salt and hash the password
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        验证密码

        Args:
            plain_password: 明文密码
            hashed_password: 哈希密码

        Returns:
            密码是否匹配
        """
        # Truncate password to 72 bytes for bcrypt compatibility
        password_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """
        创建JWT访问令牌
        
        Args:
            data: 要编码的数据
            expires_delta: 过期时间增量
            
        Returns:
            JWT令牌字符串
        """
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[dict]:
        """
        验证JWT令牌
        
        Args:
            token: JWT令牌字符串
            
        Returns:
            解码后的数据，如果验证失败返回None
        """
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload
        except JWTError as e:
            logger.warning(f"Token verification failed: {str(e)}")
            return None
    
    @staticmethod
    async def authenticate_user(
        db: AsyncSession,
        username: str,
        password: str
    ) -> Optional[User]:
        """
        认证用户
        
        Args:
            db: 数据库会话
            username: 用户名
            password: 密码
            
        Returns:
            认证成功返回用户对象，失败返回None
        """
        # 查询用户
        result = await db.execute(
            select(User).where(User.username == username, User.is_active == True)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            return None
        
        # 验证密码
        if not AuthService.verify_password(password, user.password_hash):
            return None
        
        return user
    
    @staticmethod
    def check_login_attempts(username: str) -> tuple[bool, Optional[int]]:
        """
        检查登录尝试次数
        
        Args:
            username: 用户名
            
        Returns:
            (是否被锁定, 剩余锁定秒数)
        """
        if username not in login_attempts:
            return False, None
        
        attempt_data = login_attempts[username]
        
        # 检查是否在锁定期内
        if attempt_data.get("locked_until"):
            locked_until = attempt_data["locked_until"]
            if datetime.utcnow() < locked_until:
                remaining_seconds = int((locked_until - datetime.utcnow()).total_seconds())
                return True, remaining_seconds
            else:
                # 锁定期已过，重置
                del login_attempts[username]
                return False, None
        
        return False, None
    
    @staticmethod
    def record_failed_login(username: str) -> None:
        """
        记录登录失败
        
        Args:
            username: 用户名
        """
        if username not in login_attempts:
            login_attempts[username] = {
                "attempts": 0,
                "locked_until": None
            }
        
        login_attempts[username]["attempts"] += 1
        
        # 如果失败3次，锁定5分钟
        if login_attempts[username]["attempts"] >= 3:
            login_attempts[username]["locked_until"] = datetime.utcnow() + timedelta(minutes=5)
            logger.warning(f"User {username} locked due to 3 failed login attempts")
    
    @staticmethod
    def reset_login_attempts(username: str) -> None:
        """
        重置登录尝试记录
        
        Args:
            username: 用户名
        """
        if username in login_attempts:
            del login_attempts[username]
