/**
 * 管理员用户管理组件
 * 提供用户列表查看和积分调整功能
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminPointsApi, UserPointsInfo } from '@/services/adminApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Search, Edit, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminUsersManagement() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserPointsInfo | null>(null)
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const pageSize = 10

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // 搜索时重置到第一页
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  // 获取用户列表
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-points-users', page, pageSize, debouncedSearch],
    queryFn: () =>
      adminPointsApi.getUsersList({
        page,
        page_size: pageSize,
        search: debouncedSearch || undefined,
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
      queryClient.invalidateQueries({ queryKey: ['admin-points-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-system-stats'] })
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
    <div className="space-y-4">
      {/* 标题和搜索栏 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">用户列表</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                管理所有用户的积分和权限
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索用户名或邮箱..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* 用户表格 */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    用户名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    邮箱
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    角色
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    当前积分
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    累计获得
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    累计消费
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    状态
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {usersData?.items.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {user.username}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.user_id.includes('admin') ? '管理员' : '员工'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {user.current_balance.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">
                        {user.total_earned.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">
                        {user.total_spent.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Badge
                        variant={
                          user.last_transaction_date ? 'default' : 'secondary'
                        }
                        className="rounded-full"
                      >
                        {user.last_transaction_date ? '活跃' : '未活跃'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openAdjustDialog(user)}
                        className="gap-1"
                      >
                        <Edit className="w-3 h-3" />
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
                显示 {(page - 1) * pageSize + 1} 到{' '}
                {Math.min(page * pageSize, usersData.total)} 条，共{' '}
                {usersData.total} 条
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
                  {page} / {usersData.total_pages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(usersData.total_pages, p + 1))
                  }
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
                <p className="font-medium text-gray-900">
                  {selectedUser.username}
                </p>
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
