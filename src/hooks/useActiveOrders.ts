'use client'

import { useQuery } from '@tanstack/react-query'
import { useWalletStore } from '@/stores/walletStore'
import { getAgentSubaccountId } from '@/services/injective/subaccount'
import { fetchActiveOrders } from '@/services/injective/spot'
import type { ActiveOrder } from '@/lib/execution/types'

/**
 * React Query polling hook for fetching active (open) orders.
 * Polls every 10 seconds when enabled.
 *
 * @param marketId - Market ID to query orders for (null disables)
 * @param enabled - External toggle for polling
 * @param baseDecimals - Base token decimals for price conversion
 * @param quoteDecimals - Quote token decimals for price conversion
 */
export function useActiveOrders(
  marketId: string | null,
  enabled: boolean,
  baseDecimals: number,
  quoteDecimals: number
) {
  const address = useWalletStore((s) => s.address)

  const {
    data: orders = [],
    isLoading,
    refetch,
  } = useQuery<ActiveOrder[]>({
    queryKey: ['activeOrders', marketId],
    queryFn: async () => {
      if (!address || !marketId) return []

      const subaccountId = getAgentSubaccountId(address)
      return fetchActiveOrders(subaccountId, marketId, baseDecimals, quoteDecimals)
    },
    enabled: !!marketId && !!address && enabled,
    refetchInterval: 10_000,
    staleTime: 5_000,
  })

  return { orders, isLoading, refetch }
}
