/**
 * 产品卡片组件
 * 展示单个产品的信息
 */

import { Product } from '@/types/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Coins, Package } from 'lucide-react'

interface ProductCardProps {
  product: Product
  onRedeem?: (product: Product) => void
}

export default function ProductCard({ product, onRedeem }: ProductCardProps) {
  const handleRedeem = () => {
    if (onRedeem) {
      onRedeem(product)
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* 产品图片 */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-400" />
          </div>
        )}

        {/* 库存标签 */}
        {!product.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium">
              已售罄
            </span>
          </div>
        )}

        {/* 分类标签 */}
        {product.category && (
          <div className="absolute top-2 left-2">
            <span className="bg-white/90 backdrop-blur-sm text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
              {product.category}
            </span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* 产品名称 */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
          {product.name}
        </h3>

        {/* 产品描述 */}
        {product.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2 min-h-[2.5rem]">
            {product.description}
          </p>
        )}

        {/* 积分和兑换按钮 */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-600" />
            <span className="text-2xl font-bold text-amber-600">
              {product.points_price}
            </span>
            <span className="text-sm text-gray-500">积分</span>
          </div>

          <Button
            size="sm"
            onClick={handleRedeem}
            disabled={!product.is_available}
            className="bg-gray-900 hover:bg-gray-800"
          >
            兑换
          </Button>
        </div>

        {/* 库存信息 */}
        {product.stock_quantity !== undefined && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              剩余库存: <span className="font-medium text-gray-700">{product.stock_quantity}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
