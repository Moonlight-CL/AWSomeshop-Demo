/**
 * API客户端配置
 * 基于axios的HTTP客户端，支持JWT认证和错误处理
 */

import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios'
import type { ApiError } from '@/types/api'

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Token存储键名
export const TOKEN_KEY = 'awsome_shop_token'
export const USER_KEY = 'awsome_shop_user'

/**
 * 创建axios实例
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * 请求拦截器 - 添加JWT token
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器 - 统一错误处理
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError<ApiError>) => {
    // 处理401未认证错误
    if (error.response?.status === 401) {
      // 清除token和用户信息
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)

      // 如果不在登录页面,重定向到登录页
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    // 提取错误信息
    let errorMessage = '请求失败，请稍后重试'

    if (error.response?.data?.error) {
      errorMessage = error.response.data.error.message
    } else if (error.response?.data) {
      const data = error.response.data as any
      errorMessage = data.detail || data.message || errorMessage
    } else if (error.message) {
      errorMessage = error.message
    }

    // 返回格式化的错误
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    })
  }
)

/**
 * 设置认证token
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * 获取认证token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * 清除认证token
 */
export const clearAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/**
 * 保存用户信息
 */
export const setUserInfo = (user: any): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/**
 * 获取用户信息
 */
export const getUserInfo = (): any | null => {
  const userStr = localStorage.getItem(USER_KEY)
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }
  return null
}

/**
 * 检查是否已认证
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken()
}

export default apiClient
