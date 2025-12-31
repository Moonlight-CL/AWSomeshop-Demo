/**
 * 订单历史列表组件
 * 显示用户的兑换记录
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ordersApi } from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, ChevronLeft, ChevronRight, CheckCircle, Clock } from 'lucide-react'

export default function OrdersList() {
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data, isLoading } = useQuery({
    queryKey: ['orders-history', page, pageSize],
    queryFn: () => ordersApi.getHistory({ page, page_size: pageSize }),
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
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无兑换记录</p>
          <p className="text-sm text-gray-500 mt-2">开始兑换您喜欢的商品吧</p>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      completed: { label: '已完成', variant: 'default' },
      pending: { label: '处理中', variant: 'secondary' },
      cancelled: { label: '已取消', variant: 'outline' },
    }
    const config = statusConfig[status] || { label: status, variant: 'outline' }
    return (
      <Badge variant={config.variant} className="gap-1">
        {status === 'completed' && <CheckCircle className="w-3 h-3" />}
        {status === 'pending' && <Clock className="w-3 h-3" />}
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>兑换记录</CardTitle>
          <CardDescription>您的所有商品兑换历史</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.items.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1">
                {/* 图标 */}
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {order.product_name || `产品 #${order.product_id}`}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {order.redemption_code && (
                        <p className="text-xs text-gray-600 mt-2 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                          兑换码: {order.redemption_code}
                        </p>
                      )}
                    </div>

                    {/* 积分和状态 */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-gray-600">消耗积分</p>
                      <p className="text-lg font-bold text-gray-900">
                        {order.points_spent.toLocaleString()}
                      </p>
                      <div className="mt-2">
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
