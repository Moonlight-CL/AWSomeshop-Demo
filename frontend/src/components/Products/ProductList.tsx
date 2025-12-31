/**
 * 产品列表组件
 * 展示所有可兑换的产品
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { productsApi, pointsApi } from '@/services/api'
import { Product } from '@/types/api'
import ProductCard from './ProductCard'
import RedemptionDialog from '../Orders/RedemptionDialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function ProductList() {
  const [page, setPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const pageSize = 12

  // 获取产品列表
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', page, pageSize, selectedCategory],
    queryFn: () =>
      productsApi.getProducts({
        page,
        page_size: pageSize,
        category: selectedCategory || undefined,
        available_only: true,
      }),
  })

  // 获取分类列表
  const { data: categoriesData } = useQuery({
    queryKey: ['product-categories'],
    queryFn: productsApi.getCategories,
  })

  // 获取积分余额
  const { data: balance } = useQuery({
    queryKey: ['points-balance'],
    queryFn: pointsApi.getBalance,
  })

  const handleRedeem = (product: Product) => {
    setSelectedProduct(product)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedProduct(null)
  }

  if (isLoadingProducts) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (!productsData || productsData.items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">暂无可兑换的产品</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 分类筛选 */}
      {categoriesData && categoriesData.categories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={selectedCategory === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('')}
          >
            全部
          </Button>
          {categoriesData.categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedCategory(category)
                setPage(1) // 切换分类时重置页码
              }}
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      {/* 产品网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {productsData.items.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onRedeem={handleRedeem}
          />
        ))}
      </div>

      {/* 分页控制 */}
      {productsData.total_pages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-600">
            第 {productsData.page} 页，共 {productsData.total_pages} 页 (总计{' '}
            {productsData.total} 个产品)
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

      {/* 兑换确认对话框 */}
      <RedemptionDialog
        product={selectedProduct}
        open={isDialogOpen}
        onClose={handleCloseDialog}
        currentBalance={balance?.current_balance ?? 0}
      />
    </div>
  )
}
