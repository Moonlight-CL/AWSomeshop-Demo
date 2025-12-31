/**
 * 管理员积分记录组件
 * 显示所有用户的积分变动历史
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminPointsApi } from '@/services/adminApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminPointsHistory() {
  const [page, setPage] = useState(1)
  const [searchUserId, setSearchUserId] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const pageSize = 20

  // 获取积分历史记录
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['admin-points-history', page, pageSize, searchUserId, typeFilter],
    queryFn: () =>
      adminPointsApi.getPointsHistory({
        page,
        page_size: pageSize,
        user_id: searchUserId || undefined,
        type: typeFilter === 'all' ? undefined : typeFilter,
      }),
  })

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      allocation: '分配',
      admin_adjust: '调整',
      redemption: '兑换',
      deduction: '扣除',
    }
    return labels[type] || type
  }

  const getTypeVariant = (type: string) => {
    if (type === 'allocation' || type === 'admin_adjust') {
      return 'default'
    }
    return 'secondary'
  }

  if (isLoading && !historyData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">积分变动记录</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                查看所有用户的积分变动历史
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* 类型筛选 */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="所有类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有类型</SelectItem>
                  <SelectItem value="allocation">分配</SelectItem>
                  <SelectItem value="admin_adjust">调整</SelectItem>
                  <SelectItem value="redemption">兑换</SelectItem>
                  <SelectItem value="deduction">扣除</SelectItem>
                </SelectContent>
              </Select>

              {/* 用户ID搜索 */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索用户ID..."
                  value={searchUserId}
                  onChange={(e) => {
                    setSearchUserId(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* 积分历史表格 */}
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    类型
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    变动
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    变动前
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    变动后
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    原因
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {historyData?.items.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(record.created_at), 'yyyy-MM-dd HH:mm:ss')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.username}
                      </div>
                      <div className="text-xs text-gray-500">
                        {record.user_id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Badge
                        variant={getTypeVariant(record.type)}
                        className="rounded-full"
                      >
                        {getTypeLabel(record.type)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div
                        className={`flex items-center justify-end gap-1 text-sm font-semibold ${
                          record.amount > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {record.amount > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {record.amount > 0 ? '+' : ''}
                        {record.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">
                        {record.balance_before.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {record.balance_after.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {record.reason}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {historyData && historyData.total_pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                显示 {(page - 1) * pageSize + 1} 到{' '}
                {Math.min(page * pageSize, historyData.total)} 条，共{' '}
                {historyData.total} 条
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
                  {page} / {historyData.total_pages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(historyData.total_pages, p + 1))
                  }
                  disabled={page === historyData.total_pages}
                >
                  下一页
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {historyData && historyData.items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">没有找到积分记录</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
