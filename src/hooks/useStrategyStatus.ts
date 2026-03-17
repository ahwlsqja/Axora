'use client'

import { useQuery } from '@tanstack/react-query'
import { getAgentSubaccountId } from '@/services/injective/subaccount'
import { fetchOrderHistory } from '@/services/injective/spot'
import { resolveStrategyStatus } from '@/lib/monitoring/statusResolver'
import { useExecutionHistoryStore } from '@/stores/executionHistoryStore'
import type { ExecutionRecord } from '@/lib/monitoring/types'
import type { OrderHistoryEntry, StrategyStatus } from '@/lib/monitoring/types'

/**
 * React Query hook that polls strategy order status via CIDs.
 * Automatically updates the execution history store when status changes.
 *
 * @param executionRecord - The execution record to monitor (null disables)
 * @param baseDecimals - Base token decimals for price conversion
 * @param quoteDecimals - Quote token decimals for price conversion
 */
export function useStrategyStatus(
  executionRecord: ExecutionRecord | null,
  baseDecimals: number,
  quoteDecimals: number
) {
  const { data, isLoading } = useQuery<{ orders: OrderHistoryEntry[]; status: StrategyStatus }>({
    queryKey: ['strategyStatus', executionRecord?.id],
    queryFn: async () => {
      if (!executionRecord) {
        return { orders: [], status: 'syncing' as StrategyStatus }
      }

      const subaccountId = getAgentSubaccountId(executionRecord.walletAddress)
      const allOrders = await fetchOrderHistory(
        subaccountId,
        executionRecord.marketId,
        baseDecimals,
        quoteDecimals
      )

      // Filter to orders belonging to this strategy by CID
      const cidSet = new Set(executionRecord.orderCids)
      const filtered = allOrders.filter((o) => cidSet.has(o.cid))

      const status = resolveStrategyStatus(filtered, executionRecord.orderCids.length)

      // Auto-update stored status if it changed
      if (status !== executionRecord.status) {
        useExecutionHistoryStore.getState().updateStatus(executionRecord.id, status)
      }

      return { orders: filtered, status }
    },
    enabled:
      !!executionRecord &&
      executionRecord.status !== 'complete' &&
      executionRecord.status !== 'cancelled' &&
      executionRecord.status !== 'failed',
    refetchInterval: 10_000,
    staleTime: 5_000,
  })

  return {
    orders: data?.orders ?? [],
    status: data?.status ?? executionRecord?.status ?? ('syncing' as StrategyStatus),
    isLoading,
  }
}
