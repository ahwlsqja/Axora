'use client'

import { useCallback } from 'react'
import { useExecutionStore } from '@/stores/executionStore'
import { useWalletStore } from '@/stores/walletStore'
import { useExecutionHistoryStore } from '@/stores/executionHistoryStore'
import { validateExecution } from '@/lib/execution/guardrails'
import { getStrategyPrefix } from '@/lib/monitoring/statusResolver'
import {
  executeStrategy,
  cancelOrders as cancelOrdersService,
} from '@/services/injective/execution'
import type { StrategyProposal } from '@/lib/ai/schemas'

/**
 * React hook orchestrating the full execution flow:
 * guardrail check -> state transitions -> execute -> handle result.
 *
 * Reads wallet state via getState() (not reactive) to avoid re-renders.
 * Uses useCallback for stable function references.
 */
export function useExecution() {
  const phase = useExecutionStore((s) => s.phase)
  const txHash = useExecutionStore((s) => s.txHash)
  const error = useExecutionStore((s) => s.error)
  const reset = useExecutionStore((s) => s.reset)

  const execute = useCallback(
    async (
      proposal: StrategyProposal,
      baseDecimals: number,
      quoteDecimals: number,
      quoteDenom: string,
      baseDenom: string
    ) => {
      const store = useExecutionStore.getState()
      const wallet = useWalletStore.getState()

      // Must be in confirming phase (called from confirmation flow)
      if (store.phase !== 'confirming') return

      if (!wallet.address || !wallet.walletType) {
        useExecutionStore.getState().setError('Wallet not connected')
        return
      }

      // Run guardrail checks (buy checks quote balance, sell checks base balance)
      const guardrail = await validateExecution(
        wallet.address,
        proposal,
        quoteDenom,
        quoteDecimals,
        baseDenom,
        baseDecimals
      )

      if (!guardrail.canExecute) {
        useExecutionStore.getState().setError(guardrail.reason ?? 'Guardrail check failed')
        return
      }

      // Store guardrail warnings for UI display (e.g., bracket non-conditional notice)
      if (guardrail.warnings && guardrail.warnings.length > 0) {
        useExecutionStore.getState().setWarnings(guardrail.warnings)
      }

      // Transition to signing -- user sees "Waiting for wallet signature..."
      useExecutionStore.getState().startSigning()

      try {
        const result = await executeStrategy(
          proposal,
          wallet.address,
          wallet.walletType,
          baseDecimals,
          quoteDecimals,
          () => {
            // Callback fired after signing, before broadcast
            useExecutionStore.getState().startBroadcasting()
          }
        )

        useExecutionStore.getState().setSuccess(result.txHash, result.orderCids)

        // Record execution in persistent history
        const strategyPrefix = getStrategyPrefix(result.orderCids[0])
        useExecutionHistoryStore.getState().addRecord({
          id: strategyPrefix,
          txHash: result.txHash,
          marketId: proposal.marketId,
          strategyType: proposal.strategyType,
          orderCids: result.orderCids,
          totalCapital: proposal.totalCapitalRequired,
          createdAt: Date.now(),
          status: 'syncing',
          walletAddress: wallet.address,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Execution failed'
        useExecutionStore.getState().setError(message)
      }
    },
    []
  )

  const cancel = useCallback(
    async (orderHashes: string[], marketId: string) => {
      const wallet = useWalletStore.getState()

      if (!wallet.address || !wallet.walletType) {
        useExecutionStore.getState().setError('Wallet not connected')
        return
      }

      try {
        useExecutionStore.getState().startCancellation(marketId)

        const txHash = await cancelOrdersService(
          orderHashes,
          marketId,
          wallet.address,
          wallet.walletType
        )

        useExecutionStore.getState().setSuccess(txHash, [])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Cancellation failed'
        useExecutionStore.getState().setError(message)
      }
    },
    []
  )

  return { execute, cancel, phase, txHash, error, reset }
}
