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

  const isSellStrategy = proposal.orders.length > 0 && proposal.orders[0].side === 'sell'

  // Determine which denom and amount to check
  // Convert display symbols to chain denoms for balance lookup
  const checkDenom = symbolToChainDenom(isSellStrategy ? baseDenom : quoteDenom)
  const checkDecimals = isSellStrategy ? baseDecimals : quoteDecimals

  // For sell: required amount = total base quantity to sell
  // For buy: required amount = total quote capital needed
  const requiredAmount = isSellStrategy
    ? proposal.orders.reduce((sum, o) => sum + o.quantity, 0)
    : proposal.totalCapitalRequired

  const denomLabel = isSellStrategy
    ? proposal.baseDenom || 'base'
    : proposal.quoteDenom || 'quote'

  // Find the balance entry matching our agent subaccount and the relevant denom
  const subBalance = balances.find(
    (b) =>
      b.subaccountId.toLowerCase() === subaccountId.toLowerCase() &&
      b.denom === checkDenom
  )

  // Convert available balance from wei
  const availableWei = subBalance?.deposit?.availableBalance ?? '0'
  const available = new BigNumberInBase(availableWei)
    .toWei(-checkDecimals)
    .toNumber()

  // Check 1: Absolute balance check
  if (requiredAmount > available) {
    return {
      canExecute: false,
      availableBalance: available,
      reason: `Insufficient ${denomLabel} balance: need ${requiredAmount.toFixed(4)} but only ${available.toFixed(4)} available`,
    }
  }

  // Check 2: 30% capital concentration cap
  const maxAllowed = available * 0.3
  if (requiredAmount > maxAllowed) {
    return {
      canExecute: false,
      availableBalance: available,
      reason: `Exceeds 30% capital limit: strategy needs ${requiredAmount.toFixed(4)} ${denomLabel} but max allowed is ${maxAllowed.toFixed(4)} (30% of ${available.toFixed(4)})`,
    }
  }

  return { canExecute: true, availableBalance: available }
}
