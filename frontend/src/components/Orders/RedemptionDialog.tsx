/**
 * 兑换确认对话框
 * 显示产品信息并确认兑换
 */

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '@/services/api'
import { Product } from '@/types/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Coins, Package, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface RedemptionDialogProps {
  product: Product | null
  open: boolean
  onClose: () => void
  currentBalance: number
}

export default function RedemptionDialog({
  product,
  open,
  onClose,
  currentBalance,
}: RedemptionDialogProps) {
  const { user: _user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isSuccess, setIsSuccess] = useState(false)
  const [redemptionCode, setRedemptionCode] = useState<string | null>(null)

  const redeemMutation = useMutation({
    mutationFn: (productId: string) =>
      ordersApi.redeemProduct({ product_id: productId, quantity: 1 }),
    onSuccess: (data) => {
      setIsSuccess(true)
      setRedemptionCode(data.redemption_code)
      // 刷新积分余额和订单历史
      queryClient.invalidateQueries({ queryKey: ['points-balance'] })
      queryClient.invalidateQueries({ queryKey: ['orders-history'] })
      toast({
        title: '兑换成功',
        description: '恭喜您成功兑换商品！',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: '兑换失败',
        description: error.message || '兑换失败，请稍后重试',
      })
    },
  })

  if (!product) return null

  const canRedeem = currentBalance >= product.points_price && product.is_available
  const balanceAfter = currentBalance - product.points_price

  const handleRedeem = () => {
    if (canRedeem) {
      redeemMutation.mutate(product.id)
    }
  }

  const handleClose = () => {
    setIsSuccess(false)
    setRedemptionCode(null)
    onClose()
  }

  // 兑换成功页面
  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="text-2xl mb-2">兑换成功！</DialogTitle>
            <DialogDescription className="text-base">
              您已成功兑换 <span className="font-semibold">{product.name}</span>
            </DialogDescription>

            {redemptionCode && (
              <Card className="mt-6 bg-gray-50">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-2">兑换码</p>
                  <p className="text-2xl font-bold text-gray-900 tracking-wider">
                    {redemptionCode}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    兑换详情已发送至您的邮箱
                  </p>
                </CardContent>
              </Card>
            )}

            <Button onClick={handleClose} className="mt-6 w-full">
              完成
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // 兑换确认页面
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>确认兑换</DialogTitle>
          <DialogDescription>
            请确认您要兑换以下商品
          </DialogDescription>
        </DialogHeader>

        {/* 产品信息 */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                {product.name}
              </h3>
              {product.description && (
                <p className="text-sm text-gray-500 line-clamp-2">
                  {product.description}
                </p>
              )}
            </div>
          </div>

          {/* 积分信息 */}
          <Card className="bg-gray-50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">所需积分</span>
                <div className="flex items-center gap-1">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span className="text-lg font-bold text-amber-600">
                    {product.points_price.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">当前余额</span>
                <span className="text-lg font-semibold text-gray-900">
                  {currentBalance.toLocaleString()}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    兑换后余额
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      balanceAfter >= 0 ? 'text-gray-900' : 'text-red-600'
                    }`}
                  >
                    {balanceAfter.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 错误提示 */}
          {!canRedeem && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  {!product.is_available
                    ? '该商品暂时缺货'
                    : '您的积分余额不足'}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  {!product.is_available
                    ? '请选择其他商品或等待补货'
                    : `您还需要 ${(product.points_price - currentBalance).toLocaleString()} 积分才能兑换此商品`}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={redeemMutation.isPending}
          >
            取消
          </Button>
          <Button
            onClick={handleRedeem}
            disabled={!canRedeem || redeemMutation.isPending}
            className="bg-gray-900 hover:bg-gray-800"
          >
            {redeemMutation.isPending ? '兑换中...' : '确认兑换'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
