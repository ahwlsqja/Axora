/**
 * Monitoring domain types for strategy status tracking and P&L calculation.
 */

/** Aggregated strategy status derived from individual order states */
export type StrategyStatus = 'syncing' | 'pending' | 'partially_filled' | 'complete' | 'cancelled' | 'failed'

/** A single order from the indexer order history, with human-readable values */
export interface OrderHistoryEntry {
  orderHash: string
  cid: string
  marketId: string
  direction: 'buy' | 'sell'
  price: number          // human-readable (already converted)
  quantity: number
  filledQuantity: number
  state: string          // raw state from indexer
  createdAt: number
  updatedAt: number
}

/** Strategy-level P&L computed from trade fill data */
export interface StrategyPnL {
  totalCost: number       // sum of (price * qty) for buys
  totalRevenue: number    // sum of (price * qty) for sells
  totalFees: number       // sum of fees
  realizedPnL: number     // revenue - cost - fees
  averageEntryPrice: number
  filledQuantity: number
}

/** Persisted record of a strategy execution */
export interface ExecutionRecord {
  id: string              // CID prefix (axora-{timestamp})
  txHash: string
  marketId: string
  strategyType: string
  orderCids: string[]
  totalCapital: number
  createdAt: number
  status: StrategyStatus
  walletAddress: string   // scope by wallet
}
