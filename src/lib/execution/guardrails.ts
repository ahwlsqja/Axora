import { BigNumberInBase } from '@injectivelabs/utils'
import {
  fetchSubaccountBalances,
  getAgentSubaccountId,
} from '@/services/injective/subaccount'
import { DISPLAY_DENOMS } from '@/utils/constants'
import type { StrategyProposal } from '@/lib/ai/schemas'
import type { GuardrailResult } from './types'

/**
 * Convert display symbol (e.g., "INJ") to chain denom (e.g., "inj").
 * Falls back to lowercase of symbol if not found.
 */
function symbolToChainDenom(symbol: string): string {
  for (const [denom, config] of Object.entries(DISPLAY_DENOMS)) {
    if (config.symbol === symbol) return denom
  }
  return symbol.toLowerCase()
}

/**
 * Pre-execution safety validation.
 *
 * Checks:
 * 1. Sufficient balance in agent subaccount for the strategy
 *    - Buy strategies: check quote currency (e.g., USDT) balance
 *    - Sell strategies: check base currency (e.g., INJ) balance against total quantity
 * 2. Capital does not exceed 30% of available balance (concentration cap)
 */
export async function validateExecution(
  injectiveAddress: string,
  proposal: StrategyProposal,
  quoteDenom: string,
  quoteDecimals: number,
  baseDenom: string,
  baseDecimals: number
): Promise<GuardrailResult> {
  const subaccountId = getAgentSubaccountId(injectiveAddress)
  const balances = await fetchSubaccountBalances(injectiveAddress)

  const buyOrders = proposal.orders.filter((o) => o.side === 'buy')
  const sellOrders = proposal.orders.filter((o) => o.side === 'sell')

  const warnings: string[] = []

  // Helper: get available balance for a denom
  const getAvailable = (denom: string, decimals: number): number => {
    const chainDenom = symbolToChainDenom(denom)
    const subBalance = balances.find(
      (b) =>
        b.subaccountId.toLowerCase() === subaccountId.toLowerCase() &&
        b.denom === chainDenom
    )
    const availableWei = subBalance?.deposit?.availableBalance ?? '0'
    return new BigNumberInBase(availableWei).toWei(-decimals).toNumber()
  }

  // Mixed buy+sell (bracket): validate buy side against quote balance
  if (buyOrders.length > 0 && sellOrders.length > 0) {
    const buyCapital = buyOrders.reduce((sum, o) => sum + o.price * o.quantity, 0)
    const quoteAvailable = getAvailable(quoteDenom, quoteDecimals)
    const quoteLabel = proposal.quoteDenom || 'quote'

    if (buyCapital > quoteAvailable) {
      return {
        canExecute: false,
        availableBalance: quoteAvailable,
        reason: `Insufficient ${quoteLabel} balance for entry: need ${buyCapital.toFixed(4)} but only ${quoteAvailable.toFixed(4)} available`,
      }
    }

    const maxAllowed = quoteAvailable * 0.3
    if (buyCapital > maxAllowed) {
      return {
        canExecute: false,
        availableBalance: quoteAvailable,
        reason: `Exceeds 30% capital limit: entry needs ${buyCapital.toFixed(4)} ${quoteLabel} but max allowed is ${maxAllowed.toFixed(4)} (30% of ${quoteAvailable.toFixed(4)})`,
      }
    }

    warnings.push(
      'Bracket order: sell orders (TP/SL) are placed simultaneously. They require base token balance if entry buy has not filled yet.'
    )

    return { canExecute: true, availableBalance: quoteAvailable, warnings }
  }

  // Sell-only strategy
  if (sellOrders.length > 0 && buyOrders.length === 0) {
    const totalSellQuantity = sellOrders.reduce((sum, o) => sum + o.quantity, 0)
    const baseAvailable = getAvailable(baseDenom, baseDecimals)
    const baseLabel = proposal.baseDenom || 'base'

    if (totalSellQuantity > baseAvailable) {
      return {
        canExecute: false,
        availableBalance: baseAvailable,
        reason: `Insufficient ${baseLabel} balance: need ${totalSellQuantity.toFixed(4)} but only ${baseAvailable.toFixed(4)} available`,
      }
    }

    const maxAllowed = baseAvailable * 0.3
    if (totalSellQuantity > maxAllowed) {
      return {
        canExecute: false,
        availableBalance: baseAvailable,
        reason: `Exceeds 30% capital limit: strategy needs ${totalSellQuantity.toFixed(4)} ${baseLabel} but max allowed is ${maxAllowed.toFixed(4)} (30% of ${baseAvailable.toFixed(4)})`,
      }
    }

    return { canExecute: true, availableBalance: baseAvailable }
  }

  // Buy-only strategy (default)
  const requiredAmount = proposal.totalCapitalRequired
  const quoteAvailable = getAvailable(quoteDenom, quoteDecimals)
  const quoteLabel = proposal.quoteDenom || 'quote'

  if (requiredAmount > quoteAvailable) {
    return {
      canExecute: false,
      availableBalance: quoteAvailable,
      reason: `Insufficient ${quoteLabel} balance: need ${requiredAmount.toFixed(4)} but only ${quoteAvailable.toFixed(4)} available`,
    }
  }

  const maxAllowed = quoteAvailable * 0.3
  if (requiredAmount > maxAllowed) {
    return {
      canExecute: false,
      availableBalance: quoteAvailable,
      reason: `Exceeds 30% capital limit: strategy needs ${requiredAmount.toFixed(4)} ${quoteLabel} but max allowed is ${maxAllowed.toFixed(4)} (30% of ${quoteAvailable.toFixed(4)})`,
    }
  }

  return { canExecute: true, availableBalance: quoteAvailable }
}
