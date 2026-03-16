import { BigNumberInBase } from '@injectivelabs/utils'
import {
  fetchSubaccountBalances,
  getAgentSubaccountId,
} from '@/services/injective/subaccount'
import type { GuardrailResult } from './types'

/**
 * Pre-execution safety validation.
 *
 * Checks:
 * 1. Sufficient balance in agent subaccount for the required capital
 * 2. Capital does not exceed 30% of available balance (concentration cap)
 *
 * Uses BigNumberInBase for precise balance conversion from wei.
 */
export async function validateExecution(
  injectiveAddress: string,
  requiredCapital: number,
  quoteDenom: string,
  quoteDecimals: number
): Promise<GuardrailResult> {
  const subaccountId = getAgentSubaccountId(injectiveAddress)
  const balances = await fetchSubaccountBalances(injectiveAddress)

  // Find the balance entry matching our agent subaccount and quote denom
  const subBalance = balances.find(
    (b) =>
      b.subaccountId.toLowerCase() === subaccountId.toLowerCase() &&
      b.denom === quoteDenom
  )

  // Convert available balance from wei using BigNumberInBase
  const availableWei = subBalance?.deposit?.availableBalance ?? '0'
  const available = new BigNumberInBase(availableWei)
    .toWei(-quoteDecimals) // divide by 10^quoteDecimals
    .toNumber()

  // Check 1: Absolute balance check
  if (requiredCapital > available) {
    return {
      canExecute: false,
      availableBalance: available,
      reason: `Insufficient balance: need ${requiredCapital} but only ${available.toFixed(2)} available`,
    }
  }

  // Check 2: 30% capital concentration cap
  const maxAllowed = available * 0.3
  if (requiredCapital > maxAllowed) {
    return {
      canExecute: false,
      availableBalance: available,
      reason: `Exceeds 30% capital limit: strategy needs ${requiredCapital} but max allowed is ${maxAllowed.toFixed(2)} (30% of ${available.toFixed(2)})`,
    }
  }

  return { canExecute: true, availableBalance: available }
}
