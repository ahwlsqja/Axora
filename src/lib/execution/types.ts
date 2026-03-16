/**
 * Execution domain types for strategy order placement and tracking.
 */

/** Execution state machine phases */
export type ExecutionPhase =
  | 'idle'
  | 'confirming'
  | 'signing'
  | 'broadcasting'
  | 'success'
  | 'error'

/** Result of a successful strategy execution broadcast */
export interface ExecutionResult {
  txHash: string
  orderCids: string[]
}

/** An active (open) order on the Injective spot market */
export interface ActiveOrder {
  orderHash: string
  cid: string
  marketId: string
  side: 'buy' | 'sell'
  price: number
  quantity: number
  unfilledQuantity: number
  /** Raw chain order state string (e.g., 'booked', 'partial_filled') */
  state: string
}

/** Result of pre-execution guardrail validation */
export interface GuardrailResult {
  canExecute: boolean
  availableBalance: number
  reason?: string
}
