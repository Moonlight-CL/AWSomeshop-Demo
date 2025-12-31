/**
 * API类型定义
 * 与后端API接口对应的TypeScript类型
 */

// ========== 认证相关 ==========
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: UserProfile
}

export interface UserProfile {
  id: string
  username: string
  email: string
  role: string
  is_active: boolean
  created_at: string
}

// ========== 积分相关 ==========
export interface PointsBalance {
  user_id: string
  current_balance: number
  formatted_balance: string
}

export interface PointsHistoryItem {
  id: string
  user_id: string
  amount: number // 积分变动数量（正数为增加，负数为扣除）
  type: string // 积分类型
  reason: string // 变动原因
  operator_id: string | null
  balance_before: number
  balance_after: number
  created_at: string
  updated_at: string
}

export interface PointsHistoryResponse {
  items: PointsHistoryItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// ========== 产品相关 ==========
export interface Product {
  id: string
  name: string
  description: string
  image_url: string | null
  points_price: number
  stock_quantity: number
  category: string | null
  status: string
  is_available: boolean
  created_at: string
}

export interface ProductDetail extends Product {
  usage_instructions: string | null
  terms_conditions: string | null
  expiry_date: string | null
  updated_at: string
}

export interface ProductListResponse {
  items: Product[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface ProductCategoryResponse {
  categories: string[]
}

// ========== 订单相关 ==========
export interface RedemptionRequest {
  product_id: string
  quantity: number
}

export interface RedemptionResponse {
  success: boolean
  message: string
  order_id: string | null
  redemption_code: string | null
}

export interface OrderListItem {
  id: string
  product_id: string
  product_name: string | null
  quantity: number
  points_spent: number
  status: string
  redemption_code: string | null
  created_at: string
}

export interface OrderHistoryResponse {
  items: OrderListItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface OrderDetail {
  id: string
  user_id: string
  product_id: string
  product_name: string
  product_description: string | null
  quantity: number
  points_spent: number
  status: string
  redemption_code: string | null
  created_at: string
  updated_at: string
}

// ========== API错误响应 ==========
export interface ApiError {
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
    request_id: string
  }
}
