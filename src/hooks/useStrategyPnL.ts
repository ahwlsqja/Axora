'use client'

import { useQuery } from '@tanstack/react-query'
import { getAgentSubaccountId } from '@/services/injective/subaccount'
import { fetchTradesByCid } from '@/services/injective/spot'
import { calculatePnL } from '@/lib/monitoring/pnl'
import type { ExecutionRecord, StrategyPnL } from '@/lib/monitoring/types'

/**
 * React Query hook that fetches trades for a strategy and computes P&L.
 * Polls every 30 seconds (P&L doesn't need aggressive refresh).
 *
 * @param executionRecord - The execution record to compute P&L for (null disables)
 * @param baseDecimals - Base token decimals for price conversion
 * @param quoteDecimals - Quote token decimals for fee conversion
 */
export function useStrategyPnL(
  executionRecord: ExecutionRecord | null,
  baseDecimals: number,
  quoteDecimals: number
) {
  const { data, isLoading } = useQuery<StrategyPnL | null>({
    queryKey: ['strategyPnL', executionRecord?.id],
    queryFn: async () => {
      if (!executionRecord) return null

      const subaccountId = getAgentSubaccountId(executionRecord.walletAddress)
      const trades = await fetchTradesByCid(
        subaccountId,
        executionRecord.marketId,
        executionRecord.orderCids,
        baseDecimals,
        quoteDecimals
      )

      if (trades.length === 0) return null

      return calculatePnL(trades)
    },
    enabled: !!executionRecord,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })

  return {
    pnl: data ?? null,
    isLoading,
  }
}
