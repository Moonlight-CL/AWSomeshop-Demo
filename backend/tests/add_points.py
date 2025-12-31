"""
添加积分脚本
"""

import asyncio
from app.core.database import AsyncSessionLocal
from app.services.points_service import PointsService


async def add_points_to_user():
    """给用户添加积分"""
    user_id = "1f80b8ff-3ec7-4f26-b7ea-2213a9a4d931"  # employee1的ID
    amount = 1000  # 添加1000积分

    async with AsyncSessionLocal() as session:
        new_balance = await PointsService.add_points(
            db=session,
            user_id=user_id,
            amount=amount,
            reason="测试积分充值",
            point_type="allocation",
            operator_id=None
        )

        if new_balance is not None:
            print(f"✓ Successfully added {amount} points to user {user_id}")
            print(f"  New balance: {new_balance}")
        else:
            print(f"✗ Failed to add points to user {user_id}")


if __name__ == "__main__":
    asyncio.run(add_points_to_user())
