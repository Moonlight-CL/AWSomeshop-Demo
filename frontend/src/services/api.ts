/**
 * API服务方法
 * 封装所有后端API调用
 */

import apiClient from '@/lib/api-client'
import type {
  LoginRequest,
  LoginResponse,
  UserProfile,
  PointsBalance,
  PointsHistoryResponse,
  ProductListResponse,
  ProductDetail,
  ProductCategoryResponse,
  RedemptionRequest,
  RedemptionResponse,
  OrderHistoryResponse,
  OrderDetail,
} from '@/types/api'

// ========== 认证API ==========
export const authApi = {
  /**
   * 用户登录
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', data)
    return response.data
  },

  /**
   * 获取当前用户信息
   */
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/api/auth/me')
    return response.data
  },

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout')
  },
}

// ========== 积分API ==========
export const pointsApi = {
  /**
   * 获取积分余额
   */
  async getBalance(): Promise<PointsBalance> {
    const response = await apiClient.get<PointsBalance>('/api/points/balance')
    return response.data
  },

  /**
   * 获取积分历史
   */
  async getHistory(params: {
    page?: number
    page_size?: number
    type?: string
    start_date?: string
    end_date?: string
  }): Promise<PointsHistoryResponse> {
    const response = await apiClient.get<PointsHistoryResponse>('/api/points/history', { params })
    return response.data
  },
}

// ========== 产品API ==========
export const productsApi = {
  /**
   * 获取产品列表
   */
  async getProducts(params: {
    page?: number
    page_size?: number
    category?: string
    status?: string
    search?: string
    sort_by?: string
    sort_order?: string
    available_only?: boolean
  }): Promise<ProductListResponse> {
    const response = await apiClient.get<ProductListResponse>('/api/products', { params })
    return response.data
  },

  /**
   * 获取产品详情
   */
  async getProductDetail(productId: string): Promise<ProductDetail> {
    const response = await apiClient.get<ProductDetail>(`/api/products/${productId}`)
    return response.data
  },

  /**
   * 获取产品分类列表
   */
  async getCategories(): Promise<ProductCategoryResponse> {
    const response = await apiClient.get<ProductCategoryResponse>('/api/products/categories')
    return response.data
  },
}

// ========== 订单API ==========
export const ordersApi = {
  /**
   * 兑换产品
   */
  async redeemProduct(data: RedemptionRequest): Promise<RedemptionResponse> {
    const response = await apiClient.post<RedemptionResponse>('/api/orders/redeem', data)
    return response.data
  },

  /**
   * 获取订单历史
   */
  async getHistory(params: {
    page?: number
    page_size?: number
    status?: string
  }): Promise<OrderHistoryResponse> {
    const response = await apiClient.get<OrderHistoryResponse>('/api/orders/history', { params })
    return response.data
  },

  /**
   * 获取订单详情
   */
  async getOrderDetail(orderId: string): Promise<OrderDetail> {
    const response = await apiClient.get<OrderDetail>(`/api/orders/${orderId}`)
    return response.data
  },
}
