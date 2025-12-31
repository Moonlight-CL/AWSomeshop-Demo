/**
 * 首页 - 用户主页
 * 显示积分余额和快速操作
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShoppingBag, Receipt, TrendingUp } from 'lucide-react'
import UserLayout from '@/components/Layout/UserLayout'
import PointsHistoryList from '@/components/PointsHistory/PointsHistoryList'
import ProductList from '@/components/Products/ProductList'
import OrdersList from '@/components/Orders/OrdersList'

export default function Home() {
  return (
    <UserLayout>
      <Tabs defaultValue="products" className="w-full">
        {/* 标签页导航 */}
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
          <TabsTrigger value="products" className="gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span>商品兑换</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <Receipt className="w-4 h-4" />
            <span>兑换记录</span>
          </TabsTrigger>
          <TabsTrigger value="points" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>积分明细</span>
          </TabsTrigger>
        </TabsList>

        {/* 商品兑换页面 */}
        <TabsContent value="products">
          <ProductList />
        </TabsContent>

        {/* 兑换记录页面 */}
        <TabsContent value="orders">
          <OrdersList />
        </TabsContent>

        {/* 积分明细页面 */}
        <TabsContent value="points">
          <PointsHistoryList />
        </TabsContent>
      </Tabs>
    </UserLayout>
  )
}
