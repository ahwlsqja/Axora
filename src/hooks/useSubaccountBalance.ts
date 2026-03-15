'use client'

import { useQuery } from '@tanstack/react-query'
import {
  fetchSubaccountBalances,
  getAgentSubaccountId,
} from '@/services/injective/subaccount'
import type { SubaccountBalanceEntry } from '@/services/injective/subaccount'
import { BALANCE_POLL_INTERVAL } from '@/utils/constants'

export interface AgentSubaccountBalance {
  denom: string
  totalBalance: string
  availableBalance: string
}

/**
 * React Query hook for fetching the agent subaccount balance.
 * Queries the portfolio and filters for the agent subaccount (nonce 1).
 * Polls at the same interval as the main balance hook.
 */
export function useSubaccountBalance(injectiveAddress: string | null) {
  const subaccountId = injectiveAddress
    ? getAgentSubaccountId(injectiveAddress)
    : null

  const {
    data: balances = [],
    isLoading,
    error,
  } = useQuery<AgentSubaccountBalance[]>({
    queryKey: ['subaccount-balance', subaccountId],
    queryFn: async () => {
      if (!injectiveAddress || !subaccountId) return []

      const allSubaccounts = await fetchSubaccountBalances(injectiveAddress)

      // Filter entries belonging to our agent subaccount (nonce 1)
      // Each entry is { subaccountId, denom, deposit: { totalBalance, availableBalance } }
      const agentEntries = allSubaccounts.filter(
        (entry: SubaccountBalanceEntry) =>
          entry.subaccountId.toLowerCase() === subaccountId.toLowerCase()
      )

      return agentEntries.map((entry: SubaccountBalanceEntry) => ({
        denom: entry.denom,
        totalBalance: entry.deposit?.totalBalance ?? '0',
        availableBalance: entry.deposit?.availableBalance ?? '0',
      }))
    },
    enabled: !!injectiveAddress && !!subaccountId,
    refetchInterval: BALANCE_POLL_INTERVAL,
    staleTime: 5000,
  })

  return {
    balances,
    subaccountId,
    isLoading,
    error,
    hasSubaccount: balances.length > 0,
  }
}
