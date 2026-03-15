'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchBalances } from '@/services/injective/bank'
import { BALANCE_POLL_INTERVAL, DISPLAY_DENOMS } from '@/utils/constants'
import type { TokenBalance } from '@/types'

/**
 * Convert a raw chain amount to a human-readable decimal string.
 * e.g., "1000000000000000000" with decimals=18 becomes "1"
 */
function toHumanAmount(rawAmount: string, decimals: number): string {
  if (!rawAmount || rawAmount === '0') return '0'

  // Pad the string to ensure it has enough digits
  const padded = rawAmount.padStart(decimals + 1, '0')
  const intPart = padded.slice(0, padded.length - decimals) || '0'
  const decPart = padded.slice(padded.length - decimals)

  // Trim trailing zeros from decimal part
  const trimmedDec = decPart.replace(/0+$/, '')

  return trimmedDec ? `${intPart}.${trimmedDec}` : intPart
}

/**
 * React Query hook for fetching and polling token balances.
 * Only fetches when an Injective address is provided.
 * Auto-refreshes every BALANCE_POLL_INTERVAL (10s).
 */
export function useBalances(injectiveAddress: string | null) {
  const { data: balances = [], isLoading, error } = useQuery<TokenBalance[]>({
    queryKey: ['balances', injectiveAddress],
    queryFn: async () => {
      if (!injectiveAddress) return []

      const rawBalances = await fetchBalances(injectiveAddress)

      // Map raw balances to TokenBalance, filtering to display denoms only
      const mapped: TokenBalance[] = []

      for (const balance of rawBalances) {
        const denomConfig = DISPLAY_DENOMS[balance.denom]
        if (!denomConfig) continue

        mapped.push({
          denom: balance.denom,
          symbol: denomConfig.symbol,
          amount: toHumanAmount(balance.amount, denomConfig.decimals),
          decimals: denomConfig.decimals,
        })
      }

      // Ensure INJ is always present (even if 0)
      if (!mapped.find((b) => b.symbol === 'INJ')) {
        mapped.unshift({
          denom: 'inj',
          symbol: 'INJ',
          amount: '0',
          decimals: 18,
        })
      }

      return mapped
    },
    enabled: !!injectiveAddress,
    refetchInterval: BALANCE_POLL_INTERVAL,
    staleTime: 5000,
  })

  return { balances, isLoading, error }
}
