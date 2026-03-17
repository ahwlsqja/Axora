/**
 * Zustand store subscriptions that automatically emit analytics events
 * on state transitions. This keeps all tracking logic out of components.
 *
 * Call `initAnalyticsSubscriptions()` once at app startup (after analytics.init()).
 * Returns a cleanup function that unsubscribes all listeners.
 */

import { analytics } from './index'
import { useIntentStore } from '@/stores/intentStore'
import { useStrategyStore } from '@/stores/strategyStore'
import { useExecutionStore } from '@/stores/executionStore'
import { useWalletStore } from '@/stores/walletStore'
import { useOnboardingStore } from '@/stores/onboardingStore'

export function initAnalyticsSubscriptions(): () => void {
  const unsubscribers: (() => void)[] = []

  // -------------------------------------------------------------------------
  // KPI-02 Step 1: intent_entered
  // -------------------------------------------------------------------------
  unsubscribers.push(
    useIntentStore.subscribe(
      (state) => state.source,
      (source, prevSource) => {
        if (prevSource === null && source !== null) {
          const { selectedPresetId } = useIntentStore.getState()
          analytics.track({
            name: 'intent_entered',
            properties: {
              source,
              ...(selectedPresetId ? { presetId: selectedPresetId } : {}),
            },
          })
        }
      },
    ),
  )

  // -------------------------------------------------------------------------
  // KPI-02 Step 2: proposal_viewed
  // -------------------------------------------------------------------------
  unsubscribers.push(
    useStrategyStore.subscribe(
      (state) => state.proposalId,
      (proposalId, prevProposalId) => {
        if (proposalId > prevProposalId) {
          const { proposal } = useStrategyStore.getState()
          if (proposal) {
            analytics.track({
              name: 'proposal_viewed',
              properties: {
                strategyType: proposal.strategyType,
                marketId: proposal.marketId,
                proposalId,
              },
            })
          }
        }
      },
    ),
  )

  // -------------------------------------------------------------------------
  // KPI-02 Step 3: execution_confirmed
  // -------------------------------------------------------------------------
  unsubscribers.push(
    useExecutionStore.subscribe(
      (state) => state.phase,
      (phase) => {
        if (phase === 'confirming') {
          const { proposalId, marketId } = useExecutionStore.getState()
          const strategyType = useStrategyStore.getState().proposal?.strategyType ?? 'unknown'
          analytics.track({
            name: 'execution_confirmed',
            properties: {
              strategyType,
              marketId: marketId ?? '',
              proposalId: proposalId ?? 0,
            },
          })
        }
      },
    ),
  )

  // -------------------------------------------------------------------------
  // KPI-02 Step 4 + KPI-01: tx_confirmed
  // -------------------------------------------------------------------------
  unsubscribers.push(
    useExecutionStore.subscribe(
      (state) => state.phase,
      (phase) => {
        if (phase === 'success') {
          const { txHash, orderCids, marketId } = useExecutionStore.getState()
          const strategyType = useStrategyStore.getState().proposal?.strategyType ?? 'unknown'
          analytics.track({
            name: 'tx_confirmed',
            properties: {
              strategyType,
              marketId: marketId ?? '',
              txHash: txHash ?? '',
              orderCount: orderCids.length,
            },
          })
        }
      },
    ),
  )

  // -------------------------------------------------------------------------
  // tx_failed
  // -------------------------------------------------------------------------
  unsubscribers.push(
    useExecutionStore.subscribe(
      (state) => state.phase,
      (phase) => {
        if (phase === 'error') {
          const { error, marketId } = useExecutionStore.getState()
          const strategyType = useStrategyStore.getState().proposal?.strategyType ?? 'unknown'
          analytics.track({
            name: 'tx_failed',
            properties: {
              strategyType,
              marketId: marketId ?? '',
              error: error ?? 'Unknown error',
            },
          })
        }
      },
    ),
  )

  // -------------------------------------------------------------------------
  // strategy_adjusted — track parameter changes on the proposal
  // -------------------------------------------------------------------------
  let prevSplitCount: number | null = null
  let prevPriceMin: number | null = null
  let prevPriceMax: number | null = null
  let prevTotalAmount: number | null = null

  unsubscribers.push(
    useStrategyStore.subscribe(
      (state) => state.proposal,
      (proposal) => {
        if (!proposal) {
          // Reset tracking when proposal is cleared
          prevSplitCount = null
          prevPriceMin = null
          prevPriceMax = null
          prevTotalAmount = null
          return
        }

        if (prevSplitCount !== null && proposal.splitCount !== prevSplitCount) {
          analytics.track({
            name: 'strategy_adjusted',
            properties: { field: 'splitCount' },
          })
        }

        if (
          prevPriceMin !== null &&
          prevPriceMax !== null &&
          (proposal.priceRange.min !== prevPriceMin || proposal.priceRange.max !== prevPriceMax)
        ) {
          analytics.track({
            name: 'strategy_adjusted',
            properties: { field: 'priceRange' },
          })
        }

        if (prevTotalAmount !== null && proposal.totalCapitalRequired !== prevTotalAmount) {
          analytics.track({
            name: 'strategy_adjusted',
            properties: { field: 'totalAmount' },
          })
        }

        prevSplitCount = proposal.splitCount
        prevPriceMin = proposal.priceRange.min
        prevPriceMax = proposal.priceRange.max
        prevTotalAmount = proposal.totalCapitalRequired
      },
    ),
  )

  // -------------------------------------------------------------------------
  // KPI-05 prerequisite: wallet_connected
  // -------------------------------------------------------------------------
  unsubscribers.push(
    useWalletStore.subscribe(
      (state) => state.status,
      (status) => {
        if (status === 'connected') {
          const { walletType, address } = useWalletStore.getState()
          analytics.track({
            name: 'wallet_connected',
            properties: {
              walletType: walletType?.toString() ?? 'unknown',
            },
          })

          if (address) {
            // Store first_seen_at in localStorage for first_execution delta
            if (!localStorage.getItem('axora_first_seen')) {
              localStorage.setItem('axora_first_seen', new Date().toISOString())
            }
            analytics.identify(address, {
              $set_once: { first_seen_at: new Date().toISOString() },
            })
          }
        }
      },
    ),
  )

  // -------------------------------------------------------------------------
  // wallet_disconnected
  // -------------------------------------------------------------------------
  unsubscribers.push(
    useWalletStore.subscribe(
      (state) => state.status,
      (status, prevStatus) => {
        if (status === 'disconnected' && prevStatus === 'connected') {
          analytics.track({
            name: 'wallet_disconnected',
            properties: {},
          })
          analytics.reset()
        }
      },
    ),
  )

  // -------------------------------------------------------------------------
  // KPI-04: onboarding_completed + delegation_granted
  // -------------------------------------------------------------------------
  unsubscribers.push(
    useOnboardingStore.subscribe(
      (state) => state.txHash,
      (txHash, prevTxHash) => {
        if (prevTxHash === null && txHash !== null) {
          const { depositAmount } = useOnboardingStore.getState()
          analytics.track({
            name: 'onboarding_completed',
            properties: { depositAmount, txHash },
          })
          analytics.track({
            name: 'delegation_granted',
            properties: { depositAmount },
          })
        }
      },
    ),
  )

  // -------------------------------------------------------------------------
  // KPI-05: first_execution (first strategy execution per user)
  // -------------------------------------------------------------------------
  unsubscribers.push(
    useExecutionStore.subscribe(
      (state) => state.phase,
      (phase) => {
        if (phase === 'success') {
          if (typeof window !== 'undefined' && !localStorage.getItem('axora_first_exec_tracked')) {
            const firstSeen = localStorage.getItem('axora_first_seen')
            const timeSinceFirstSeenMs = firstSeen
              ? Date.now() - new Date(firstSeen).getTime()
              : 0
            analytics.track({
              name: 'first_execution',
              properties: { timeSinceFirstSeenMs },
            })
            localStorage.setItem('axora_first_exec_tracked', 'true')
          }
        }
      },
    ),
  )

  return () => {
    unsubscribers.forEach((unsub) => unsub())
  }
}
