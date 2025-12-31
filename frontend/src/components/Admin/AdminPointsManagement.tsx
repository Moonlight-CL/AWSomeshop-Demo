/**
 * 管理员积分管理组件
 * 提供用户积分查询、调整、批量分配等功能
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminPointsApi, UserPointsInfo } from '@/services/adminApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Coins, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function AdminPointsManagement() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserPointsInfo | null>(null)
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const pageSize = 20

  // 获取积分概览
  const { data: overview } = useQuery({
    queryKey: ['admin-points-overview'],
    queryFn: adminPointsApi.getOverview,
  })

  // 获取用户列表
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-points-users', page, pageSize, search],
    queryFn: () =>
      adminPointsApi.getUsersList({
        page,
        page_size: pageSize,
        search: search || undefined,
      }),
  })

  // 调整积分 mutation
  const adjustMutation = useMutation({
    mutationFn: adminPointsApi.adjustPoints,
    onSuccess: () => {
      toast.success('积分调整成功')
      setIsAdjustDialogOpen(false)
      setSelectedUser(null)
      setAdjustAmount('')
      setAdjustReason('')
      queryClient.invalidateQueries({ queryKey: ['admin-points-overview'] })
      queryClient.invalidateQueries({ queryKey: ['admin-points-users'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || '积分调整失败')
    },
  })

  const handleAdjustPoints = () => {
    if (!selectedUser || !adjustAmount || !adjustReason) {
      toast.error('请填写完整信息')
      return
    }

    const amount = parseInt(adjustAmount)
    if (isNaN(amount) || amount === 0) {
      toast.error('请输入有效的积分数量')
      return
    }

    adjustMutation.mutate({
      user_id: selectedUser.user_id,
      amount,
      reason: adjustReason,
    })
  }

  const openAdjustDialog = (user: UserPointsInfo) => {
    setSelectedUser(user)
    setAdjustAmount('')
    setAdjustReason('')
    setIsAdjustDialogOpen(true)
  }

  if (isLoading && !usersData) {
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
    <div className="space-y-6">
      {/* 积分概览 */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                已分配总积分
              </CardTitle>
              <Coins className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {overview.total_allocated.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                平均余额: {overview.average_balance.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                已兑换积分
              </CardTitle>
              <Coins className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {overview.total_redeemed.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                剩余: {overview.total_remaining.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                用户统计
              </CardTitle>
              <Coins className="w-4 h-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {overview.total_users}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                活跃用户: {overview.active_users}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 搜索栏 */}
      <Card>
        <CardHeader>
          <CardTitle>用户积分管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索用户名或邮箱..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    当前余额
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    累计获得
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    累计消费
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最后活动
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersData?.items.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Coins className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-semibold text-gray-900">
                          {user.current_balance.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(user.total_allocated ?? 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(user.total_redeemed ?? 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_activity
                        ? new Date(user.last_activity).toLocaleDateString()
                        : '无'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAdjustDialog(user)}
                      >
                        调整积分
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {usersData && usersData.total_pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                第 {usersData.page} 页，共 {usersData.total_pages} 页 (总计{' '}
                {usersData.total} 个用户)
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
                  onClick={() => setPage((p) => Math.min(usersData.total_pages, p + 1))}
                  disabled={page === usersData.total_pages}
                >
                  下一页
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {usersData && usersData.items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">没有找到用户</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 调整积分对话框 */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>调整用户积分</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">用户</p>
                <p className="font-medium text-gray-900">{selectedUser.username}</p>
                <p className="text-sm text-gray-500 mt-1">
                  当前余额: {selectedUser.current_balance.toLocaleString()} 积分
                </p>
              </div>

              <div>
                <Label htmlFor="adjust-amount">调整数量</Label>
                <Input
                  id="adjust-amount"
                  type="number"
                  placeholder="正数为增加，负数为扣除"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  例如: 输入 100 增加积分，输入 -100 扣除积分
                </p>
              </div>

              <div>
                <Label htmlFor="adjust-reason">调整原因</Label>
                <Textarea
                  id="adjust-reason"
                  placeholder="请输入调整原因..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsAdjustDialogOpen(false)}
                >
                  取消
                </Button>
                <Button
                  onClick={handleAdjustPoints}
                  disabled={adjustMutation.isPending}
                >
                  {adjustMutation.isPending ? '处理中...' : '确认调整'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
