'use client'

import { useCallback } from 'react'
import { useExecutionStore } from '@/stores/executionStore'
import { useWalletStore } from '@/stores/walletStore'
import { validateExecution } from '@/lib/execution/guardrails'
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
      quoteDenom: string
    ) => {
      const store = useExecutionStore.getState()
      const wallet = useWalletStore.getState()

      // Must be in confirming phase (called from confirmation flow)
      if (store.phase !== 'confirming') return

      if (!wallet.address || !wallet.walletType) {
        useExecutionStore.getState().setError('Wallet not connected')
        return
      }

      // Run guardrail checks
      const guardrail = await validateExecution(
        wallet.address,
        proposal.totalCapitalRequired,
        quoteDenom,
        quoteDecimals
      )

      if (!guardrail.canExecute) {
        useExecutionStore.getState().setError(guardrail.reason ?? 'Guardrail check failed')
        return
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
        useExecutionStore.getState().startSigning()

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
