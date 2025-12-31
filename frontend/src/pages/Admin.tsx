/**
 * 管理员后台页面
 * 包含积分管理、产品管理、统计报表等功能
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Package, FileText, Coins } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import AdminLayout from '@/components/Layout/AdminLayout'
import AdminUsersManagement from '@/components/Admin/AdminUsersManagement'
import AdminProductsManagement from '@/components/Admin/AdminProductsManagement'
import AdminPointsHistory from '@/components/Admin/AdminPointsHistory'
import AdminRedemptionRecords from '@/components/Admin/AdminRedemptionRecords'
import { adminStatsApi } from '@/services/adminApi'

export default function Admin() {
  const [activeTab, setActiveTab] = useState('users')

  // 获取系统统计
  const { data: systemStats } = useQuery({
    queryKey: ['admin-system-stats'],
    queryFn: adminStatsApi.getSystemStats,
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 顶部统计卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 总用户数 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {systemStats?.users.total || 0}
                  </div>
                  <div className="text-sm text-gray-500">总用户数</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {systemStats?.users.active || 0} 活跃
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 商品总数 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {systemStats?.products.total || 0}
                  </div>
                  <div className="text-sm text-gray-500">商品总数</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {systemStats?.products.active || 0} 上架中
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 总兑换数 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {systemStats?.redemptions.total || 0}
                  </div>
                  <div className="text-sm text-gray-500">总兑换数</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {systemStats?.redemptions.this_month || 0} 本月
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 已分配积分 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {systemStats?.points.total_allocated.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-500">已分配积分</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {systemStats?.points.total_remaining.toLocaleString() || 0} 剩余
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 标签导航 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-4 bg-white border border-gray-200">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              <span>用户管理</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              <span>商品管理</span>
            </TabsTrigger>
            <TabsTrigger value="points" className="gap-2">
              <Coins className="w-4 h-4" />
              <span>积分记录</span>
            </TabsTrigger>
            <TabsTrigger value="redemptions" className="gap-2">
              <FileText className="w-4 h-4" />
              <span>兑换记录</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <AdminUsersManagement />
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <AdminProductsManagement />
          </TabsContent>

          <TabsContent value="points" className="mt-6">
            <AdminPointsHistory />
          </TabsContent>

          <TabsContent value="redemptions" className="mt-6">
            <AdminRedemptionRecords />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
