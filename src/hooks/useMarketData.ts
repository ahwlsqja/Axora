'use client'

import { useQuery } from '@tanstack/react-query'
import type { MarketSnapshot } from '@/lib/strategy/types'

async function fetchMarket(marketId: string): Promise<MarketSnapshot> {
  const res = await fetch(`/api/market?id=${encodeURIComponent(marketId)}`)

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(
      (data as { error?: string }).error ?? 'Failed to fetch market data'
    )
  }

  return res.json() as Promise<MarketSnapshot>
}

async function fetchSupportedMarkets(): Promise<Record<string, string>> {
  const res = await fetch('/api/market/supported')

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(
      (data as { error?: string }).error ?? 'Failed to fetch supported markets'
    )
  }

  const json = (await res.json()) as { markets: Record<string, string> }
  return json.markets
}

/**
 * Hook for fetching market snapshot data with 30s cache.
 * Automatically refetches when marketId changes.
 */
export function useMarketData(marketId: string | null) {
  return useQuery({
    queryKey: ['market', marketId],
    queryFn: () => fetchMarket(marketId!),
    enabled: !!marketId,
    staleTime: 30_000,
  })
}

/**
 * Hook for fetching supported markets with 5min cache.
 * Returns a map of market name -> market ID.
 */
export function useSupportedMarkets() {
  return useQuery({
    queryKey: ['supported-markets'],
    queryFn: fetchSupportedMarkets,
    staleTime: 5 * 60_000,
  })
}
