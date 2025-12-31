/**
 * 管理员产品管理组件
 * 提供产品的创建、编辑、删除、库存管理等功能
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/services/api'
import { adminProductsApi, CreateProductRequest, UpdateProductRequest } from '@/services/adminApi'
import { Product } from '@/types/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  Edit,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function AdminProductsManagement() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPermanentDeleteDialogOpen, setIsPermanentDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const pageSize = 10

  // 创建产品表单状态
  const [createForm, setCreateForm] = useState<CreateProductRequest>({
    name: '',
    description: '',
    points_price: 0,
    stock_quantity: 0,
    category: '',
    image_url: '',
  })

  // 编辑产品表单状态
  const [editForm, setEditForm] = useState<UpdateProductRequest>({})

  // 获取产品列表
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin-products', page, pageSize],
    queryFn: () =>
      productsApi.getProducts({
        page,
        page_size: pageSize,
        available_only: false,
      }),
  })

  // 创建产品 mutation
  const createMutation = useMutation({
    mutationFn: adminProductsApi.createProduct,
    onSuccess: () => {
      toast.success('产品创建成功')
      setIsCreateDialogOpen(false)
      resetCreateForm()
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-system-stats'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || '产品创建失败')
    },
  })

  // 更新产品 mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) =>
      adminProductsApi.updateProduct(id, data),
    onSuccess: () => {
      toast.success('产品更新成功')
      setIsEditDialogOpen(false)
      setSelectedProduct(null)
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || '产品更新失败')
    },
  })

  // 删除产品(软删除) mutation
  const deleteMutation = useMutation({
    mutationFn: adminProductsApi.deleteProduct,
    onSuccess: () => {
      toast.success('产品已下架')
      setIsDeleteDialogOpen(false)
      setProductToDelete(null)
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-system-stats'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || '产品下架失败')
    },
  })

  // 上架产品 mutation
  const activateMutation = useMutation({
    mutationFn: adminProductsApi.activateProduct,
    onSuccess: () => {
      toast.success('产品已上架')
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-system-stats'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || '产品上架失败')
    },
  })

  // 物理删除产品 mutation
  const permanentDeleteMutation = useMutation({
    mutationFn: adminProductsApi.permanentlyDeleteProduct,
    onSuccess: () => {
      toast.success('产品已永久删除')
      setIsPermanentDeleteDialogOpen(false)
      setProductToDelete(null)
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-system-stats'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || '产品删除失败')
    },
  })

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      description: '',
      points_price: 0,
      stock_quantity: 0,
      category: '',
      image_url: '',
    })
  }

  const handleCreate = () => {
    if (!createForm.name || createForm.points_price <= 0) {
      toast.error('请填写完整的产品信息')
      return
    }

    createMutation.mutate(createForm)
  }

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product)
    setEditForm({
      name: product.name,
      description: product.description || '',
      points_price: product.points_price,
      stock_quantity: product.stock_quantity,
      category: product.category || '',
      image_url: product.image_url || '',
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = () => {
    if (!selectedProduct) return

    updateMutation.mutate({
      id: selectedProduct.id,
      data: editForm,
    })
  }

  const openDeleteDialog = (product: Product) => {
    setProductToDelete(product)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = () => {
    if (!productToDelete) return
    deleteMutation.mutate(productToDelete.id)
  }

  const openPermanentDeleteDialog = (product: Product) => {
    setProductToDelete(product)
    setIsPermanentDeleteDialogOpen(true)
  }

  const handlePermanentDelete = () => {
    if (!productToDelete) return
    permanentDeleteMutation.mutate(productToDelete.id)
  }

  const handleActivate = (product: Product) => {
    activateMutation.mutate(product.id)
  }

  if (isLoading && !productsData) {
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
      {/* 标题和添加按钮 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">商品列表</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                管理所有可兑换的商品
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              添加商品
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* 产品表格 */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    商品名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    分类
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    积分价格
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    库存
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
                {productsData?.items.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {product.category || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {product.points_price.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div
                        className={`text-sm font-medium ${
                          product.stock_quantity === 0
                            ? 'text-red-600'
                            : product.stock_quantity < 10
                            ? 'text-orange-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {product.stock_quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Badge
                        variant={
                          product.is_available ? 'default' : 'secondary'
                        }
                        className="rounded-full"
                      >
                        {product.is_available ? '上架' : '下架'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(product)}
                          className="gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          编辑
                        </Button>

                        {/* 根据产品状态显示不同按钮 */}
                        {product.status === 'active' ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openDeleteDialog(product)}
                              className="gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              下架
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openPermanentDeleteDialog(product)}
                              className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              删除
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleActivate(product)}
                              disabled={activateMutation.isPending}
                              className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              上架
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openPermanentDeleteDialog(product)}
                              className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              删除
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {productsData && productsData.total_pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                显示 {(page - 1) * pageSize + 1} 到{' '}
                {Math.min(page * pageSize, productsData.total)} 条，共{' '}
                {productsData.total} 条
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
                  {page} / {productsData.total_pages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(productsData.total_pages, p + 1))
                  }
                  disabled={page === productsData.total_pages}
                >
                  下一页
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {productsData && productsData.items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无产品</p>
              <Button
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                创建第一个产品
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建产品对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>添加新商品</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-name">商品名称 *</Label>
                <Input
                  id="create-name"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="create-category">分类</Label>
                <Input
                  id="create-category"
                  value={createForm.category}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, category: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="create-description">商品描述</Label>
              <Textarea
                id="create-description"
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-points">积分价格 *</Label>
                <Input
                  id="create-points"
                  type="number"
                  min="0"
                  value={createForm.points_price}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      points_price: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="create-stock">初始库存 *</Label>
                <Input
                  id="create-stock"
                  type="number"
                  min="0"
                  value={createForm.stock_quantity}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      stock_quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="create-image">图片 URL</Label>
              <Input
                id="create-image"
                value={createForm.image_url}
                onChange={(e) =>
                  setCreateForm({ ...createForm, image_url: e.target.value })
                }
                className="mt-1"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                取消
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? '创建中...' : '创建商品'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑产品对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑商品</DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">商品名称</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name || ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-category">分类</Label>
                  <Input
                    id="edit-category"
                    value={editForm.category || ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">商品描述</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-points">积分价格</Label>
                  <Input
                    id="edit-points"
                    type="number"
                    min="0"
                    value={editForm.points_price || 0}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        points_price: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-stock">库存数量</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    min="0"
                    value={editForm.stock_quantity || 0}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        stock_quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-image">图片 URL</Label>
                <Input
                  id="edit-image"
                  value={editForm.image_url || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, image_url: e.target.value })
                  }
                  className="mt-1"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  取消
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? '更新中...' : '更新商品'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 下架产品确认对话框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认下架产品</AlertDialogTitle>
            <AlertDialogDescription>
              {productToDelete && (
                <>
                  您确定要下架产品 <span className="font-semibold">{productToDelete.name}</span> 吗？
                  <br />
                  <br />
                  此操作将会将产品标记为下架状态，不会完全删除数据。已有的兑换记录不会受影响。
                  <br />
                  您可以随时重新上架该产品。
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {deleteMutation.isPending ? '下架中...' : '确认下架'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 物理删除产品确认对话框 */}
      <AlertDialog open={isPermanentDeleteDialogOpen} onOpenChange={setIsPermanentDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认永久删除产品</AlertDialogTitle>
            <AlertDialogDescription>
              {productToDelete && (
                <>
                  您确定要永久删除产品 <span className="font-semibold">{productToDelete.name}</span> 吗？
                  <br />
                  <br />
                  <span className="text-red-600 font-semibold">警告：此操作不可恢复！</span>
                  <br />
                  <br />
                  只有在该产品没有任何兑换记录时才能永久删除。如果存在兑换记录，请使用"下架"功能。
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={permanentDeleteMutation.isPending}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              disabled={permanentDeleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {permanentDeleteMutation.isPending ? '删除中...' : '永久删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
