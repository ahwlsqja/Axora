'use client'

import type { ExecutionRecord, StrategyStatus } from '@/lib/monitoring/types'

interface StrategyListProps {
  records: ExecutionRecord[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const STATUS_STYLES: Record<StrategyStatus, { label: string; dot: string; bg: string; text: string }> = {
  syncing: { label: 'Syncing', dot: 'bg-orange-400 animate-pulse', bg: 'bg-orange-50', text: 'text-orange-700' },
  pending: { label: 'Pending', dot: 'bg-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  partially_filled: { label: 'Partial', dot: 'bg-blue-400', bg: 'bg-blue-50', text: 'text-blue-700' },
  complete: { label: 'Complete', dot: 'bg-green-400', bg: 'bg-green-50', text: 'text-green-700' },
  cancelled: { label: 'Cancelled', dot: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-600' },
  failed: { label: 'Failed', dot: 'bg-red-400', bg: 'bg-red-50', text: 'text-red-700' },
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export function StrategyList({ records, selectedId, onSelect }: StrategyListProps) {
  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-6 text-center">
        <p className="text-sm text-zinc-400">
          No strategies executed yet. Create a strategy to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {records.map((record) => {
        const style = STATUS_STYLES[record.status]
        const isSelected = record.id === selectedId

        return (
          <button
            key={record.id}
            type="button"
            onClick={() => onSelect(record.id)}
            className={`w-full rounded-lg border p-3 text-left transition ${
              isSelected
                ? 'border-blue-500 ring-1 ring-blue-500 bg-zinc-800'
                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-200 capitalize">
                  {record.strategyType.replace('-', ' ')}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${style.dot}`} />
                  {style.label}
                </span>
              </div>
              <span className="text-xs text-zinc-500">
                {formatRelativeTime(record.createdAt)}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              {record.totalCapital.toFixed(2)} USDT
            </p>
          </button>
        )
      })}
    </div>
  )
}
