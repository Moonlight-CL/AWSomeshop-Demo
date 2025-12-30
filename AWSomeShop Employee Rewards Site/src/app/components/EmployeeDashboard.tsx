import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockProducts, mockOrders, mockTransactions } from '../lib/mockData';
import { Product, Order, PointTransaction } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Coins, ShoppingBag, History, LogOut, Gift, TrendingUp } from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [products] = useState<Product[]>(mockProducts);
  const [userOrders] = useState<Order[]>(mockOrders.filter((o) => o.userId === user?.id));
  const [userTransactions] = useState<PointTransaction[]>(
    mockTransactions.filter((t) => t.userId === user?.id)
  );

  const handleRedeem = (product: Product) => {
    if (!user) return;

    if (user.points < product.pointsCost) {
      toast.error('积分不足，无法兑换此商品');
      return;
    }

    if (product.stock <= 0) {
      toast.error('商品库存不足');
      return;
    }

    toast.success(`成功兑换 ${product.name}！确认邮件已发送至您的邮箱。`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AWSomeShop</h1>
                <p className="text-sm text-gray-500">员工积分商城</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">欢迎，{user?.username}</p>
                <div className="flex items-center gap-2 justify-end">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-indigo-600">{user?.points}</span>
                  <span className="text-sm text-gray-500">积分</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                退出
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">
              <ShoppingBag className="w-4 h-4 mr-2" />
              商品兑换
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Gift className="w-4 h-4 mr-2" />
              兑换记录
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <TrendingUp className="w-4 h-4 mr-2" />
              积分明细
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>可用积分</CardTitle>
                <CardDescription>您的当前积分余额</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                    <Coins className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{user?.points}</p>
                    <p className="text-sm text-gray-500">每月分配：{user?.monthlyAllocation} 积分</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-lg font-semibold mb-4">商品目录</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{product.name}</CardTitle>
                        <Badge variant={product.stock > 0 ? 'default' : 'secondary'}>
                          库存 {product.stock}
                        </Badge>
                      </div>
                      <CardDescription>{product.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="w-5 h-5 text-amber-500" />
                          <span className="text-lg font-semibold text-gray-900">
                            {product.pointsCost}
                          </span>
                          <span className="text-sm text-gray-500">积分</span>
                        </div>
                        <Button
                          onClick={() => handleRedeem(product)}
                          disabled={
                            product.stock <= 0 || (user?.points || 0) < product.pointsCost
                          }
                        >
                          兑换
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>兑换记录</CardTitle>
                <CardDescription>您的所有商品兑换历史</CardDescription>
              </CardHeader>
              <CardContent>
                {userOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Gift className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>暂无兑换记录</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{order.productName}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">消耗积分</p>
                            <p className="font-semibold text-gray-900">{order.pointsCost}</p>
                          </div>
                          <Badge
                            variant={
                              order.status === 'completed'
                                ? 'default'
                                : order.status === 'processing'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {order.status === 'completed'
                              ? '已完成'
                              : order.status === 'processing'
                              ? '处理中'
                              : '已取消'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>积分明细</CardTitle>
                <CardDescription>您的所有积分变动记录</CardDescription>
              </CardHeader>
              <CardContent>
                {userTransactions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>暂无积分记录</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {transaction.description}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-semibold ${
                              transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {transaction.amount > 0 ? '+' : ''}
                            {transaction.amount}
                          </p>
                          <Badge variant="outline">{getTransactionTypeLabel(transaction.type)}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    allocation: '月度分配',
    redemption: '商品兑换',
    adjustment: '管理员调整',
    expiration: '积分过期',
  };
  return labels[type] || type;
}
