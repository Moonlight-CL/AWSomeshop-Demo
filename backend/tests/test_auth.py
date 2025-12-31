"""
测试认证API端点
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime
import uuid

from main import app
from app.core.database import get_db, Base
from app.models.user import User
from app.services.auth_service import AuthService

# 创建测试数据库引擎
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def override_get_db():
    """覆盖数据库依赖"""
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app, base_url="http://testserver")


@pytest.fixture(scope="function", autouse=True)
async def setup_database():
    """设置测试数据库"""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # 创建测试用户
    async with TestSessionLocal() as session:
        test_user = User(
            id=str(uuid.uuid4()),
            username="testuser",
            email="testuser@company.com",
            password_hash=AuthService.hash_password("TestPassword123"),
            role="employee",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            is_active=True,
        )
        session.add(test_user)
        await session.commit()
    
    yield
    
    # 清理数据库
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


def test_login_success():
    """测试成功登录"""
    response = client.post(
        "/api/auth/login",
        json={
            "username": "testuser",
            "password": "TestPassword123"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # 验证响应结构
    assert "access_token" in data
    assert "token_type" in data
    assert "user" in data
    assert data["token_type"] == "bearer"
    
    # 验证用户信息
    user = data["user"]
    assert user["username"] == "testuser"
    assert user["email"] == "testuser@company.com"
    assert user["role"] == "employee"
    assert user["is_active"] is True


def test_login_invalid_credentials():
    """测试无效凭据登录"""
    response = client.post(
        "/api/auth/login",
        json={
            "username": "testuser",
            "password": "WrongPassword"
        }
    )
    
    assert response.status_code == 401
    data = response.json()
    
    # 验证错误响应结构
    assert "error" in data
    assert data["error"]["code"] == "INVALID_CREDENTIALS"
    assert "用户名或密码错误" in data["error"]["message"]


def test_login_nonexistent_user():
    """测试不存在的用户登录"""
    response = client.post(
        "/api/auth/login",
        json={
            "username": "nonexistent",
            "password": "TestPassword123"
        }
    )
    
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "INVALID_CREDENTIALS"


def test_login_validation_error():
    """测试登录请求验证错误"""
    # 密码太短
    response = client.post(
        "/api/auth/login",
        json={
            "username": "testuser",
            "password": "short"
        }
    )
    
    assert response.status_code == 422
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "VALIDATION_ERROR"


def test_get_profile_success():
    """测试获取用户信息成功"""
    # 先登录获取令牌
    login_response = client.post(
        "/api/auth/login",
        json={
            "username": "testuser",
            "password": "TestPassword123"
        }
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    # 使用令牌获取用户信息
    response = client.get(
        "/api/auth/profile",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # 验证用户信息
    assert data["username"] == "testuser"
    assert data["email"] == "testuser@company.com"
    assert data["role"] == "employee"
    assert data["is_active"] is True


def test_get_profile_without_token():
    """测试未提供令牌时获取用户信息"""
    response = client.get("/api/auth/profile")
    
    assert response.status_code == 403  # FastAPI HTTPBearer returns 403 when no credentials


def test_get_profile_invalid_token():
    """测试使用无效令牌获取用户信息"""
    response = client.get(
        "/api/auth/profile",
        headers={"Authorization": "Bearer invalid_token"}
    )
    
    assert response.status_code == 401


def test_logout_success():
    """测试登出成功"""
    # 先登录获取令牌
    login_response = client.post(
        "/api/auth/login",
        json={
            "username": "testuser",
            "password": "TestPassword123"
        }
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    # 登出
    response = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "登出成功" in data["message"]


def test_logout_without_token():
    """测试未提供令牌时登出"""
    response = client.post("/api/auth/logout")
    
    assert response.status_code == 403  # FastAPI HTTPBearer returns 403 when no credentials


def test_login_account_lockout():
    """测试账户锁定机制"""
    # 连续3次失败登录
    for _ in range(3):
        response = client.post(
            "/api/auth/login",
            json={
                "username": "testuser",
                "password": "WrongPassword"
            }
        )
        assert response.status_code == 401
    
    # 第4次尝试应该被锁定
    response = client.post(
        "/api/auth/login",
        json={
            "username": "testuser",
            "password": "TestPassword123"  # 即使密码正确也应该被锁定
        }
    )
    
    assert response.status_code == 423  # HTTP 423 Locked
    data = response.json()
    assert data["error"]["code"] == "ACCOUNT_LOCKED"
    assert "remaining_seconds" in data["error"]
