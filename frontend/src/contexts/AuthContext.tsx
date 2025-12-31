/**
 * 认证上下文
 * 管理全局认证状态和用户信息
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/services/api'
import { setAuthToken, clearAuthToken, getUserInfo, setUserInfo, isAuthenticated } from '@/lib/api-client'
import type { UserProfile, LoginRequest } from '@/types/api'

interface AuthContextType {
  user: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // 初始化 - 从localStorage加载用户信息
  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated()) {
        const savedUser = getUserInfo()
        if (savedUser) {
          setUser(savedUser)
          // 尝试刷新用户信息
          try {
            const profile = await authApi.getProfile()
            setUser(profile)
            setUserInfo(profile)
          } catch (error) {
            // Token可能过期,清除认证状态
            // 但先保留savedUser，让用户能看到页面，除非明确是401错误
            const err = error as any
            if (err.status === 401) {
              clearAuthToken()
              setUser(null)
            }
            // 其他错误（网络问题等）保留已保存的用户信息
          }
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials: LoginRequest) => {
    const response = await authApi.login(credentials)
    setAuthToken(response.access_token)
    setUser(response.user)
    setUserInfo(response.user)
    // 不在这里导航，让Login组件自己处理导航
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      // 即使API调用失败也清除本地状态
      console.error('Logout API failed:', error)
    } finally {
      clearAuthToken()
      setUser(null)
      navigate('/login')
    }
  }

  const refreshUser = async () => {
    try {
      const profile = await authApi.getProfile()
      setUser(profile)
      setUserInfo(profile)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
