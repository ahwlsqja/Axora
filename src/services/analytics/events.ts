/**
 * Typed analytics event definitions for the Axora conversion funnel.
 *
 * Each event is a discriminated union member keyed by `name`.
 * Properties carry the minimum context needed for KPI aggregation.
 */

// ---------------------------------------------------------------------------
// Event property types
// ---------------------------------------------------------------------------

interface IntentEnteredProps {
  source: 'preset' | 'freetext'
  presetId?: string
}

interface ProposalViewedProps {
  strategyType: string
  marketId: string
  proposalId: number
}

interface ExecutionConfirmedProps {
  strategyType: string
  marketId: string
  proposalId: number
}

interface TxConfirmedProps {
  strategyType: string
  marketId: string
  txHash: string
  orderCount: number
}

interface TxFailedProps {
  strategyType: string
  marketId: string
  error: string
}

interface StrategyAdjustedProps {
  field: 'splitCount' | 'priceRange' | 'totalAmount'
}

interface WalletConnectedProps {
  walletType: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface WalletDisconnectedProps {}

interface OnboardingCompletedProps {
  depositAmount: number
  txHash: string
}

interface DelegationGrantedProps {
  depositAmount: number
}

interface FirstExecutionProps {
  timeSinceFirstSeenMs: number
}

// ---------------------------------------------------------------------------
// Discriminated union
// ---------------------------------------------------------------------------

export type AnalyticsEvent =
  | { name: 'intent_entered'; properties: IntentEnteredProps }
  | { name: 'proposal_viewed'; properties: ProposalViewedProps }
  | { name: 'execution_confirmed'; properties: ExecutionConfirmedProps }
  | { name: 'tx_confirmed'; properties: TxConfirmedProps }
  | { name: 'tx_failed'; properties: TxFailedProps }
  | { name: 'strategy_adjusted'; properties: StrategyAdjustedProps }
  | { name: 'wallet_connected'; properties: WalletConnectedProps }
  | { name: 'wallet_disconnected'; properties: WalletDisconnectedProps }
  | { name: 'onboarding_completed'; properties: OnboardingCompletedProps }
  | { name: 'delegation_granted'; properties: DelegationGrantedProps }
  | { name: 'first_execution'; properties: FirstExecutionProps }
