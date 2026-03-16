import { Wallet } from '@injectivelabs/wallet-base'
import { getMsgBroadcaster } from './client'
import { ensureCorrectNetwork } from './wallet'
import { buildBatchOrderMsg, buildCancelOrdersMsg } from '@/lib/execution/orderBuilder'
import type { StrategyProposal } from '@/lib/ai/schemas'
import type { ExecutionResult } from '@/lib/execution/types'

/**
 * Execute a strategy proposal on Injective by broadcasting MsgBatchUpdateOrders.
 *
 * Flow: build chain message -> ensure correct network -> broadcast -> return result.
 * The caller should handle state transitions (signing, broadcasting) via callbacks.
 *
 * @param proposal - Validated strategy proposal from strategyStore
 * @param injectiveAddress - User's Injective bech32 address
 * @param walletType - Active wallet type for network switching
 * @param baseDecimals - Base token decimal places (e.g., 18 for INJ)
 * @param quoteDecimals - Quote token decimal places (e.g., 6 for USDT)
 * @param onBroadcasting - Callback fired after wallet signing, before broadcast submission
 * @returns ExecutionResult with txHash and order CIDs
 */
export async function executeStrategy(
  proposal: StrategyProposal,
  injectiveAddress: string,
  walletType: Wallet,
  baseDecimals: number,
  quoteDecimals: number,
  onBroadcasting?: () => void
): Promise<ExecutionResult> {
  const { msg, cids } = buildBatchOrderMsg(
    proposal,
    injectiveAddress,
    baseDecimals,
    quoteDecimals
  )

  await ensureCorrectNetwork(walletType)

  // Signal that signing is complete and broadcast is about to start
  onBroadcasting?.()

  const broadcaster = getMsgBroadcaster()
  const response = await broadcaster.broadcast({
    msgs: msg,
    injectiveAddress,
  })

  if (response.code !== 0) {
    throw new Error(`Execution failed: ${response.rawLog}`)
  }

  return { txHash: response.txHash, orderCids: cids }
}

/**
 * Cancel specific orders by hash via MsgBatchUpdateOrders.
 *
 * @param orderHashes - Array of order hashes to cancel
 * @param marketId - Market ID the orders belong to
 * @param injectiveAddress - User's Injective bech32 address
 * @param walletType - Active wallet type for network switching
 * @returns Transaction hash of the cancellation
 */
export async function cancelOrders(
  orderHashes: string[],
  marketId: string,
  injectiveAddress: string,
  walletType: Wallet
): Promise<string> {
  const msg = buildCancelOrdersMsg(orderHashes, marketId, injectiveAddress)

  await ensureCorrectNetwork(walletType)

  const broadcaster = getMsgBroadcaster()
  const response = await broadcaster.broadcast({
    msgs: msg,
    injectiveAddress,
  })

  if (response.code !== 0) {
    throw new Error(`Cancellation failed: ${response.rawLog}`)
  }

  return response.txHash
}
