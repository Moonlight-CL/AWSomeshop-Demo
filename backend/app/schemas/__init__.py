# Pydantic schemas package

from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    UserProfile,
    LogoutResponse,
    ErrorResponse
)

from app.schemas.points import (
    PointsBalanceResponse,
    PointsHistoryItem,
    PointsHistoryResponse,
    PointsHistoryFilter,
    AddPointsRequest,
    DeductPointsRequest,
    PointsOperationResponse
)

from app.schemas.product import (
    ProductBase,
    ProductResponse,
    ProductListItem,
    ProductListResponse,
    ProductFilter,
    ProductCategoryResponse,
    CreateProductRequest,
    UpdateProductRequest,
    UpdateStockRequest
)

from app.schemas.order import (
    RedemptionRequest,
    RedemptionConfirmation,
    RedemptionResponse,
    OrderBase,
    OrderResponse,
    OrderListItem,
    OrderHistoryResponse,
    OrderDetailResponse
)

__all__ = [
    "LoginRequest",
    "LoginResponse",
    "UserProfile",
    "LogoutResponse",
    "ErrorResponse",
    "PointsBalanceResponse",
    "PointsHistoryItem",
    "PointsHistoryResponse",
    "PointsHistoryFilter",
    "AddPointsRequest",
    "DeductPointsRequest",
    "PointsOperationResponse",
    "ProductBase",
    "ProductResponse",
    "ProductListItem",
    "ProductListResponse",
    "ProductFilter",
    "ProductCategoryResponse",
    "CreateProductRequest",
    "UpdateProductRequest",
    "UpdateStockRequest",
    "RedemptionRequest",
    "RedemptionConfirmation",
    "RedemptionResponse",
    "OrderBase",
    "OrderResponse",
    "OrderListItem",
    "OrderHistoryResponse",
    "OrderDetailResponse",
]
