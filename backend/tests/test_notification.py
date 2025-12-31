"""
测试邮件通知服务
"""

import asyncio
import logging
from datetime import datetime
from app.services.notification_service import NotificationService

# 配置日志输出到控制台
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


async def test_email_notification():
    """测试发送邮件通知"""
    print("Testing email notification service...")

    # 测试发送兑换成功邮件
    success = await NotificationService.send_redemption_success_email(
        to_email="employee1@company.com",
        order_id="test-order-123",
        product_name="测试产品 - 星巴克50元礼品卡",
        quantity=1,
        points_spent=500,
        redemption_code="TEST-CODE-1234-5678",
        redemption_time=datetime.now()
    )

    if success:
        print("✓ Email notification sent successfully!")
    else:
        print("✗ Failed to send email notification")

    return success


if __name__ == "__main__":
    result = asyncio.run(test_email_notification())
    exit(0 if result else 1)
