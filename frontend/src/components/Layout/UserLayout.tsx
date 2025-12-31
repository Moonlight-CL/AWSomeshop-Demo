/**
 * 用户端布局组件
 * 包含顶部导航栏和主要内容区域
 */

import { ReactNode } from 'react'
import { ShoppingBag, LogOut, Coins, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { pointsApi } from '@/services/api'

interface UserLayoutProps {
  children: ReactNode
}

export default function UserLayout({ children }: UserLayoutProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // 获取积分余额
  const { data: balance } = useQuery({
    queryKey: ['points-balance'],
    queryFn: pointsApi.getBalance,
  })

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo 和标题 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">AWSomeShop</h1>
              <p className="text-xs text-gray-500">员工积分商城</p>
            </div>
          </div>

          {/* 用户信息和操作 */}
          <div className="flex items-center gap-4">
            {/* 用户欢迎语 */}
            <div className="hidden sm:block text-right">
              <p className="text-sm text-gray-600">
                欢迎, <span className="font-medium text-gray-900">{user?.username}</span>
              </p>
            </div>

            {/* 积分余额 */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <Coins className="w-5 h-5 text-amber-600" />
              <div className="text-right">
                <p className="text-xs text-gray-600">积分</p>
                <p className="text-lg font-bold text-amber-600">
                  {balance?.current_balance ?? 0}
                </p>
              </div>
            </div>

            {/* 管理员入口 */}
            {user?.role === 'admin' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
                className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">管理后台</span>
              </Button>
            )}

            {/* 退出按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">退出</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
