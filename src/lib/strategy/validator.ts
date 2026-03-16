import type { StrategyProposal } from '@/lib/ai/schemas'
import type { MarketSnapshot, ValidationResult } from '@/lib/strategy/types'

/** Maximum allowed price deviation from mid price (50%) */
const MAX_PRICE_DEVIATION = 0.5

/** Maximum number of orders per strategy */
const MAX_ORDERS = 20

/**
 * Validate an AI-generated strategy proposal against market reality.
 *
 * Two-phase validation:
 * 1. Market reality checks (prices relative to market data)
 * 2. Risk threshold enforcement (deviation limits, order counts)
 *
 * Returns errors for hard failures and warnings for soft issues.
 */
export function validateProposal(
  proposal: StrategyProposal,
  market: MarketSnapshot
): ValidationResult {
  const warnings: string[] = []
  const errors: string[] = []

  // --- Order count checks ---
  if (proposal.orders.length > MAX_ORDERS) {
    errors.push(
      `Too many orders: ${proposal.orders.length} exceeds maximum of ${MAX_ORDERS}`
    )
  }

  if (proposal.orders.length === 0) {
    errors.push('Strategy must contain at least one order')
  }

  // --- Price deviation checks ---
  for (let i = 0; i < proposal.orders.length; i++) {
    const order = proposal.orders[i]
    const deviation = Math.abs(order.price - market.midPrice) / market.midPrice

    if (deviation > MAX_PRICE_DEVIATION) {
      errors.push(
        `Order ${i + 1} price ${order.price} deviates ${(deviation * 100).toFixed(1)}% from mid price ${market.midPrice} (max ${MAX_PRICE_DEVIATION * 100}%)`
      )
    } else if (deviation > 0.2) {
      warnings.push(
        `Order ${i + 1} price ${order.price} deviates ${(deviation * 100).toFixed(1)}% from mid price ${market.midPrice}`
      )
    }
  }

  // --- Side-relative price checks ---
  for (let i = 0; i < proposal.orders.length; i++) {
    const order = proposal.orders[i]

    if (order.side === 'buy' && order.price > market.bestAsk && market.bestAsk > 0) {
      warnings.push(
        `Buy order ${i + 1} at ${order.price} is above best ask ${market.bestAsk} (will cross the spread)`
      )
    }

    if (order.side === 'sell' && order.price < market.bestBid && market.bestBid > 0) {
      warnings.push(
        `Sell order ${i + 1} at ${order.price} is below best bid ${market.bestBid} (will cross the spread)`
      )
    }
  }

  // --- Capital checks ---
  if (proposal.totalCapitalRequired <= 0) {
    errors.push('Total capital required must be positive')
  }

  // Capital is always in quote currency (USDT).
  // For buy: quote spent = price * quantity
  // For sell: quote received = price * quantity
  const computedCapital = proposal.orders.reduce((sum, order) => {
    return sum + order.price * order.quantity
  }, 0)

  if (computedCapital > 0) {
    const capitalDiscrepancy =
      Math.abs(computedCapital - proposal.totalCapitalRequired) /
      proposal.totalCapitalRequired

    if (capitalDiscrepancy > 0.1) {
      warnings.push(
        `Total capital ${proposal.totalCapitalRequired} differs from computed order cost ${computedCapital.toFixed(2)} by ${(capitalDiscrepancy * 100).toFixed(1)}%`
      )
    }
  }

  // --- Split count check ---
  if (proposal.splitCount !== proposal.orders.length) {
    warnings.push(
      `splitCount (${proposal.splitCount}) does not match actual order count (${proposal.orders.length})`
    )
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  }
}
