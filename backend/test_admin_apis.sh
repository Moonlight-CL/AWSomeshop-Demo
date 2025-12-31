#!/bin/bash

# Admin API 测试脚本
# 测试管理员后端功能

API_BASE="http://localhost:8000"

echo "========================================="
echo "管理员 API 测试"
echo "========================================="
echo ""

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 测试计数器
PASSED=0
FAILED=0

# 测试函数
test_api() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local auth_header=$5

    echo -n "测试: $test_name ... "

    if [ -n "$data" ]; then
        if [ -n "$auth_header" ]; then
            response=$(curl -s -X $method "$API_BASE$endpoint" \
                -H "Content-Type: application/json" \
                -H "$auth_header" \
                -d "$data")
        else
            response=$(curl -s -X $method "$API_BASE$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        fi
    else
        if [ -n "$auth_header" ]; then
            response=$(curl -s -X $method "$API_BASE$endpoint" \
                -H "$auth_header")
        else
            response=$(curl -s -X $method "$API_BASE$endpoint")
        fi
    fi

    http_code=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$API_BASE$endpoint" \
        ${data:+-H "Content-Type: application/json" -d "$data"} \
        ${auth_header:+-H "$auth_header"})

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ] || [ "$http_code" = "204" ]; then
        echo -e "${GREEN}✓${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        echo "响应: $response" | python3 -m json.tool 2>/dev/null || echo "响应: $response"
    else
        echo -e "${RED}✗${NC} (HTTP $http_code)"
        FAILED=$((FAILED + 1))
        echo "错误响应: $response"
    fi
    echo ""
}

# 1. 登录获取管理员令牌
echo "步骤 1: 获取管理员令牌"
ADMIN_LOGIN='{"username":"admin","password":"password123"}'
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "$ADMIN_LOGIN")

ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}✗ 无法获取管理员令牌${NC}"
    echo "登录响应: $LOGIN_RESPONSE"
    echo ""
    echo "注意: 请确保数据库中存在管理员用户 (username: admin, password: admin123456, role: admin)"
    exit 1
fi

echo -e "${GREEN}✓ 管理员令牌获取成功${NC}"
echo "令牌: ${ADMIN_TOKEN:0:20}..."
echo ""

AUTH_HEADER="Authorization: Bearer $ADMIN_TOKEN"

# 2. 测试管理员积分管理端点
echo "========================================="
echo "测试 2: 管理员积分管理"
echo "========================================="
echo ""

test_api "获取积分系统概览" "GET" "/api/admin/points/overview" "" "$AUTH_HEADER"
test_api "获取用户积分列表" "GET" "/api/admin/points/users?page=1&page_size=10" "" "$AUTH_HEADER"

# 3. 测试管理员产品管理端点
echo "========================================="
echo "测试 3: 管理员产品管理"
echo "========================================="
echo ""

# 创建测试产品
NEW_PRODUCT='{
    "name": "测试产品-管理员创建",
    "description": "这是管理员创建的测试产品",
    "points_price": 500,
    "stock_quantity": 100,
    "category": "测试分类",
    "status": "active"
}'

CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/api/admin/products" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "$NEW_PRODUCT")

PRODUCT_ID=$(echo $CREATE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)

if [ -n "$PRODUCT_ID" ]; then
    echo -e "${GREEN}✓ 产品创建成功${NC} (ID: $PRODUCT_ID)"
    echo "产品信息: $CREATE_RESPONSE" | python3 -m json.tool 2>/dev/null
    echo ""
    PASSED=$((PASSED + 1))

    # 更新产品
    UPDATE_PRODUCT='{
        "name": "测试产品-已更新",
        "points_price": 600
    }'
    test_api "更新产品信息" "PUT" "/api/admin/products/$PRODUCT_ID" "$UPDATE_PRODUCT" "$AUTH_HEADER"

    # 更新库存
    UPDATE_STOCK='{"quantity_change": 50}'
    test_api "更新产品库存" "PATCH" "/api/admin/products/$PRODUCT_ID/stock" "$UPDATE_STOCK" "$AUTH_HEADER"

    # 删除产品
    test_api "删除产品" "DELETE" "/api/admin/products/$PRODUCT_ID" "" "$AUTH_HEADER"
else
    echo -e "${RED}✗ 产品创建失败${NC}"
    echo "响应: $CREATE_RESPONSE"
    echo ""
    FAILED=$((FAILED + 1))
fi

# 4. 测试管理员统计端点
echo "========================================="
echo "测试 4: 管理员统计和报告"
echo "========================================="
echo ""

test_api "获取兑换统计" "GET" "/api/admin/stats/redemption?days=30" "" "$AUTH_HEADER"
test_api "获取用户活动统计" "GET" "/api/admin/stats/user-activity?days=30" "" "$AUTH_HEADER"
test_api "获取系统综合统计" "GET" "/api/admin/stats/system" "" "$AUTH_HEADER"

# 5. 测试权限控制（非管理员访问）
echo "========================================="
echo "测试 5: 权限控制"
echo "========================================="
echo ""

# 尝试使用普通用户令牌访问管理员端点
USER_LOGIN='{"username":"test_user","password":"password123"}'
USER_LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "$USER_LOGIN")

USER_TOKEN=$(echo $USER_LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)

if [ -n "$USER_TOKEN" ]; then
    USER_AUTH_HEADER="Authorization: Bearer $USER_TOKEN"

    echo -n "测试: 普通用户访问管理员端点（应该被拒绝） ... "
    http_code=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE/api/admin/points/overview" \
        -H "$USER_AUTH_HEADER")

    if [ "$http_code" = "403" ]; then
        echo -e "${GREEN}✓${NC} (HTTP $http_code - 正确拒绝)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗${NC} (HTTP $http_code - 应该返回 403)"
        FAILED=$((FAILED + 1))
    fi
    echo ""
fi

# 测试摘要
echo "========================================="
echo "测试摘要"
echo "========================================="
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo "总计: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}所有测试通过! ✓${NC}"
    exit 0
else
    echo -e "${RED}部分测试失败 ✗${NC}"
    exit 1
fi
