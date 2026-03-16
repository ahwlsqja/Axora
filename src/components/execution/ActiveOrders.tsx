'use client'

import { useActiveOrders } from '@/hooks/useActiveOrders'
import { useExecution } from '@/hooks/useExecution'

interface ActiveOrdersProps {
  marketId: string
  baseDecimals: number
  quoteDecimals: number
}

export function ActiveOrders({
  marketId,
  baseDecimals,
  quoteDecimals,
}: ActiveOrdersProps) {
  const { orders, isLoading } = useActiveOrders(
    marketId,
    true,
    baseDecimals,
    quoteDecimals
  )
  const { cancel, phase } = useExecution()

  const isCancelling = phase === 'signing' || phase === 'broadcasting'

  const handleCancelAll = () => {
    if (orders.length === 0 || isCancelling) return
    const hashes = orders.map((o) => o.orderHash)
    cancel(hashes, marketId)
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
          <p className="text-sm text-gray-500">주문 불러오는 중... (Loading orders...)</p>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
        <p className="text-sm text-gray-400">
          활성 주문 없음 (No active orders)
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-700">
          활성 주문 (Active Orders)
        </h3>
        <button
          type="button"
          onClick={handleCancelAll}
          disabled={isCancelling}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            isCancelling
              ? 'cursor-not-allowed bg-gray-200 text-gray-400'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
        >
          {isCancelling
            ? '취소 중... (Cancelling...)'
            : '전체 취소 (Cancel All)'}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
              <th className="px-4 py-2 font-medium">Side</th>
              <th className="px-4 py-2 font-medium text-right">Price</th>
              <th className="px-4 py-2 font-medium text-right">Qty</th>
              <th className="px-4 py-2 font-medium text-right">Unfilled</th>
              <th className="px-4 py-2 font-medium text-right">CID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order.orderHash} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                      order.side === 'buy'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {order.side.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  {order.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  {order.quantity.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  {order.unfilledQuantity.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}
                </td>
                <td className="px-4 py-2 text-right font-mono text-gray-400">
                  {order.cid
                    ? `${order.cid.slice(0, 6)}...`
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
