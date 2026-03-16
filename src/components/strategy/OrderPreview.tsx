'use client'

import type { StrategyOrder } from '@/lib/ai/schemas'

interface OrderPreviewProps {
  orders: StrategyOrder[]
  baseDenom: string
  quoteDenom: string
}

export function OrderPreview({ orders, baseDenom, quoteDenom }: OrderPreviewProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 p-4 text-center text-sm text-gray-400">
        주문 없음 (No orders)
      </div>
    )
  }

  const totalQuantity = orders.reduce((sum, o) => sum + o.quantity, 0)
  const totalCapital = orders.reduce((sum, o) => sum + o.price * o.quantity, 0)

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
            <th className="px-3 py-2 font-medium">#</th>
            <th className="px-3 py-2 font-medium">Side</th>
            <th className="px-3 py-2 font-medium text-right">Price ({quoteDenom})</th>
            <th className="px-3 py-2 font-medium text-right">Qty ({baseDenom})</th>
            <th className="px-3 py-2 font-medium text-right">% of Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-mono text-gray-400">{i + 1}</td>
              <td className="px-3 py-2">
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
              <td className="px-3 py-2 text-right font-mono">
                {order.price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}
              </td>
              <td className="px-3 py-2 text-right font-mono">
                {order.quantity.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}
              </td>
              <td className="px-3 py-2 text-right font-mono text-gray-500">
                {order.percentOfTotal.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-200 bg-gray-50 text-xs font-medium text-gray-600">
            <td className="px-3 py-2" colSpan={2}>
              합계 (Total)
            </td>
            <td className="px-3 py-2 text-right font-mono">
              {totalCapital.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              {quoteDenom}
            </td>
            <td className="px-3 py-2 text-right font-mono">
              {totalQuantity.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              })}{' '}
              {baseDenom}
            </td>
            <td className="px-3 py-2 text-right font-mono">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
