#!/usr/bin/env python3
"""
初始化管理员用户脚本
创建默认的管理员账户用于系统管理
"""

import asyncio
import sys
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.points import Points
from app.services.auth_service import AuthService


async def init_admin_user():
    """创建管理员用户"""

    async with AsyncSessionLocal() as db:
        try:
            # 检查是否已存在admin用户
            result = await db.execute(
                select(User).where(User.username == "admin")
            )
            existing_admin = result.scalar_one_or_none()

            if existing_admin:
                print("✓ 管理员用户已存在")
                print(f"  用户名: {existing_admin.username}")
                print(f"  邮箱: {existing_admin.email}")
                print(f"  角色: {existing_admin.role}")
                return

            # 创建管理员用户
            print("创建管理员用户...")
            admin_user = User(
                username="admin",
                email="admin@awsomeshop.com",
                hashed_password=AuthService.hash_password("password123"),
                role="admin",
                is_active=True,
            )

            db.add(admin_user)
            await db.flush()  # 获取用户ID

            # 为管理员创建积分记录（管理员也可以有积分）
            admin_points = Points(
                user_id=admin_user.id,
                current_balance=10000,  # 给管理员10000初始积分
            )

            db.add(admin_points)
            await db.commit()

            print("✓ 管理员用户创建成功!")
            print(f"  用户名: {admin_user.username}")
            print(f"  密码: password123")
            print(f"  邮箱: {admin_user.email}")
            print(f"  角色: {admin_user.role}")
            print(f"  初始积分: {admin_points.current_balance}")
            print("\n⚠️  请在生产环境中修改默认密码!")

        except Exception as e:
            await db.rollback()
            print(f"✗ 创建管理员用户失败: {str(e)}")
            raise


async def create_test_users():
    """创建一些测试用户"""

    async with AsyncSessionLocal() as db:
        try:
            # 检查是否已有测试用户
            result = await db.execute(
                select(User).where(User.username == "test_user")
            )
            existing_user = result.scalar_one_or_none()

            if existing_user:
                print("✓ 测试用户已存在")
                return

            print("\n创建测试用户...")

            # 创建普通测试用户
            test_users = [
                {
                    "username": "test_user",
                    "email": "test@example.com",
                    "password": "password123",
                    "role": "user",
                    "points": 1000,
                },
                {
                    "username": "alice",
                    "email": "alice@example.com",
                    "password": "password123",
                    "role": "user",
                    "points": 2000,
                },
                {
                    "username": "bob",
                    "email": "bob@example.com",
                    "password": "password123",
                    "role": "user",
                    "points": 1500,
                },
            ]

            for user_data in test_users:
                user = User(
                    username=user_data["username"],
                    email=user_data["email"],
                    hashed_password=AuthService.hash_password(user_data["password"]),
                    role=user_data["role"],
                    is_active=True,
                )

                db.add(user)
                await db.flush()

                # 创建积分记录
                points = Points(
                    user_id=user.id,
                    current_balance=user_data["points"],
                )

                db.add(points)
                print(f"  ✓ 创建用户: {user_data['username']} (积分: {user_data['points']})")

            await db.commit()
            print("✓ 测试用户创建成功!")

        except Exception as e:
            await db.rollback()
            print(f"✗ 创建测试用户失败: {str(e)}")
            raise


async def main():
    """主函数"""
    print("=" * 50)
    print("AWSomeShop 数据库初始化")
    print("=" * 50)
    print()

    try:
        # 创建管理员用户
        await init_admin_user()

        # 创建测试用户
        await create_test_users()

        print("\n" + "=" * 50)
        print("数据库初始化完成!")
        print("=" * 50)
        print("\n登录信息:")
        print("  管理员: admin / password123")
        print("  测试用户: test_user / password123")
        print("  测试用户: alice / password123")
        print("  测试用户: bob / password123")

    except Exception as e:
        print(f"\n初始化失败: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
