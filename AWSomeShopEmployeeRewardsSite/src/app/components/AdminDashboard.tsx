import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockUsers, mockProducts, mockOrders, mockTransactions } from '../lib/mockData';
import { User, Product, Order, PointTransaction } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { toast } from 'sonner';
import {
  Users,
  Package,
  TrendingUp,
  ChartBar,
  LogOut,
  Gift,
  CirclePlus,
  Pencil,
  Coins,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [orders] = useState<Order[]>(mockOrders);
  const [transactions, setTransactions] = useState<PointTransaction[]>(mockTransactions);

  // Statistics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.active).length;
  const totalPointsDistributed = transactions
    .filter((t) => t.type === 'allocation')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalRedemptions = orders.length;

  // Adjust Points Dialog
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);

  // Product Dialog
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productCost, setProductCost] = useState('');
  const [productStock, setProductStock] = useState('');
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

  const handleAdjustPoints = () => {
    if (!selectedUser || !adjustAmount || !adjustReason) {
      toast.error('请填写完整信息');
      return;
    }

    const amount = parseInt(adjustAmount);
    if (isNaN(amount)) {
      toast.error('请输入有效的积分数量');
      return;
    }

    // Update user points
    setUsers(
      users.map((u) =>
        u.id === selectedUser.id ? { ...u, points: u.points + amount } : u
      )
    );

    // Add transaction
    const newTransaction: PointTransaction = {
      id: `t${transactions.length + 1}`,
      userId: selectedUser.id,
      amount,
      type: 'adjustment',
      description: adjustReason,
      adminId: user?.id,
      createdAt: new Date().toISOString(),
    };
    setTransactions([newTransaction, ...transactions]);

    toast.success(
      `成功${amount > 0 ? '增加' : '扣除'} ${Math.abs(amount)} 积分给 ${selectedUser.username}`
    );

    setIsAdjustDialogOpen(false);
    setAdjustAmount('');
    setAdjustReason('');
    setSelectedUser(null);
  };

  const handleSaveProduct = () => {
    if (!productName || !productDescription || !productCost || !productStock) {
      toast.error('请填写完整信息');
      return;
    }

    const cost = parseInt(productCost);
    const stock = parseInt(productStock);

    if (isNaN(cost) || isNaN(stock)) {
      toast.error('请输入有效的数字');
      return;
    }

    if (selectedProduct) {
      // Edit existing product
      setProducts(
        products.map((p) =>
          p.id === selectedProduct.id
            ? {
                ...p,
                name: productName,
                description: productDescription,
                pointsCost: cost,
                stock,
              }
            : p
        )
      );
      toast.success('商品更新成功');
    } else {
      // Add new product
      const newProduct: Product = {
        id: `p${products.length + 1}`,
        name: productName,
        description: productDescription,
        category: '其他',
        pointsCost: cost,
        stock,
        imageUrl: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&h=300&fit=crop',
        active: true,
        createdAt: new Date().toISOString(),
      };
      setProducts([newProduct, ...products]);
      toast.success('商品添加成功');
    }

    setIsProductDialogOpen(false);
    resetProductForm();
  };

  const resetProductForm = () => {
    setSelectedProduct(null);
    setProductName('');
    setProductDescription('');
    setProductCost('');
    setProductStock('');
  };

  const openEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductName(product.name);
    setProductDescription(product.description);
    setProductCost(product.pointsCost.toString());
    setProductStock(product.stock.toString());
    setIsProductDialogOpen(true);
  };

  const openAddProduct = () => {
    resetProductForm();
    setIsProductDialogOpen(true);
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
                <h1 className="text-xl font-bold text-gray-900">AWSomeShop 管理后台</h1>
                <p className="text-sm text-gray-500">系统管理与数据统计</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">管理员：{user?.username}</p>
                <Badge variant="secondary">Admin</Badge>
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
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">总用户数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                  <p className="text-sm text-gray-500">{activeUsers} 活跃</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">商品总数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                  <p className="text-sm text-gray-500">
                    {products.filter((p) => p.active).length} 上架中
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">总兑换次数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <ChartBar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalRedemptions}</p>
                  <p className="text-sm text-gray-500">本月</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">已分配积分</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Coins className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalPointsDistributed}</p>
                  <p className="text-sm text-gray-500">总计</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              用户管理
            </TabsTrigger>
            <TabsTrigger value="products">
              <Package className="w-4 h-4 mr-2" />
              商品管理
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Gift className="w-4 h-4 mr-2" />
              兑换记录
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <TrendingUp className="w-4 h-4 mr-2" />
              积分记录
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>用户列表</CardTitle>
                <CardDescription>管理所有员工账户和积分</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>用户名</TableHead>
                      <TableHead>邮箱</TableHead>
                      <TableHead>角色</TableHead>
                      <TableHead>当前积分</TableHead>
                      <TableHead>月度分配</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.username}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                            {u.role === 'admin' ? '管理员' : '员工'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{u.points}</TableCell>
                        <TableCell>{u.monthlyAllocation}</TableCell>
                        <TableCell>
                          <Badge variant={u.active ? 'default' : 'secondary'}>
                            {u.active ? '活跃' : '停用'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(u);
                              setIsAdjustDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            调整积分
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>商品列表</CardTitle>
                    <CardDescription>管理所有可兑换商品</CardDescription>
                  </div>
                  <Button onClick={openAddProduct}>
                    <CirclePlus className="w-4 h-4 mr-2" />
                    添加商品
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品名称</TableHead>
                      <TableHead>分类</TableHead>
                      <TableHead>积分价格</TableHead>
                      <TableHead>库存</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.category}</TableCell>
                        <TableCell className="font-semibold">{p.pointsCost}</TableCell>
                        <TableCell>
                          <Badge variant={p.stock > 0 ? 'default' : 'secondary'}>
                            {p.stock}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.active ? 'default' : 'secondary'}>
                            {p.active ? '上架' : '下架'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditProduct(p)}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            编辑
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>兑换记录</CardTitle>
                <CardDescription>所有员工的商品兑换历史</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>订单ID</TableHead>
                      <TableHead>用户</TableHead>
                      <TableHead>商品</TableHead>
                      <TableHead>积分</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => {
                      const orderUser = users.find((u) => u.id === o.userId);
                      return (
                        <TableRow key={o.id}>
                          <TableCell className="font-mono text-sm">{o.id}</TableCell>
                          <TableCell>{orderUser?.username || 'Unknown'}</TableCell>
                          <TableCell>{o.productName}</TableCell>
                          <TableCell className="font-semibold">{o.pointsCost}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                o.status === 'completed'
                                  ? 'default'
                                  : o.status === 'processing'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {o.status === 'completed'
                                ? '已完成'
                                : o.status === 'processing'
                                ? '处理中'
                                : '已取消'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(o.createdAt).toLocaleDateString('zh-CN')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>积分变动记录</CardTitle>
                <CardDescription>所有积分变动的详细记录</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>用户</TableHead>
                      <TableHead>积分变动</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>说明</TableHead>
                      <TableHead>时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => {
                      const transactionUser = users.find((u) => u.id === t.userId);
                      return (
                        <TableRow key={t.id}>
                          <TableCell>{transactionUser?.username || 'Unknown'}</TableCell>
                          <TableCell>
                            <span
                              className={`font-semibold ${
                                t.amount > 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {t.amount > 0 ? '+' : ''}
                              {t.amount}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getTransactionTypeLabel(t.type)}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{t.description}</TableCell>
                          <TableCell>
                            {new Date(t.createdAt).toLocaleString('zh-CN')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Adjust Points Dialog */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>调整用户积分</DialogTitle>
            <DialogDescription>
              为 {selectedUser?.username} 增加或扣除积分
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adjust-amount">积分数量（正数为增加，负数为扣除）</Label>
              <Input
                id="adjust-amount"
                type="number"
                placeholder="例如：100 或 -50"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjust-reason">调整原因</Label>
              <Textarea
                id="adjust-reason"
                placeholder="请输入调整原因..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleAdjustPoints}>确认调整</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedProduct ? '编辑商品' : '添加商品'}</DialogTitle>
            <DialogDescription>
              {selectedProduct ? '修改商品信息' : '添加新的可兑换商品'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">商品名称</Label>
              <Input
                id="product-name"
                placeholder="例如：星巴克电子礼品卡 ¥100"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description">商品描述</Label>
              <Textarea
                id="product-description"
                placeholder="商品详细描述..."
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-cost">积分价格</Label>
                <Input
                  id="product-cost"
                  type="number"
                  placeholder="500"
                  value={productCost}
                  onChange={(e) => setProductCost(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-stock">库存数量</Label>
                <Input
                  id="product-stock"
                  type="number"
                  placeholder="50"
                  value={productStock}
                  onChange={(e) => setProductStock(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsProductDialogOpen(false);
                  resetProductForm();
                }}
              >
                取消
              </Button>
              <Button onClick={handleSaveProduct}>
                {selectedProduct ? '保存修改' : '添加商品'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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