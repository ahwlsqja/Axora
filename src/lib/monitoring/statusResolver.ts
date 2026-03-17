/**
 * Strategy status resolution from aggregated individual order states.
 *
 * Derives a single StrategyStatus from an array of OrderHistoryEntry,
 * handling edge cases like indexer delay (syncing) and partial failures.
 */

import type { OrderHistoryEntry, StrategyStatus } from './types'

/**
 * Extract the strategy prefix from a CID.
 * CID format: `axora-{timestamp}-{index}`
 * Returns: `axora-{timestamp}`
 */
export function getStrategyPrefix(cid: string): string {
  const parts = cid.split('-')
  return `${parts[0]}-${parts[1]}`
}

/**
 * Resolve a single strategy status from its constituent order states.
 *
 * @param orders - Order history entries belonging to this strategy
 * @param expectedCidCount - Number of CIDs submitted in the batch
 * @returns Aggregated strategy status
 */
export function resolveStrategyStatus(
  orders: OrderHistoryEntry[],
  expectedCidCount: number
): StrategyStatus {
  // No orders indexed yet -- indexer likely hasn't caught up
  if (orders.length === 0) return 'syncing'

  const states = orders.map((o) => o.state)

  // All filled -> complete
  if (states.every((s) => s === 'filled')) return 'complete'

  // All cancelled -> cancelled
  if (states.every((s) => s === 'canceled' || s === 'cancelled')) return 'cancelled'

  // Any partial_filled or mix of filled + booked -> partially_filled
  if (states.some((s) => s === 'partial_filled' || s === 'partially_filled')) {
    return 'partially_filled'
  }

  // Some filled + rest cancelled -> partially_filled
  if (states.some((s) => s === 'filled') && states.some((s) => s === 'canceled' || s === 'cancelled')) {
    return 'partially_filled'
  }

  // Some filled + rest booked -> partially_filled
  if (states.some((s) => s === 'filled') && states.some((s) => s === 'booked')) {
    return 'partially_filled'
  }

  // All booked -> pending
  if (states.every((s) => s === 'booked' || s === 'unfilled')) return 'pending'

  // Default -> pending
  return 'pending'
}
