/**
 * 管理员统计报表组件
 * 显示系统综合统计、兑换统计、用户活动等数据
 */

import { useQuery } from '@tanstack/react-query'
import { adminStatsApi } from '@/services/adminApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Coins, Package, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react'

export default function AdminStats() {
  // 获取系统统计
  const { data: systemStats, isLoading: isLoadingSystem } = useQuery({
    queryKey: ['admin-system-stats'],
    queryFn: adminStatsApi.getSystemStats,
  })

  // 获取兑换统计
  const { data: redemptionStats, isLoading: isLoadingRedemption } = useQuery({
    queryKey: ['admin-redemption-stats'],
    queryFn: () => adminStatsApi.getRedemptionStats(30),
  })

  // 获取用户活动统计
  const { data: userActivityStats, isLoading: isLoadingUserActivity } = useQuery({
    queryKey: ['admin-user-activity-stats'],
    queryFn: () => adminStatsApi.getUserActivityStats(30),
  })

  if (isLoadingSystem || isLoadingRedemption || isLoadingUserActivity) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载统计数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 系统概览卡片 */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">系统概览</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 用户统计 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                总用户数
              </CardTitle>
              <Users className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {systemStats?.users.total.toLocaleString() || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                活跃用户: {systemStats?.users.active || 0} |{' '}
                本月新增: {systemStats?.users.new_this_month || 0}
              </p>
            </CardContent>
          </Card>

          {/* 积分统计 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                积分总量
              </CardTitle>
              <Coins className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {systemStats?.points.total_allocated.toLocaleString() || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                已兑换: {systemStats?.points.total_redeemed.toLocaleString() || 0} |{' '}
                剩余: {systemStats?.points.total_remaining.toLocaleString() || 0}
              </p>
            </CardContent>
          </Card>

          {/* 产品统计 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                产品总数
              </CardTitle>
              <Package className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {systemStats?.products.total || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                可用: {systemStats?.products.active || 0} |{' '}
                缺货: {systemStats?.products.out_of_stock || 0}
              </p>
            </CardContent>
          </Card>

          {/* 兑换统计 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                兑换订单
              </CardTitle>
              <ShoppingCart className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {systemStats?.redemptions.total.toLocaleString() || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                本月: {systemStats?.redemptions.this_month || 0} |{' '}
                待处理: {systemStats?.redemptions.pending || 0}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 用户活动统计 */}
      {userActivityStats && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            用户活动 (最近30天)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">活跃度统计</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">活跃用户数</span>
                  <span className="font-semibold text-gray-900">
                    {userActivityStats.active_users.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">新增用户数</span>
                  <span className="font-semibold text-gray-900">
                    {userActivityStats.new_users.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">活跃率</span>
                  <div className="flex items-center gap-1">
                    {userActivityStats.activity_rate > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className="font-semibold text-gray-900">
                      {(userActivityStats.activity_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">用户增长率</span>
                  <div className="flex items-center gap-1">
                    {userActivityStats.user_growth_rate > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className="font-semibold text-gray-900">
                      {(userActivityStats.user_growth_rate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 兑换活跃用户 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">兑换活跃用户 TOP 5</CardTitle>
              </CardHeader>
              <CardContent>
                {userActivityStats.top_redeemers.length > 0 ? (
                  <div className="space-y-2">
                    {userActivityStats.top_redeemers.map((user, index) => (
                      <div
                        key={user.user_id}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium">
                            {index + 1}
                          </span>
                          <span className="text-sm text-gray-900">
                            {user.username}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {user.redemption_count} 次
                          </p>
                          <p className="text-xs text-gray-500">
                            {user.points_spent.toLocaleString()} 积分
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    暂无兑换记录
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 兑换统计 */}
      {redemptionStats && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            兑换统计 (最近30天)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">兑换概览</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">总兑换次数</span>
                  <span className="font-semibold text-gray-900">
                    {redemptionStats.total_redemptions.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">总兑换积分</span>
                  <span className="font-semibold text-gray-900">
                    {redemptionStats.total_points_redeemed.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">期间兑换次数</span>
                  <span className="font-semibold text-gray-900">
                    {redemptionStats.period_redemptions.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">期间兑换积分</span>
                  <span className="font-semibold text-gray-900">
                    {redemptionStats.period_points_redeemed.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 热门产品 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">热门产品 TOP 5</CardTitle>
              </CardHeader>
              <CardContent>
                {redemptionStats.popular_products.length > 0 ? (
                  <div className="space-y-2">
                    {redemptionStats.popular_products.map((product, index) => (
                      <div
                        key={product.product_id}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium">
                            {index + 1}
                          </span>
                          <span className="text-sm text-gray-900 truncate max-w-[200px]">
                            {product.product_name}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {product.redemption_count} 次
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.points_total.toLocaleString()} 积分
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    暂无兑换记录
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
