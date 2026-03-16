'use client'

import { toast } from 'sonner'
import { useStrategyStore } from '@/stores/strategyStore'
import { OrderPreview } from './OrderPreview'
import { ParameterAdjuster } from './ParameterAdjuster'
import { RiskWarning } from './RiskWarning'

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
}

export function ProposalCard() {
  const proposal = useStrategyStore((s) => s.proposal)
  const validation = useStrategyStore((s) => s.validation)
  const isGenerating = useStrategyStore((s) => s.isGenerating)
  const error = useStrategyStore((s) => s.error)
  const reset = useStrategyStore((s) => s.reset)

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

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-medium text-red-800">전략 생성 실패 (Strategy Generation Failed)</p>
        <p className="mt-1 text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={reset}
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
          <p className="text-xs text-gray-500">분할 수 (Splits)</p>
          <p className="text-sm font-semibold text-gray-800">{proposal.splitCount}</p>
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

      {/* Footer: Execute Button */}
      <button
        type="button"
        disabled={!isValid}
        onClick={() => toast.info('실행 기능은 Phase 4에서 제공됩니다 (Execution coming in Phase 4)')}
        className={`w-full rounded-xl py-3 text-sm font-semibold transition ${
          isValid
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'cursor-not-allowed bg-gray-200 text-gray-400'
        }`}
      >
        {isValid ? '실행하기 (Proceed to Execute)' : '전략 수정 필요 (Fix Strategy Issues)'}
      </button>
    </div>
  )
}
