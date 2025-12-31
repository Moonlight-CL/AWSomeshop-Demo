"""
测试主应用端点
"""

import pytest
from fastapi.testclient import TestClient
from main import app

# TestClient automatically sets the host to "testserver" which should be allowed
client = TestClient(app, base_url="http://testserver")


def test_health_check():
    """测试健康检查端点"""
    response = client.get("/health")
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.text}")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "awsome-shop-backend"


def test_root_endpoint():
    """测试根端点"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "AWSomeShop" in data["message"]


def test_api_docs_available_in_debug():
    """测试API文档在调试模式下可用"""
    response = client.get("/docs")
    # 在调试模式下应该返回200或重定向
    assert response.status_code in [200, 307]
