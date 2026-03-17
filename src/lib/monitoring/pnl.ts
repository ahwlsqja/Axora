/**
 * P&L calculation from trade fill data.
 *
 * Input trades should already have human-readable values
 * (price converted via priceScale, fees converted via quoteDecimals).
 */

import type { StrategyPnL } from './types'

interface TradeInput {
  price: number
  quantity: number
  fee: number
  tradeDirection: string
}

/**
 * Calculate realized P&L from an array of converted trade fills.
 *
 * - Buys contribute to totalCost
 * - Sells contribute to totalRevenue
 * - Fees are summed separately
 * - realizedPnL = revenue - cost - fees
 */
export function calculatePnL(trades: TradeInput[]): StrategyPnL {
  let totalCost = 0
  let totalRevenue = 0
  let totalFees = 0
  let buyQty = 0
  let sellQty = 0

  for (const trade of trades) {
    const notional = trade.price * trade.quantity

    if (trade.tradeDirection === 'buy') {
      totalCost += notional
      buyQty += trade.quantity
    } else {
      totalRevenue += notional
      sellQty += trade.quantity
    }

    totalFees += trade.fee
  }

  return {
    totalCost,
    totalRevenue,
    totalFees,
    realizedPnL: totalRevenue - totalCost - totalFees,
    averageEntryPrice: buyQty > 0 ? totalCost / buyQty : 0,
    filledQuantity: buyQty + sellQty,
  }
}
