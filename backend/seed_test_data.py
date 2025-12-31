"""
Seed test data script
Creates test users and points data for testing
"""

import asyncio
import uuid
from datetime import datetime

from app.core.database import AsyncSessionLocal, init_db
from app.models.user import User
from app.models.points import Points, PointsHistory
from app.models.product import Product
from app.services.auth_service import AuthService


async def seed_test_data():
    """Seed test data"""
    print("Initializing database...")
    await init_db()

    print("Creating test data...")
    async with AsyncSessionLocal() as session:
        # Create test employee user
        employee_id = str(uuid.uuid4())
        employee = User(
            id=employee_id,
            username="employee1",
            email="employee1@company.com",
            password_hash=AuthService.hash_password("password123"),
            role="employee",
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(employee)

        # Create points record for employee
        employee_points = Points(
            id=str(uuid.uuid4()),
            user_id=employee_id,
            current_balance=1000,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(employee_points)

        # Create points history for employee
        history1 = PointsHistory(
            id=str(uuid.uuid4()),
            user_id=employee_id,
            amount=1000,
            type="allocation",
            reason="月度积分分配",
            balance_before=0,
            balance_after=1000,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(history1)

        # Create test products
        products_data = [
            {
                "name": "星巴克50元礼品卡",
                "description": "可在全国星巴克门店使用的50元电子礼品卡",
                "points_price": 500,
                "stock_quantity": 100,
                "category": "礼品卡",
                "status": "active"
            },
            {
                "name": "京东100元代金券",
                "description": "京东商城100元无门槛代金券",
                "points_price": 1000,
                "stock_quantity": 50,
                "category": "代金券",
                "status": "active"
            },
            {
                "name": "美团外卖30元券",
                "description": "美团外卖30元优惠券，满50可用",
                "points_price": 300,
                "stock_quantity": 200,
                "category": "代金券",
                "status": "active"
            },
            {
                "name": "电影票兑换券",
                "description": "全国各大影院通用电影票兑换券",
                "points_price": 800,
                "stock_quantity": 30,
                "category": "礼品卡",
                "status": "active"
            },
            {
                "name": "喜茶20元券",
                "description": "喜茶全国门店20元代金券",
                "points_price": 200,
                "stock_quantity": 0,
                "category": "代金券",
                "status": "inactive"
            }
        ]

        for product_data in products_data:
            product = Product(
                id=str(uuid.uuid4()),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                **product_data
            )
            session.add(product)

        # Commit all changes
        await session.commit()

        print(f"✓ Created employee user: employee1 (password: password123)")
        print(f"✓ Employee ID: {employee_id}")
        print(f"✓ Employee points balance: 1000")
        print(f"✓ Created 1 points history record")
        print(f"✓ Created {len(products_data)} test products")

    print("\nTest data seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_test_data())
