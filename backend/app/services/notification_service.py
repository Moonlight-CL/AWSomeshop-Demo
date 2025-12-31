"""
通知服务
处理邮件发送、模板渲染和重试机制
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
from pathlib import Path
from datetime import datetime
import asyncio

from app.core.config import settings

logger = logging.getLogger(__name__)


class NotificationService:
    """通知服务类"""

    # 邮件模板目录
    TEMPLATE_DIR = Path(__file__).parent.parent / "templates" / "emails"

    @staticmethod
    def _load_template(template_name: str, format: str = "html") -> str:
        """
        加载邮件模板

        Args:
            template_name: 模板名称（不含扩展名）
            format: 格式类型（html 或 txt）

        Returns:
            模板内容字符串
        """
        try:
            template_file = NotificationService.TEMPLATE_DIR / f"{template_name}.{format}"

            if not template_file.exists():
                logger.error(f"Template file not found: {template_file}")
                return ""

            with open(template_file, "r", encoding="utf-8") as f:
                return f.read()

        except Exception as e:
            logger.error(f"Error loading template {template_name}.{format}: {str(e)}")
            return ""

    @staticmethod
    def _render_template(template_content: str, context: Dict[str, Any]) -> str:
        """
        渲染模板，替换变量

        Args:
            template_content: 模板内容
            context: 变量上下文字典

        Returns:
            渲染后的内容
        """
        try:
            # 简单的变量替换，使用 {{ variable }} 语法
            rendered = template_content
            for key, value in context.items():
                placeholder = f"{{{{ {key} }}}}"
                rendered = rendered.replace(placeholder, str(value))

            return rendered

        except Exception as e:
            logger.error(f"Error rendering template: {str(e)}")
            return template_content

    @staticmethod
    async def _send_email_smtp(
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str
    ) -> bool:
        """
        通过SMTP发送邮件

        Args:
            to_email: 收件人邮箱
            subject: 邮件主题
            html_content: HTML内容
            text_content: 纯文本内容

        Returns:
            发送是否成功
        """
        try:
            # 创建邮件对象
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
            message["To"] = to_email

            # 添加纯文本和HTML部分
            text_part = MIMEText(text_content, "plain", "utf-8")
            html_part = MIMEText(html_content, "html", "utf-8")

            message.attach(text_part)
            message.attach(html_part)

            # 在单独的线程中发送邮件（避免阻塞异步事件循环）
            def send_sync():
                if settings.SMTP_USE_TLS:
                    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                        server.starttls()
                        if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                        server.send_message(message)
                else:
                    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                        if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                        server.send_message(message)

            # 在线程池中执行同步操作
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, send_sync)

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Error sending email to {to_email}: {str(e)}")
            return False

    @staticmethod
    async def _send_email_console(
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str
    ) -> bool:
        """
        模拟发送邮件（输出到控制台，用于开发环境）

        Args:
            to_email: 收件人邮箱
            subject: 邮件主题
            html_content: HTML内容
            text_content: 纯文本内容

        Returns:
            总是返回True
        """
        logger.info("=" * 80)
        logger.info("EMAIL (Console Mode - Development)")
        logger.info("=" * 80)
        logger.info(f"To: {to_email}")
        logger.info(f"From: {settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>")
        logger.info(f"Subject: {subject}")
        logger.info("-" * 80)
        logger.info("TEXT CONTENT:")
        logger.info(text_content)
        logger.info("-" * 80)
        logger.info(f"HTML CONTENT LENGTH: {len(html_content)} characters")
        logger.info("=" * 80)

        return True

    @staticmethod
    async def send_email_with_retry(
        to_email: str,
        subject: str,
        template_name: str,
        context: Dict[str, Any],
        max_attempts: Optional[int] = None,
        retry_delay: Optional[int] = None
    ) -> bool:
        """
        发送邮件（带重试机制）

        Args:
            to_email: 收件人邮箱
            subject: 邮件主题
            template_name: 模板名称
            context: 模板变量上下文
            max_attempts: 最大重试次数（默认使用配置值）
            retry_delay: 重试延迟秒数（默认使用配置值）

        Returns:
            发送是否成功
        """
        if max_attempts is None:
            max_attempts = settings.EMAIL_RETRY_ATTEMPTS

        if retry_delay is None:
            retry_delay = settings.EMAIL_RETRY_DELAY

        # 加载并渲染模板
        html_template = NotificationService._load_template(template_name, "html")
        text_template = NotificationService._load_template(template_name, "txt")

        if not html_template and not text_template:
            logger.error(f"No templates found for {template_name}")
            return False

        html_content = NotificationService._render_template(html_template, context)
        text_content = NotificationService._render_template(text_template, context)

        # 根据配置选择发送方式
        send_func = (
            NotificationService._send_email_smtp
            if settings.EMAIL_ENABLED
            else NotificationService._send_email_console
        )

        # 重试机制
        for attempt in range(max_attempts):
            try:
                success = await send_func(to_email, subject, html_content, text_content)

                if success:
                    logger.info(
                        f"Email sent successfully to {to_email} "
                        f"(attempt {attempt + 1}/{max_attempts})"
                    )
                    return True

            except Exception as e:
                logger.error(
                    f"Failed to send email to {to_email} "
                    f"(attempt {attempt + 1}/{max_attempts}): {str(e)}"
                )

            # 如果不是最后一次尝试，等待后重试
            if attempt < max_attempts - 1:
                logger.info(f"Retrying in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)

        logger.error(f"Failed to send email to {to_email} after {max_attempts} attempts")
        return False

    @staticmethod
    async def send_redemption_success_email(
        to_email: str,
        order_id: str,
        product_name: str,
        quantity: int,
        points_spent: int,
        redemption_code: str,
        redemption_time: datetime
    ) -> bool:
        """
        发送兑换成功通知邮件

        Args:
            to_email: 收件人邮箱
            order_id: 订单ID
            product_name: 产品名称
            quantity: 兑换数量
            points_spent: 消耗积分
            redemption_code: 兑换码
            redemption_time: 兑换时间

        Returns:
            发送是否成功
        """
        context = {
            "order_id": order_id,
            "product_name": product_name,
            "quantity": quantity,
            "points_spent": points_spent,
            "redemption_code": redemption_code,
            "redemption_time": redemption_time.strftime("%Y-%m-%d %H:%M:%S")
        }

        return await NotificationService.send_email_with_retry(
            to_email=to_email,
            subject=f"兑换成功通知 - {product_name}",
            template_name="redemption_success",
            context=context
        )
