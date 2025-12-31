#!/usr/bin/env python3
"""
重置管理员密码脚本
"""

import asyncio
import sys
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, update
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.services.auth_service import AuthService


async def reset_admin_password():
    """重置管理员密码为 password123"""

    async with AsyncSessionLocal() as db:
        try:
            # 查找admin用户
            result = await db.execute(
                select(User).where(User.username == "admin")
            )
            admin_user = result.scalar_one_or_none()

            if not admin_user:
                print("✗ 未找到admin用户")
                print("请先运行 init_admin.py 创建管理员用户")
                return False

            # 更新密码
            new_password = "password123"
            admin_user.password_hash = AuthService.hash_password(new_password)

            await db.commit()

            print("✓ 管理员密码重置成功!")
            print(f"  用户名: {admin_user.username}")
            print(f"  新密码: {new_password}")
            print(f"  邮箱: {admin_user.email}")
            print(f"  角色: {admin_user.role}")

            return True

        except Exception as e:
            await db.rollback()
            print(f"✗ 密码重置失败: {str(e)}")
            raise


async def main():
    """主函数"""
    print("=" * 50)
    print("重置管理员密码")
    print("=" * 50)
    print()

    try:
        success = await reset_admin_password()

        if success:
            print("\n现在可以使用以下凭据登录:")
            print("  用户名: admin")
            print("  密码: password123")

    except Exception as e:
        print(f"\n操作失败: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
