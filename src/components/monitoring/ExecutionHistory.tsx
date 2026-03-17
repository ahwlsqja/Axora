'use client'

import type { ExecutionRecord, StrategyStatus } from '@/lib/monitoring/types'

interface ExecutionHistoryProps {
  records: ExecutionRecord[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const STATUS_DOT: Record<StrategyStatus, string> = {
  syncing: 'bg-orange-400 animate-pulse',
  pending: 'bg-yellow-400',
  partially_filled: 'bg-blue-400',
  complete: 'bg-green-400',
  cancelled: 'bg-gray-400',
  failed: 'bg-red-400',
}

function formatDateTime(timestamp: number): string {
  const d = new Date(timestamp)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${month}/${day} ${hours}:${minutes}`
}

export function ExecutionHistory({ records, selectedId, onSelect }: ExecutionHistoryProps) {
  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 text-center">
        <p className="text-sm text-zinc-500">No execution history</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 overflow-hidden">
      <div className="border-b border-zinc-700 bg-zinc-800 px-4 py-2">
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
          Execution History
        </h4>
      </div>
      <div className="divide-y divide-zinc-700/50">
        {records.map((record) => {
          const isSelected = record.id === selectedId
          return (
            <button
              key={record.id}
              type="button"
              onClick={() => onSelect(record.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition hover:bg-zinc-700/30 ${
                isSelected ? 'bg-zinc-700/40' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[record.status]}`} />
                <span className="text-sm text-zinc-300 capitalize">
                  {record.strategyType.replace('-', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">
                  {record.totalCapital.toFixed(2)} USDT
                </span>
                <span className="text-xs text-zinc-600">
                  {formatDateTime(record.createdAt)}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
