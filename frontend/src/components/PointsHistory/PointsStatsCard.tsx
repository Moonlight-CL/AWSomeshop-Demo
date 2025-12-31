/**
 * 积分统计卡片组件
 * 显示当前积分余额和统计信息
 */

import { useQuery } from '@tanstack/react-query'
import { pointsApi } from '@/services/api'
import { Card, CardContent } from '@/components/ui/card'
import { Coins, TrendingUp, TrendingDown } from 'lucide-react'

export default function PointsStatsCard() {
  const { data: balance, isLoading } = useQuery({
    queryKey: ['points-balance'],
    queryFn: pointsApi.getBalance,
  })

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-12 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* 当前余额 */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Coins className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">当前积分余额</p>
              <p className="text-4xl font-bold text-gray-900">
                {balance?.current_balance ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {balance?.formatted_balance}
              </p>
            </div>
          </div>

          {/* 积分统计（可选，如果后端提供更多统计数据） */}
          <div className="hidden md:flex items-center gap-6">
            <div className="text-center px-4 py-2 bg-white/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <TrendingUp className="w-4 h-4" />
                <p className="text-sm font-medium">本月获得</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
            <div className="text-center px-4 py-2 bg-white/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                <TrendingDown className="w-4 h-4" />
                <p className="text-sm font-medium">本月使用</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">--</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
