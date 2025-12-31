"""
AWSomeShop Backend API
内部积分商城系统后端服务
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import uvicorn
import logging
import traceback
from datetime import datetime
import uuid

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.database import init_db, close_db
from app.routers import auth, points, products, orders, admin_points, admin_products, admin_stats, admin_orders

# 设置日志
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动
    logger.info("Starting AWSomeShop API...")
    if settings.DEBUG:
        await init_db()
    logger.info("AWSomeShop API started successfully")
    
    yield
    
    # 关闭
    logger.info("Shutting down AWSomeShop API...")
    await close_db()
    logger.info("AWSomeShop API shut down successfully")


# 创建FastAPI应用实例
app = FastAPI(
    title="AWSomeShop API",
    description="内部积分商城系统API",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)


# 全局异常处理器
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """处理HTTP异常"""
    request_id = str(uuid.uuid4())
    logger.warning(
        f"HTTP Exception: {exc.status_code} - {exc.detail} | Request ID: {request_id}"
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": request_id,
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """处理请求验证错误"""
    request_id = str(uuid.uuid4())
    logger.warning(f"Validation Error: {exc.errors()} | Request ID: {request_id}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "请求数据验证失败",
                "details": exc.errors(),
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": request_id,
            }
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """处理未捕获的异常"""
    request_id = str(uuid.uuid4())
    logger.error(
        f"Unhandled Exception: {str(exc)} | Request ID: {request_id}\n"
        f"Traceback: {traceback.format_exc()}"
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "服务器内部错误，请稍后重试" if not settings.DEBUG else str(exc),
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": request_id,
            }
        },
    )


# 请求日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """记录所有HTTP请求"""
    request_id = str(uuid.uuid4())
    logger.info(f"Request: {request.method} {request.url.path} | Request ID: {request_id}")
    
    try:
        response = await call_next(request)
        logger.info(
            f"Response: {request.method} {request.url.path} - {response.status_code} | "
            f"Request ID: {request_id}"
        )
        return response
    except Exception as e:
        logger.error(f"Request failed: {str(e)} | Request ID: {request_id}")
        raise


# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 添加受信任主机中间件（仅在非调试模式下启用）
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS,
    )


# 注册用户路由
app.include_router(auth.router)
app.include_router(points.router)
app.include_router(products.router)
app.include_router(orders.router)

# 注册管理员路由
app.include_router(admin_points.router)
app.include_router(admin_products.router)
app.include_router(admin_stats.router)
app.include_router(admin_orders.router)


@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy", "service": "awsome-shop-backend"}


@app.get("/")
async def root():
    """根端点"""
    return {"message": "Welcome to AWSomeShop API"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
    )