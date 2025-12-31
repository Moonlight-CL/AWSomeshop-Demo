/**
 * 管理员 API 服务
 * 提供管理员相关的 API 调用
 */

import apiClient from '@/lib/api-client'

// ==================== 类型定义 ====================

export interface AdminPointsOverview {
  total_allocated: number
  total_redeemed: number
  total_remaining: number
  average_balance: number
  total_users: number
  active_users: number
}

export interface UserPointsInfo {
  user_id: string
  username: string
  email: string
  current_balance: number
  total_earned: number
  total_spent: number
  total_allocated?: number
  total_redeemed?: number
  last_activity?: string | null
  last_transaction_date: string | null
}

export interface UserPointsListResponse {
  items: UserPointsInfo[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface PointsHistoryRecord {
  id: string
  user_id: string
  username: string
  amount: number
  type: string
  reason: string
  balance_before: number
  balance_after: number
  created_at: string
}

export interface PointsHistoryListResponse {
  items: PointsHistoryRecord[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface BulkAllocatePointsRequest {
  user_ids: string[]
  amount: number
  reason: string
}

export interface AdjustPointsRequest {
  user_id: string
  amount: number
  reason: string
}

export interface BulkOperationResponse {
  success_count: number
  failed_count: number
  total_processed: number
  errors: Array<{ user_id: string; error: string }>
}

export interface CreateProductRequest {
  name: string
  description?: string
  image_url?: string
  points_price: number
  stock_quantity: number
  category?: string
  status?: string
  usage_instructions?: string
  terms_conditions?: string
  expiry_date?: string
}

export interface UpdateProductRequest {
  name?: string
  description?: string
  image_url?: string
  points_price?: number
  stock_quantity?: number
  category?: string
  status?: string
  usage_instructions?: string
  terms_conditions?: string
  expiry_date?: string
}

export interface UpdateStockRequest {
  quantity_change: number
}

export interface ProductResponse {
  id: string
  name: string
  description: string | null
  image_url: string | null
  points_price: number
  stock_quantity: number
  category: string | null
  status: string
  usage_instructions: string | null
  terms_conditions: string | null
  expiry_date: string | null
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface RedemptionStats {
  total_redemptions: number
  total_points_redeemed: number
  period_redemptions: number
  period_points_redeemed: number
  popular_products: Array<{
    product_id: string
    product_name: string
    redemption_count: number
    points_total: number
  }>
  redemption_trend: Array<{
    date: string
    count: number
    points: number
  }>
}

export interface UserActivityStats {
  total_users: number
  active_users: number
  new_users: number
  user_growth_rate: number
  activity_rate: number
  top_redeemers: Array<{
    user_id: string
    username: string
    redemption_count: number
    points_spent: number
  }>
}

export interface SystemStats {
  users: {
    total: number
    active: number
    new_this_month: number
  }
  points: {
    total_allocated: number
    total_redeemed: number
    total_remaining: number
  }
  products: {
    total: number
    active: number
    out_of_stock: number
  }
  redemptions: {
    total: number
    this_month: number
    pending: number
    completed: number
  }
}

export interface ExportDataRequest {
  data_type: 'users' | 'orders' | 'points' | 'products'
  format: 'csv' | 'json'
  filters?: Record<string, any>
}

export interface AdminOrderRecord {
  id: string
  user_id: string
  username: string
  user_email: string
  product_id: string
  product_name: string
  quantity: number
  points_spent: number
  status: string
  redemption_code: string | null
  created_at: string
}

export interface AdminOrderListResponse {
  items: AdminOrderRecord[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// ==================== API 调用 ====================

export const adminPointsApi = {
  /**
   * 获取积分系统概览
   */
  getOverview: async (): Promise<AdminPointsOverview> => {
    const response = await apiClient.get('/api/admin/points/overview')
    return response.data
  },

  /**
   * 获取用户积分列表
   */
  getUsersList: async (params: {
    page?: number
    page_size?: number
    search?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }): Promise<UserPointsListResponse> => {
    const response = await apiClient.get('/api/admin/points/users', { params })
    return response.data
  },

  /**
   * 批量分配积分
   */
  bulkAllocate: async (
    data: BulkAllocatePointsRequest
  ): Promise<BulkOperationResponse> => {
    const response = await apiClient.post('/api/admin/points/bulk-allocate', data)
    return response.data
  },

  /**
   * 调整用户积分
   */
  adjustPoints: async (
    data: AdjustPointsRequest
  ): Promise<BulkOperationResponse> => {
    const response = await apiClient.post('/api/admin/points/adjust', data)
    return response.data
  },

  /**
   * 获取所有用户的积分历史记录
   */
  getPointsHistory: async (params: {
    page?: number
    page_size?: number
    user_id?: string
    type?: string
    start_date?: string
    end_date?: string
  }): Promise<PointsHistoryListResponse> => {
    const response = await apiClient.get('/api/admin/points/history', { params })
    return response.data
  },
}

export const adminProductsApi = {
  /**
   * 创建产品
   */
  createProduct: async (
    data: CreateProductRequest
  ): Promise<ProductResponse> => {
    const response = await apiClient.post('/api/admin/products', data)
    return response.data
  },

  /**
   * 更新产品
   */
  updateProduct: async (
    productId: string,
    data: UpdateProductRequest
  ): Promise<ProductResponse> => {
    const response = await apiClient.put(`/api/admin/products/${productId}`, data)
    return response.data
  },

  /**
   * 删除产品(软删除，下架)
   */
  deleteProduct: async (productId: string): Promise<void> => {
    await apiClient.delete(`/api/admin/products/${productId}`)
  },

  /**
   * 上架产品(激活下架的产品)
   */
  activateProduct: async (productId: string): Promise<void> => {
    await apiClient.post(`/api/admin/products/${productId}/activate`)
  },

  /**
   * 物理删除产品(只有在没有兑换记录时才能删除)
   */
  permanentlyDeleteProduct: async (productId: string): Promise<void> => {
    await apiClient.delete(`/api/admin/products/${productId}/permanent`)
  },

  /**
   * 更新产品库存
   */
  updateStock: async (
    productId: string,
    data: UpdateStockRequest
  ): Promise<ProductResponse> => {
    const response = await apiClient.patch(
      `/api/admin/products/${productId}/stock`,
      data
    )
    return response.data
  },
}

export const adminStatsApi = {
  /**
   * 获取兑换统计
   */
  getRedemptionStats: async (days: number = 30): Promise<RedemptionStats> => {
    const response = await apiClient.get('/api/admin/stats/redemption', {
      params: { days },
    })
    return response.data
  },

  /**
   * 获取用户活动统计
   */
  getUserActivityStats: async (
    days: number = 30
  ): Promise<UserActivityStats> => {
    const response = await apiClient.get('/api/admin/stats/user-activity', {
      params: { days },
    })
    return response.data
  },

  /**
   * 获取系统综合统计
   */
  getSystemStats: async (): Promise<SystemStats> => {
    const response = await apiClient.get('/api/admin/stats/system')
    return response.data
  },

  /**
   * 导出数据
   */
  exportData: async (data: ExportDataRequest): Promise<Blob> => {
    const response = await apiClient.post('/api/admin/stats/export', data, {
      responseType: 'blob',
    })
    return response.data
  },
}

export const adminOrdersApi = {
  /**
   * 获取所有订单记录
   */
  getAllOrders: async (params: {
    page?: number
    page_size?: number
    status?: string
    user_id?: string
    start_date?: string
    end_date?: string
  }): Promise<AdminOrderListResponse> => {
    const response = await apiClient.get('/api/admin/orders/', { params })
    return response.data
  },
}
