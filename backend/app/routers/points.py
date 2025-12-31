"""
积分管理路由
处理积分余额查询和历史记录查询
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime
import math

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.services.points_service import PointsService
from app.schemas.points import (
    PointsBalanceResponse,
    PointsHistoryResponse,
    PointsHistoryItem,
    PointsHistoryFilter
)

router = APIRouter(prefix="/api/points", tags=["points"])


@router.get("/balance", response_model=PointsBalanceResponse)
async def get_points_balance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    查询当前用户的积分余额

    - **返回**: 用户的当前积分余额
    - **权限**: 需要登录
    - **数据隔离**: 只能查询自己的积分
    """
    try:
        # 查询用户积分余额
        balance = await PointsService.get_user_balance(db, current_user.id)

        if balance is None:
            # 如果用户没有积分记录，初始化为0
            await PointsService.initialize_user_points(db, current_user.id, 0)
            balance = 0

        # 返回格式化的积分余额
        return PointsBalanceResponse(
            user_id=current_user.id,
            current_balance=balance,
            formatted_balance=PointsService.format_points(balance)
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"查询积分余额失败: {str(e)}"
        )


@router.get("/history", response_model=PointsHistoryResponse)
async def get_points_history(
    page: int = Query(default=1, ge=1, description="页码"),
    page_size: int = Query(default=20, ge=1, le=100, description="每页记录数"),
    type: Optional[str] = Query(default=None, description="积分类型筛选"),
    start_date: Optional[datetime] = Query(default=None, description="开始日期"),
    end_date: Optional[datetime] = Query(default=None, description="结束日期"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    查询当前用户的积分变动历史

    - **page**: 页码（从1开始）
    - **page_size**: 每页记录数（1-100）
    - **type**: 积分类型筛选（可选：allocation, deduction, adjustment, redemption）
    - **start_date**: 开始日期（可选）
    - **end_date**: 结束日期（可选）
    - **返回**: 积分历史记录列表（按时间倒序）
    - **权限**: 需要登录
    - **数据隔离**: 只能查询自己的积分历史
    """
    try:
        # 计算分页偏移量
        skip = (page - 1) * page_size

        # 查询积分历史
        history, total = await PointsService.get_points_history(
            db=db,
            user_id=current_user.id,
            skip=skip,
            limit=page_size,
            point_type=type,
            start_date=start_date,
            end_date=end_date
        )

        # 计算总页数
        total_pages = math.ceil(total / page_size) if total > 0 else 0

        # 转换为响应模型
        items = [PointsHistoryItem.model_validate(item) for item in history]

        return PointsHistoryResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"查询积分历史失败: {str(e)}"
        )
