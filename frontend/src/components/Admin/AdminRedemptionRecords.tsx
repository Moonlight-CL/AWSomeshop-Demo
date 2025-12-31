/**
 * 管理员兑换记录组件
 * 显示所有用户的商品兑换记录
 */

import { useQuery } from '@tanstack/react-query'
import { adminOrdersApi } from '@/services/adminApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminRedemptionRecords() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const pageSize = 20

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin-redemption-records', page, pageSize, statusFilter],
    queryFn: () =>
      adminOrdersApi.getAllOrders({
        page,
        page_size: pageSize,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">兑换记录</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              查看所有用户的商品兑换记录
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* 状态筛选 */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="所有状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="pending">处理中</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-y border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  商品
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  数量
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  积分
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  兑换码
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ordersData?.items.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(order.created_at), 'yyyy-MM-dd HH:mm')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.username}
                    </div>
                    <div className="text-xs text-gray-500">{order.user_email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {order.product_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">{order.quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {order.points_spent.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Badge
                      variant={
                        order.status === 'completed'
                          ? 'default'
                          : order.status === 'pending'
                          ? 'secondary'
                          : 'outline'
                      }
                      className="rounded-full"
                    >
                      {order.status === 'completed'
                        ? '已完成'
                        : order.status === 'pending'
                        ? '处理中'
                        : '已取消'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-600">
                      {order.redemption_code || '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {ordersData && ordersData.total_pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              显示 {(page - 1) * pageSize + 1} 到{' '}
              {Math.min(page * pageSize, ordersData.total)} 条，共{' '}
              {ordersData.total} 条
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
              <div className="text-sm text-gray-600">
                {page} / {ordersData.total_pages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(ordersData.total_pages, p + 1))}
                disabled={page === ordersData.total_pages}
              >
                下一页
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {ordersData && ordersData.items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无兑换记录</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
