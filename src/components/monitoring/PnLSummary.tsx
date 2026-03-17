'use client'

import { useStrategyPnL } from '@/hooks/useStrategyPnL'
import type { ExecutionRecord } from '@/lib/monitoring/types'

interface PnLSummaryProps {
  record: ExecutionRecord
  baseDecimals: number
  quoteDecimals: number
}

export function PnLSummary({ record, baseDecimals, quoteDecimals }: PnLSummaryProps) {
  const { pnl, isLoading } = useStrategyPnL(record, baseDecimals, quoteDecimals)

  if (isLoading || !pnl) {
    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
        <h4 className="text-xs font-medium text-zinc-500 mb-2">Realized P&L</h4>
        <p className="text-sm text-zinc-400">Calculating...</p>
      </div>
    )
  }

  const pnlColor =
    pnl.realizedPnL > 0
      ? 'text-green-400'
      : pnl.realizedPnL < 0
        ? 'text-red-400'
        : 'text-zinc-400'

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
      <h4 className="text-xs font-medium text-zinc-500 mb-2">Realized P&L</h4>
      <p className={`text-lg font-semibold ${pnlColor}`}>
        {pnl.realizedPnL >= 0 ? '+' : ''}{pnl.realizedPnL.toFixed(4)} USDT
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400">
        <div>
          <span className="text-zinc-500">Cost:</span>{' '}
          {pnl.totalCost.toFixed(4)}
        </div>
        <div>
          <span className="text-zinc-500">Revenue:</span>{' '}
          {pnl.totalRevenue.toFixed(4)}
        </div>
        <div>
          <span className="text-zinc-500">Fees:</span>{' '}
          {pnl.totalFees.toFixed(4)}
        </div>
        <div>
          <span className="text-zinc-500">Avg Entry:</span>{' '}
          {pnl.averageEntryPrice.toFixed(4)}
        </div>
      </div>
      <div className="mt-2 text-xs text-zinc-500">
        Filled Qty: {pnl.filledQuantity.toFixed(4)}
      </div>
    </div>
  )
}
