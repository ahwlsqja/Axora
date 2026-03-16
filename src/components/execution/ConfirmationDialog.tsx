'use client'

import * as Dialog from '@radix-ui/react-dialog'
import type { StrategyProposal } from '@/lib/ai/schemas'

const STRATEGY_LABELS: Record<string, string> = {
  dca: 'DCA (분할매수)',
  'stop-loss': 'Stop-Loss (손절)',
  'scale-in': 'Scale-In (눌림목 매수)',
  'take-profit': 'Take-Profit (익절)',
  'limit-buy': 'Limit Buy (지정가 매수)',
  'range-accumulate': 'Range Accumulate (구간 매집)',
}

interface ConfirmationDialogProps {
  proposal: StrategyProposal
  onConfirm: () => void
  onCancel: () => void
  open: boolean
}

export function ConfirmationDialog({
  proposal,
  onConfirm,
  onCancel,
  open,
}: ConfirmationDialogProps) {
  const strategyLabel =
    STRATEGY_LABELS[proposal.strategyType] ?? proposal.strategyType
  const quoteSymbol = proposal.quoteDenom.includes('0x')
    ? 'USDT'
    : proposal.quoteDenom.toUpperCase()
  const baseSymbol = proposal.baseDenom.toUpperCase()

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="text-lg font-semibold text-gray-900">
            전략 실행 확인 (Confirm Execution)
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-gray-500">
            아래 내용을 확인한 후 서명을 진행합니다.
          </Dialog.Description>

          {/* Summary */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">전략 (Strategy)</span>
              <span className="font-medium text-gray-900">{strategyLabel}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">마켓 (Market)</span>
              <span className="font-medium text-gray-900">
                {baseSymbol} / {quoteSymbol}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">주문 수 (Orders)</span>
              <span className="font-medium text-gray-900">
                {proposal.orders.length} orders
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">총 자본 (Capital)</span>
              <span className="font-medium text-gray-900">
                {proposal.totalCapitalRequired.toLocaleString()} {quoteSymbol}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">가격 범위 (Range)</span>
              <span className="font-medium text-gray-900">
                {proposal.priceRange.min.toFixed(2)} &mdash;{' '}
                {proposal.priceRange.max.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Worst case */}
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs font-medium text-amber-700 mb-1">
              최악의 시나리오 (Worst Case)
            </p>
            <p className="text-sm text-amber-600">{proposal.worstCaseOutcome}</p>
          </div>

          {/* Warning banner */}
          <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-sm text-blue-700">
              지갑에서 트랜잭션 서명을 요청합니다. (You will be asked to sign this
              transaction with your wallet.)
            </p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              취소 (Cancel)
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              확인 및 서명 (Confirm & Sign)
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
