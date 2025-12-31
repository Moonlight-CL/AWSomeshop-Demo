/**
 * 积分历史列表组件
 * 显示用户的积分变动记录
 */

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { pointsApi } from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react'
import PointsStatsCard from './PointsStatsCard'

export default function PointsHistoryList() {
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data, isLoading } = useQuery({
    queryKey: ['points-history', page, pageSize],
    queryFn: () => pointsApi.getHistory({ page, page_size: pageSize }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (!data || data.items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">暂无积分变动记录</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* 积分统计卡片 */}
      <PointsStatsCard />

      <Card>
        <CardHeader>
          <CardTitle>积分明细</CardTitle>
          <CardDescription>您的所有积分变动记录</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.items.map((item) => {
            const isPositive = item.amount > 0
            // 根据type字段确定变动类型
            const getChangeType = (type: string) => {
              const typeMap: Record<string, string> = {
                allocation: '月度分配',
                redemption: '商品兑换',
                adjustment: '积分调整',
                manual: '手动调整',
                admin_adjust: '管理员调整',
              }
              return typeMap[type] || type
            }
            const changeType = getChangeType(item.type)

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  {/* 图标 */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isPositive
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.reason || changeType}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(item.created_at).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      {/* 积分变动 */}
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${
                            isPositive ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {item.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{changeType}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* 分页控制 */}
      {data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            第 {data.page} 页，共 {data.total_pages} 页 (总计 {data.total} 条记录)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
              disabled={page === data.total_pages}
            >
              下一页
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
