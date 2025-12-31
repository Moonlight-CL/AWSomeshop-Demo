"""
API端点集成测试
测试所有后端API端点是否正常工作
"""

import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import app


@pytest.fixture
def client():
    """创建测试客户端"""
    return TestClient(app)


@pytest.fixture
def auth_token(client):
    """获取认证令牌"""
    response = client.post(
        "/api/auth/login",
        json={"username": "employee1", "password": "password123"}
    )
    assert response.status_code == 200
    return response.json()["access_token"]


class TestHealthCheck:
    """健康检查端点测试"""

    
    def test_health_check(self, client):
        """测试健康检查端点"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "awsome-shop-backend"

    
    def test_root_endpoint(self, client):
        """测试根端点"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data


class TestAuthEndpoints:
    """认证端点测试"""

    
    def test_login_success(self, client):
        """测试登录成功"""
        response = client.post(
            "/api/auth/login",
            json={"username": "employee1", "password": "password123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert "user" in data
        assert data["token_type"] == "bearer"

    
    def test_login_invalid_credentials(self, client):
        """测试登录失败"""
        response = client.post(
            "/api/auth/login",
            json={"username": "employee1", "password": "wrongpassword"}
        )
        assert response.status_code == 401

    
    def test_get_profile(self, client, auth_token):
        """测试获取用户信息"""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "username" in data
        assert "email" in data

    
    def test_logout(self, client, auth_token):
        """测试登出"""
        response = client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200


class TestPointsEndpoints:
    """积分端点测试"""

    
    def test_get_points_balance(self, client, auth_token):
        """测试获取积分余额"""
        response = client.get(
            "/api/points/balance",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "current_balance" in data
        assert "formatted_balance" in data

    
    def test_get_points_history(self, client, auth_token):
        """测试获取积分历史"""
        response = client.get(
            "/api/points/history?page=1&page_size=10",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert "total_pages" in data

    
    def test_points_history_pagination(self, client, auth_token):
        """测试积分历史分页"""
        response = client.get(
            "/api/points/history?page=1&page_size=5",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 5

    
    def test_points_without_auth(self, client):
        """测试未认证访问积分端点"""
        response = client.get("/api/points/balance")
        assert response.status_code == 401


class TestProductsEndpoints:
    """产品端点测试"""

    
    def test_get_products_list(self, client, auth_token):
        """测试获取产品列表"""
        response = client.get(
            "/api/products?page=1&page_size=10",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert "total_pages" in data

    
    def test_get_products_with_filters(self, client, auth_token):
        """测试产品列表筛选"""
        response = client.get(
            "/api/products?page=1&page_size=10&available_only=true",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # 验证所有产品都是可用的
        for item in data["items"]:
            assert item["is_available"] is True

    
    def test_get_product_categories(self, client, auth_token):
        """测试获取产品分类"""
        response = client.get(
            "/api/products/categories",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert isinstance(data["categories"], list)

    
    def test_get_product_detail(self, client, auth_token):
        """测试获取产品详情"""
        # 先获取产品列表
        list_response = client.get(
            "/api/products?page=1&page_size=1",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert list_response.status_code == 200
        products = list_response.json()["items"]

        if len(products) > 0:
            product_id = products[0]["id"]

            # 获取产品详情
            detail_response = client.get(
                f"/api/products/{product_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert detail_response.status_code == 200
            data = detail_response.json()
            assert data["id"] == product_id
            assert "name" in data
            assert "points_price" in data
            assert "is_available" in data


class TestOrdersEndpoints:
    """订单端点测试"""

    
    def test_get_order_history(self, client, auth_token):
        """测试获取订单历史"""
        response = client.get(
            "/api/orders/history?page=1&page_size=10",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data

    
    def test_get_order_detail(self, client, auth_token):
        """测试获取订单详情"""
        # 先获取订单列表
        list_response = client.get(
            "/api/orders/history?page=1&page_size=1",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert list_response.status_code == 200
        orders = list_response.json()["items"]

        if len(orders) > 0:
            order_id = orders[0]["id"]

            # 获取订单详情
            detail_response = client.get(
                f"/api/orders/{order_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert detail_response.status_code == 200
            data = detail_response.json()
            assert data["id"] == order_id
            assert "product_name" in data
            assert "redemption_code" in data

    
    def test_redeem_insufficient_points(self, client, auth_token):
        """测试积分不足的兑换"""
        # 获取一个高价产品
        products_response = client.get(
            "/api/products?page=1&page_size=10",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        products = products_response.json()["items"]

        # 找到最贵的产品
        if len(products) > 0:
            expensive_product = max(products, key=lambda p: p["points_price"])

            # 尝试兑换多个（确保超过余额）
            response = client.post(
                "/api/orders/redeem",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={
                    "product_id": expensive_product["id"],
                    "quantity": 999
                }
            )

            # 应该返回失败
            data = response.json()
            assert data["success"] is False
            assert "积分" in data["message"] or "库存" in data["message"]


class TestDataIsolation:
    """数据隔离测试"""

    
    def test_user_can_only_see_own_data(self, client, auth_token):
        """测试用户只能看到自己的数据"""
        # 获取积分余额
        points_response = client.get(
            "/api/points/balance",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert points_response.status_code == 200

        # 获取订单历史
        orders_response = client.get(
            "/api/orders/history",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert orders_response.status_code == 200

        # 验证所有订单都属于当前用户
        user_info_response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        user_id = user_info_response.json()["id"]

        orders = orders_response.json()["items"]
        # 如果有订单,验证user_id（注意：订单列表可能不包含user_id）
        # 通过获取订单详情来验证
        for order in orders[:1]:  # 只检查第一个
            detail_response = client.get(
                f"/api/orders/{order['id']}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert detail_response.status_code == 200
            assert detail_response.json()["user_id"] == user_id
