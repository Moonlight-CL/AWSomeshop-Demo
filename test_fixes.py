#!/usr/bin/env python3
"""
测试积分调整和产品删除功能的脚本
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def get_admin_token():
    """获取管理员token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": "admin", "password": "admin123"}
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"登录失败: {response.status_code}")
        print(response.text)
        return None

def test_points_adjustment(token):
    """测试积分调整功能"""
    print("\n" + "="*50)
    print("测试1: 积分调整功能")
    print("="*50)

    headers = {"Authorization": f"Bearer {token}"}

    # 先获取用户列表
    response = requests.get(
        f"{BASE_URL}/api/admin/points/users",
        headers=headers,
        params={"page": 1, "page_size": 5}
    )

    if response.status_code != 200:
        print(f"❌ 获取用户列表失败: {response.status_code}")
        print(response.text)
        return False

    users = response.json()["items"]
    if not users:
        print("❌ 没有找到用户")
        return False

    user = users[0]
    user_id = user["user_id"]
    old_balance = user["current_balance"]

    print(f"选中用户: {user['username']} (ID: {user_id})")
    print(f"当前积分: {old_balance}")

    # 测试增加积分
    print("\n测试增加积分...")
    adjust_data = {
        "user_id": user_id,
        "amount": 100,
        "reason": "测试积分调整功能 - 增加"
    }

    response = requests.post(
        f"{BASE_URL}/api/admin/points/adjust",
        headers=headers,
        json=adjust_data
    )

    if response.status_code == 200:
        result = response.json()
        print(f"✅ 积分增加成功: {result['message']}")
    else:
        print(f"❌ 积分增加失败: {response.status_code}")
        print(response.text)
        return False

    # 测试扣除积分
    print("\n测试扣除积分...")
    adjust_data = {
        "user_id": user_id,
        "amount": -50,
        "reason": "测试积分调整功能 - 扣除"
    }

    response = requests.post(
        f"{BASE_URL}/api/admin/points/adjust",
        headers=headers,
        json=adjust_data
    )

    if response.status_code == 200:
        result = response.json()
        print(f"✅ 积分扣除成功: {result['message']}")
    else:
        print(f"❌ 积分扣除失败: {response.status_code}")
        print(response.text)
        return False

    # 验证最终余额
    response = requests.get(
        f"{BASE_URL}/api/admin/points/users",
        headers=headers,
        params={"page": 1, "page_size": 5}
    )

    if response.status_code == 200:
        users = response.json()["items"]
        updated_user = next((u for u in users if u["user_id"] == user_id), None)
        if updated_user:
            new_balance = updated_user["current_balance"]
            expected_balance = old_balance + 100 - 50
            print(f"\n原始余额: {old_balance}")
            print(f"预期余额: {expected_balance}")
            print(f"实际余额: {new_balance}")

            if new_balance == expected_balance:
                print("✅ 余额验证成功！")
                return True
            else:
                print("❌ 余额验证失败！")
                return False

    return False

def test_product_deletion(token):
    """测试产品删除功能"""
    print("\n" + "="*50)
    print("测试2: 产品物理删除功能")
    print("="*50)

    headers = {"Authorization": f"Bearer {token}"}

    # 创建一个测试产品（没有兑换记录）
    print("\n创建测试产品...")
    product_data = {
        "name": "测试产品-待删除",
        "description": "这是一个用于测试删除功能的产品",
        "points_price": 100,
        "stock_quantity": 10,
        "category": "测试"
    }

    response = requests.post(
        f"{BASE_URL}/api/admin/products",
        headers=headers,
        json=product_data
    )

    if response.status_code != 201:
        print(f"❌ 创建产品失败: {response.status_code}")
        print(response.text)
        return False

    product = response.json()
    product_id = product["id"]
    print(f"✅ 产品创建成功: {product['name']} (ID: {product_id})")

    # 测试物理删除（应该成功，因为没有兑换记录）
    print(f"\n尝试物理删除产品...")
    response = requests.delete(
        f"{BASE_URL}/api/admin/products/{product_id}/permanent",
        headers=headers
    )

    if response.status_code == 204:
        print(f"✅ 产品物理删除成功！")
    else:
        print(f"❌ 产品物理删除失败: {response.status_code}")
        print(response.text)
        return False

    # 验证产品已被删除
    print("\n验证产品是否已删除...")
    response = requests.get(
        f"{BASE_URL}/api/products",
        headers=headers,
        params={"available_only": False}
    )

    if response.status_code == 200:
        products = response.json()["items"]
        deleted_product = next((p for p in products if p["id"] == product_id), None)

        if deleted_product is None:
            print("✅ 产品已从数据库中删除！")
            return True
        else:
            print("❌ 产品仍然存在于数据库中！")
            return False

    return False

def test_delete_product_with_orders(token):
    """测试删除有兑换记录的产品（应该失败）"""
    print("\n" + "="*50)
    print("测试3: 删除有兑换记录的产品（应该失败）")
    print("="*50)

    headers = {"Authorization": f"Bearer {token}"}

    # 获取已有的产品（可能有兑换记录）
    response = requests.get(
        f"{BASE_URL}/api/products",
        headers=headers,
        params={"available_only": False}
    )

    if response.status_code != 200:
        print(f"❌ 获取产品列表失败: {response.status_code}")
        return False

    products = response.json()["items"]
    if not products:
        print("⚠️  没有找到产品，跳过此测试")
        return True

    # 选择第一个产品尝试删除
    product = products[0]
    product_id = product["id"]

    print(f"尝试删除产品: {product['name']} (ID: {product_id})")

    response = requests.delete(
        f"{BASE_URL}/api/admin/products/{product_id}/permanent",
        headers=headers
    )

    # 如果产品有兑换记录，应该返回400错误
    if response.status_code == 400:
        print(f"✅ 正确阻止了删除有兑换记录的产品")
        print(f"错误信息: {response.json()['detail']}")
        return True
    elif response.status_code == 204:
        print(f"⚠️  产品被成功删除（可能没有兑换记录）")
        return True
    else:
        print(f"❌ 意外的响应状态码: {response.status_code}")
        print(response.text)
        return False

def main():
    print("=" * 50)
    print("开始测试修复功能")
    print("=" * 50)

    # 获取管理员token
    print("\n获取管理员token...")
    token = get_admin_token()

    if not token:
        print("❌ 无法获取管理员token，测试终止")
        return

    print("✅ 成功获取管理员token")

    # 运行测试
    results = []

    # 测试1: 积分调整
    try:
        result = test_points_adjustment(token)
        results.append(("积分调整功能", result))
    except Exception as e:
        print(f"❌ 测试1异常: {str(e)}")
        results.append(("积分调整功能", False))

    # 测试2: 产品物理删除
    try:
        result = test_product_deletion(token)
        results.append(("产品物理删除功能", result))
    except Exception as e:
        print(f"❌ 测试2异常: {str(e)}")
        results.append(("产品物理删除功能", False))

    # 测试3: 删除有兑换记录的产品
    try:
        result = test_delete_product_with_orders(token)
        results.append(("删除保护功能", result))
    except Exception as e:
        print(f"❌ 测试3异常: {str(e)}")
        results.append(("删除保护功能", False))

    # 打印测试结果总结
    print("\n" + "=" * 50)
    print("测试结果总结")
    print("=" * 50)

    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{test_name}: {status}")

    all_passed = all(result for _, result in results)
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 所有测试通过！")
    else:
        print("⚠️  部分测试失败，请检查")
    print("=" * 50)

if __name__ == "__main__":
    main()
