import type { StrategyOrder } from '@/lib/ai/schemas'

interface RecalculateParams {
  strategyType: string
  priceRange: { min: number; max: number }
  splitCount: number
  totalAmount: number
  side: 'buy' | 'sell'
}

/**
 * Deterministic client-side order recalculation.
 * Used when user adjusts parameters (price range, splits, amount)
 * without requiring another AI call.
 *
 * Supports all 6 strategy types with type-specific distribution logic.
 */
export function recalculateOrders(params: RecalculateParams): StrategyOrder[] {
  const { strategyType, priceRange, splitCount, totalAmount, side } = params

  switch (strategyType) {
    case 'stop-loss':
      return buildStopLoss(priceRange, totalAmount, side)
    case 'scale-in':
      return buildWeightedOrders(priceRange, splitCount, totalAmount, side)
    case 'take-profit':
      return buildEvenOrders(priceRange, splitCount, totalAmount, side)
    case 'dca':
    case 'limit-buy':
    case 'range-accumulate':
    default:
      return buildEvenOrders(priceRange, splitCount, totalAmount, side)
  }
}

/**
 * Stop-loss: single order at the minimum price.
 */
function buildStopLoss(
  priceRange: { min: number; max: number },
  totalAmount: number,
  side: 'buy' | 'sell'
): StrategyOrder[] {
  const price = priceRange.min
  const quantity = side === 'buy' ? totalAmount / price : totalAmount

  return [
    {
      side,
      price,
      quantity,
      percentOfTotal: 100,
    },
  ]
}

/**
 * Even distribution: equal capital across evenly spaced price points.
 * Used for DCA, limit-buy, range-accumulate, and take-profit.
 */
function buildEvenOrders(
  priceRange: { min: number; max: number },
  splitCount: number,
  totalAmount: number,
  side: 'buy' | 'sell'
): StrategyOrder[] {
  const orders: StrategyOrder[] = []
  const capitalPerOrder = totalAmount / splitCount
  const percentPerOrder = 100 / splitCount

  for (let i = 0; i < splitCount; i++) {
    const price =
      splitCount === 1
        ? priceRange.min
        : priceRange.min +
          (priceRange.max - priceRange.min) * (i / (splitCount - 1))

    const quantity =
      side === 'buy' ? capitalPerOrder / price : capitalPerOrder

    orders.push({
      side,
      price: roundPrice(price),
      quantity: roundQuantity(quantity),
      percentOfTotal: roundPercent(percentPerOrder),
    })
  }

  return orders
}

/**
 * Weighted distribution: increasing size at lower prices.
 * Used for scale-in strategy where you buy more as price dips.
 * Weights: 1, 2, 3, ..., N (normalized so sum = totalAmount).
 */
function buildWeightedOrders(
  priceRange: { min: number; max: number },
  splitCount: number,
  totalAmount: number,
  side: 'buy' | 'sell'
): StrategyOrder[] {
  const orders: StrategyOrder[] = []

  // Generate weights: lower index = higher price = lower weight
  // Higher index = lower price = higher weight
  const weights = Array.from({ length: splitCount }, (_, i) => i + 1)
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)

  for (let i = 0; i < splitCount; i++) {
    // Price goes from max (index 0) to min (index N-1)
    const price =
      splitCount === 1
        ? priceRange.min
        : priceRange.max -
          (priceRange.max - priceRange.min) * (i / (splitCount - 1))

    const capitalForOrder = (weights[i] / totalWeight) * totalAmount
    const percentOfTotal = (weights[i] / totalWeight) * 100
    const quantity =
      side === 'buy' ? capitalForOrder / price : capitalForOrder

    orders.push({
      side,
      price: roundPrice(price),
      quantity: roundQuantity(quantity),
      percentOfTotal: roundPercent(percentOfTotal),
    })
  }

  return orders
}

/** Round price to 4 decimal places */
function roundPrice(value: number): number {
  return Math.round(value * 10000) / 10000
}

/** Round quantity to 4 decimal places */
function roundQuantity(value: number): number {
  return Math.round(value * 10000) / 10000
}

/** Round percentage to 2 decimal places */
function roundPercent(value: number): number {
  return Math.round(value * 100) / 100
}
