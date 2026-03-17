'use client'

import { useStrategyStatus } from '@/hooks/useStrategyStatus'
import type { ExecutionRecord, StrategyStatus } from '@/lib/monitoring/types'

interface StrategyDetailProps {
  record: ExecutionRecord
  baseDecimals: number
  quoteDecimals: number
}

const STATUS_STYLES: Record<StrategyStatus, { label: string; dot: string; bg: string; text: string }> = {
  syncing: { label: 'Syncing', dot: 'bg-orange-400 animate-pulse', bg: 'bg-orange-50', text: 'text-orange-700' },
  pending: { label: 'Pending', dot: 'bg-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  partially_filled: { label: 'Partial', dot: 'bg-blue-400', bg: 'bg-blue-50', text: 'text-blue-700' },
  complete: { label: 'Complete', dot: 'bg-green-400', bg: 'bg-green-50', text: 'text-green-700' },
  cancelled: { label: 'Cancelled', dot: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-600' },
  failed: { label: 'Failed', dot: 'bg-red-400', bg: 'bg-red-50', text: 'text-red-700' },
}

export function StrategyDetail({ record, baseDecimals, quoteDecimals }: StrategyDetailProps) {
  const { orders, status, isLoading } = useStrategyStatus(record, baseDecimals, quoteDecimals)

  const style = STATUS_STYLES[status]
  const truncatedHash = record.txHash
    ? `${record.txHash.slice(0, 8)}...${record.txHash.slice(-6)}`
    : ''
  const explorerUrl = `https://testnet.explorer.injective.network/transaction/${record.txHash}`

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-700 bg-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-200 capitalize">
            {record.strategyType.replace('-', ' ')}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {style.label}
          </span>
        </div>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-blue-400 hover:text-blue-300 underline"
        >
          TX: {truncatedHash}
        </a>
      </div>

      {/* Syncing note */}
      {status === 'syncing' && (
        <div className="px-4 py-2 bg-orange-900/20 border-b border-orange-800/30">
          <p className="text-xs text-orange-400">
            Waiting for orders to be indexed...
          </p>
        </div>
      )}

      {/* Orders table */}
      <div className="overflow-x-auto">
        {isLoading && orders.length === 0 ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-full animate-pulse rounded bg-zinc-700/50" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-zinc-500">No orders found yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700 text-left text-xs text-zinc-500">
                <th className="px-4 py-2 font-medium">Side</th>
                <th className="px-4 py-2 font-medium text-right">Price</th>
                <th className="px-4 py-2 font-medium text-right">Quantity</th>
                <th className="px-4 py-2 font-medium text-right">Filled</th>
                <th className="px-4 py-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/50">
              {orders.map((order) => (
                <tr key={order.orderHash} className="hover:bg-zinc-700/30">
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                        order.direction === 'buy'
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-red-900/50 text-red-400'
                      }`}
                    >
                      {order.direction.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-zinc-300">
                    {order.price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-zinc-300">
                    {order.quantity.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-zinc-300">
                    {order.filledQuantity.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className="text-xs text-zinc-400 capitalize">
                      {order.state}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
