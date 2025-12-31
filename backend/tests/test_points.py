"""
测试积分API端点
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
from app.models.points import Points, PointsHistory
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

    # 创建测试用户和积分数据
    async with TestSessionLocal() as session:
        test_user_id = str(uuid.uuid4())
        test_user = User(
            id=test_user_id,
            username="testuser",
            email="testuser@company.com",
            password_hash=AuthService.hash_password("TestPassword123"),
            role="employee",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            is_active=True,
        )
        session.add(test_user)

        # 创建积分记录
        points = Points(
            id=str(uuid.uuid4()),
            user_id=test_user_id,
            current_balance=1000,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(points)

        # 创建积分历史记录
        history1 = PointsHistory(
            id=str(uuid.uuid4()),
            user_id=test_user_id,
            amount=1000,
            type="allocation",
            reason="月度积分分配",
            balance_before=0,
            balance_after=1000,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(history1)

        history2 = PointsHistory(
            id=str(uuid.uuid4()),
            user_id=test_user_id,
            amount=-200,
            type="deduction",
            reason="兑换产品",
            balance_before=1000,
            balance_after=800,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(history2)

        await session.commit()

    yield

    # 清理数据库
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


def get_auth_token():
    """获取认证令牌"""
    response = client.post(
        "/api/auth/login",
        json={
            "username": "testuser",
            "password": "TestPassword123"
        }
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_get_points_balance_success():
    """测试成功获取积分余额"""
    token = get_auth_token()

    response = client.get(
        "/api/points/balance",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()

    # 验证响应结构
    assert "user_id" in data
    assert "current_balance" in data
    assert "formatted_balance" in data

    # 验证数据
    assert data["current_balance"] == 1000
    assert data["formatted_balance"] == "1,000"


def test_get_points_balance_without_token():
    """测试未提供令牌时获取积分余额"""
    response = client.get("/api/points/balance")

    assert response.status_code == 401  # Not authenticated


def test_get_points_balance_invalid_token():
    """测试使用无效令牌获取积分余额"""
    response = client.get(
        "/api/points/balance",
        headers={"Authorization": "Bearer invalid_token"}
    )

    assert response.status_code == 401


def test_get_points_history_success():
    """测试成功获取积分历史"""
    token = get_auth_token()

    response = client.get(
        "/api/points/history",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()

    # 验证响应结构
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert "total_pages" in data

    # 验证数据
    assert data["total"] == 2
    assert len(data["items"]) == 2
    assert data["page"] == 1
    assert data["page_size"] == 20

    # 验证历史记录排序（应该按时间倒序）
    assert data["items"][0]["type"] == "deduction"
    assert data["items"][1]["type"] == "allocation"


def test_get_points_history_with_pagination():
    """测试分页功能"""
    token = get_auth_token()

    response = client.get(
        "/api/points/history?page=1&page_size=1",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()

    # 验证分页
    assert data["total"] == 2
    assert len(data["items"]) == 1
    assert data["page"] == 1
    assert data["page_size"] == 1
    assert data["total_pages"] == 2


def test_get_points_history_with_type_filter():
    """测试类型筛选"""
    token = get_auth_token()

    response = client.get(
        "/api/points/history?type=allocation",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()

    # 验证筛选结果
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["type"] == "allocation"


def test_get_points_history_without_token():
    """测试未提供令牌时获取积分历史"""
    response = client.get("/api/points/history")

    assert response.status_code == 401  # Not authenticated


def test_get_points_history_invalid_token():
    """测试使用无效令牌获取积分历史"""
    response = client.get(
        "/api/points/history",
        headers={"Authorization": "Bearer invalid_token"}
    )

    assert response.status_code == 401


def test_get_points_history_invalid_page():
    """测试无效的页码"""
    token = get_auth_token()

    response = client.get(
        "/api/points/history?page=0",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 422  # Validation error


def test_get_points_history_invalid_page_size():
    """测试无效的页面大小"""
    token = get_auth_token()

    response = client.get(
        "/api/points/history?page_size=200",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 422  # Validation error
