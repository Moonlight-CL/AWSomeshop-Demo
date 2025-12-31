"""
应用配置管理
使用Pydantic Settings进行环境变量管理
"""

from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置类"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )
    
    # 应用基础配置
    DEBUG: bool = Field(default=False, description="调试模式")
    SECRET_KEY: str = Field(description="JWT密钥")
    ALGORITHM: str = Field(default="HS256", description="JWT算法")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="访问令牌过期时间(分钟)")
    
    # 数据库配置
    DATABASE_URL: str = Field(description="数据库连接URL")
    DATABASE_POOL_SIZE: int = Field(default=10, description="数据库连接池大小")
    DATABASE_MAX_OVERFLOW: int = Field(default=20, description="数据库连接池最大溢出")
    
    # Redis配置
    REDIS_URL: str = Field(default="redis://localhost:6379", description="Redis连接URL")
    
    # CORS配置
    ALLOWED_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        description="允许的跨域源"
    )
    ALLOWED_HOSTS: List[str] = Field(
        default=["localhost", "127.0.0.1", "testserver", "*"],
        description="允许的主机"
    )
    
    # 邮件配置
    SMTP_HOST: str = Field(default="localhost", description="SMTP服务器地址")
    SMTP_PORT: int = Field(default=587, description="SMTP服务器端口")
    SMTP_USERNAME: str = Field(default="", description="SMTP用户名")
    SMTP_PASSWORD: str = Field(default="", description="SMTP密码")
    SMTP_USE_TLS: bool = Field(default=True, description="SMTP使用TLS")
    MAIL_FROM: str = Field(default="noreply@awsomeshop.com", description="邮件发送者地址")
    MAIL_FROM_NAME: str = Field(default="AWSomeShop", description="邮件发送者名称")
    EMAIL_ENABLED: bool = Field(default=False, description="是否启用邮件发送(开发环境可设为False)")
    EMAIL_RETRY_ATTEMPTS: int = Field(default=3, description="邮件发送失败重试次数")
    EMAIL_RETRY_DELAY: int = Field(default=5, description="邮件重试延迟(秒)")
    
    # AWS配置
    AWS_ACCESS_KEY_ID: str = Field(default="", description="AWS访问密钥ID")
    AWS_SECRET_ACCESS_KEY: str = Field(default="", description="AWS秘密访问密钥")
    AWS_REGION: str = Field(default="us-east-1", description="AWS区域")
    S3_BUCKET_NAME: str = Field(default="awsome-shop-assets", description="S3存储桶名称")
    
    # 文件上传配置
    MAX_FILE_SIZE: int = Field(default=5 * 1024 * 1024, description="最大文件大小(字节)")
    ALLOWED_IMAGE_TYPES: List[str] = Field(
        default=["image/jpeg", "image/png", "image/webp"],
        description="允许的图片类型"
    )


# 全局配置实例
settings = Settings()