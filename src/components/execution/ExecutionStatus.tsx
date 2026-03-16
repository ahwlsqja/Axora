'use client'

import type { ExecutionPhase } from '@/lib/execution/types'

interface ExecutionStatusProps {
  phase: ExecutionPhase
  txHash: string | null
  error: string | null
  onReset: () => void
}

function Spinner() {
  return (
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
  )
}

export function ExecutionStatus({
  phase,
  txHash,
  error,
  onReset,
}: ExecutionStatusProps) {
  if (phase === 'signing') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <Spinner />
        <p className="text-sm font-medium text-blue-700">
          지갑 서명 대기 중... (Waiting for wallet signature...)
        </p>
      </div>
    )
  }

  if (phase === 'broadcasting') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <Spinner />
        <p className="text-sm font-medium text-blue-700">
          트랜잭션 전파 중... (Broadcasting transaction...)
        </p>
      </div>
    )
  }

  if (phase === 'success') {
    const truncatedHash = txHash
      ? `${txHash.slice(0, 8)}...${txHash.slice(-6)}`
      : ''
    const explorerUrl = txHash
      ? `https://testnet.explorer.injective.network/transaction/${txHash}`
      : '#'

    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-xs">
            &#10003;
          </div>
          <p className="text-sm font-semibold text-green-800">
            전략 실행 완료! (Strategy executed!)
          </p>
        </div>
        {txHash && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs font-mono text-green-600 hover:text-green-800 underline"
          >
            TX: {truncatedHash}
          </a>
        )}
        <button
          type="button"
          onClick={onReset}
          className="block w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
        >
          주문 보기 (View Orders)
        </button>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
            &#10005;
          </div>
          <p className="text-sm font-semibold text-red-800">
            실행 실패 (Execution failed)
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={onReset}
          className="block w-full rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
        >
          다시 시도 (Try Again)
        </button>
      </div>
    )
  }

  // idle or confirming -- nothing to show
  return null
}
