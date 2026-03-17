'use client'

import { useState } from 'react'
import { useStrategyStore } from '@/stores/strategyStore'
import { useExecutionStore } from '@/stores/executionStore'
import { useExecution } from '@/hooks/useExecution'
import { OrderPreview } from './OrderPreview'
import { ParameterAdjuster } from './ParameterAdjuster'
import { RiskWarning } from './RiskWarning'
import { ConfirmationDialog } from '@/components/execution/ConfirmationDialog'
import { ExecutionStatus } from '@/components/execution/ExecutionStatus'
import { ActiveOrders } from '@/components/execution/ActiveOrders'
import { MonitoringPanel } from '@/components/monitoring/MonitoringPanel'

const STRATEGY_LABELS: Record<string, { ko: string; en: string; color: string }> = {
  dca: { ko: '분할매수', en: 'DCA', color: 'bg-blue-100 text-blue-700' },
  'stop-loss': { ko: '손절', en: 'Stop-Loss', color: 'bg-red-100 text-red-700' },
  'scale-in': { ko: '눌림목 매수', en: 'Scale-In', color: 'bg-emerald-100 text-emerald-700' },
  'take-profit': { ko: '익절', en: 'Take-Profit', color: 'bg-amber-100 text-amber-700' },
  'limit-buy': { ko: '지정가 매수', en: 'Limit Buy', color: 'bg-violet-100 text-violet-700' },
  'range-accumulate': {
    ko: '구간 매집',
    en: 'Range Accumulate',
    color: 'bg-cyan-100 text-cyan-700',
  },
  bracket: {
    ko: '브래킷 주문',
    en: 'Bracket',
    color: 'bg-indigo-100 text-indigo-700',
  },
}

export function ProposalCard() {
  const proposal = useStrategyStore((s) => s.proposal)
  const validation = useStrategyStore((s) => s.validation)
  const marketSnapshot = useStrategyStore((s) => s.marketSnapshot)
  const proposalId = useStrategyStore((s) => s.proposalId)
  const isGenerating = useStrategyStore((s) => s.isGenerating)
  const strategyError = useStrategyStore((s) => s.error)
  const resetStrategy = useStrategyStore((s) => s.reset)

  const executionPhase = useExecutionStore((s) => s.phase)
  const startConfirmation = useExecutionStore((s) => s.startConfirmation)
  const resetExecution = useExecutionStore((s) => s.reset)

  const { execute, phase, txHash, error: executionError, reset: resetExec } = useExecution()
  const [showMonitor, setShowMonitor] = useState(false)

  if (isGenerating) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm text-gray-600">전략 생성 중... (Generating strategy...)</p>
        </div>
        <div className="mt-4 space-y-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
          <div className="h-20 w-full animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    )
  }

  if (strategyError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-medium text-red-800">전략 생성 실패 (Strategy Generation Failed)</p>
        <p className="mt-1 text-sm text-red-600">{strategyError}</p>
        <button
          type="button"
          onClick={resetStrategy}
          className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          다시 시도 (Retry)
        </button>
      </div>
    )
  }

  if (!proposal) return null

  const label = STRATEGY_LABELS[proposal.strategyType] ?? {
    ko: proposal.strategyType,
    en: proposal.strategyType,
    color: 'bg-gray-100 text-gray-700',
  }

  const isValid = validation?.valid !== false
  const isExecuting = phase !== 'idle' && phase !== 'confirming'
  const showActiveOrders = phase === 'success' || phase === 'idle'

  const baseDecimals = marketSnapshot?.baseDecimals ?? 18
  const quoteDecimals = marketSnapshot?.quoteDecimals ?? 6

  const handleExecuteClick = () => {
    startConfirmation(proposalId, proposal.marketId)
  }

  const handleConfirm = () => {
    execute(proposal, baseDecimals, quoteDecimals, proposal.quoteDenom, proposal.baseDenom)
  }

  const handleCancel = () => {
    resetExecution()
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${label.color}`}>
            {label.ko} / {label.en}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {proposal.baseDenom.toUpperCase()} / {proposal.quoteDenom.includes('0x') ? 'USDT' : proposal.quoteDenom.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-3">
        <div>
          <p className="text-xs text-gray-500">총 자본 (Capital)</p>
          <p className="text-sm font-semibold text-gray-800">
            {proposal.totalCapitalRequired.toLocaleString()} USDT
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">
            {proposal.strategyType === 'bracket' ? '구성 (Structure)' : '분할 수 (Splits)'}
          </p>
          <p className="text-sm font-semibold text-gray-800">
            {proposal.strategyType === 'bracket' ? 'Entry + TP + SL' : proposal.splitCount}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">가격 범위 (Range)</p>
          <p className="text-sm font-semibold text-gray-800">
            {proposal.priceRange.min.toFixed(2)} - {proposal.priceRange.max.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Reasoning */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">AI 판단 근거 (Reasoning)</p>
        <p className="text-sm text-gray-700 leading-relaxed">{proposal.reasoning}</p>
      </div>

      {/* Order Preview */}
      <OrderPreview
        orders={proposal.orders}
        baseDenom={proposal.baseDenom.toUpperCase()}
        quoteDenom={proposal.quoteDenom.includes('0x') ? 'USDT' : proposal.quoteDenom.toUpperCase()}
      />

      {/* Bracket Non-Conditional Warning */}
      {proposal.strategyType === 'bracket' && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs font-medium text-amber-700 mb-1">
            비조건부 주문 안내 (Non-Conditional Orders)
          </p>
          <p className="text-xs text-amber-600 leading-relaxed">
            익절/손절 매도 주문은 진입 매수와 동시에 체결됩니다.
            진입 주문이 체결되지 않아도 매도 주문은 활성 상태로 남습니다.
            기존에 보유한 토큰이 있어야 매도 주문이 유효합니다.
          </p>
          <p className="text-xs text-amber-500 mt-1">
            TP/SL sell orders are placed simultaneously with entry buy.
            They remain active even if entry doesn&apos;t fill.
            Ensure you hold enough base tokens for sells to be valid.
          </p>
        </div>
      )}

      {/* Parameter Adjuster */}
      <ParameterAdjuster />

      {/* Risk Warning */}
      {validation && (
        <RiskWarning warnings={validation.warnings} errors={validation.errors} />
      )}

      {/* Worst-case Outcome */}
      <div className="rounded-lg bg-gray-100 border border-gray-200 p-3">
        <p className="text-xs font-medium text-gray-500 mb-1">최악의 시나리오 (Worst Case)</p>
        <p className="text-sm text-gray-600">{proposal.worstCaseOutcome}</p>
      </div>

      {/* Execution Status (signing / broadcasting / success / error) */}
      {isExecuting && (
        <ExecutionStatus
          phase={phase}
          txHash={txHash}
          error={executionError}
          warnings={useExecutionStore((s) => s.warnings)}
          onReset={resetExec}
        />
      )}

      {/* Execute Button */}
      {!isExecuting && (
        <button
          type="button"
          disabled={!isValid || executionPhase !== 'idle'}
          onClick={handleExecuteClick}
          className={`w-full rounded-xl py-3 text-sm font-semibold transition ${
            isValid && executionPhase === 'idle'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'cursor-not-allowed bg-gray-200 text-gray-400'
          }`}
        >
          {isValid ? '실행하기 (Execute Strategy)' : '전략 수정 필요 (Fix Strategy Issues)'}
        </button>
      )}

      {/* Active Orders */}
      {showActiveOrders && (
        <ActiveOrders
          marketId={proposal.marketId}
          baseDecimals={baseDecimals}
          quoteDecimals={quoteDecimals}
        />
      )}

      {/* Strategy Monitor Toggle */}
      {phase === 'success' && !showMonitor && (
        <button
          type="button"
          onClick={() => setShowMonitor(true)}
          className="w-full rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition"
        >
          Strategy Monitor
        </button>
      )}

      {/* Monitoring Panel */}
      {showMonitor && <MonitoringPanel />}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        proposal={proposal}
        open={executionPhase === 'confirming'}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  )
}
