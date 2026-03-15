'use client'

import type { PresetIntent } from '@/constants/intents'

interface IntentCardProps {
  intent: PresetIntent
  selected: boolean
  onSelect: (id: string) => void
}

export function IntentCard({ intent, selected, onSelect }: IntentCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(intent.id)}
      className={`w-full text-left rounded-2xl border p-5 transition-colors ${
        selected
          ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-200'
          : 'border-gray-100 bg-white shadow-sm hover:border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl" role="img" aria-label={intent.category}>
          {intent.icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">{intent.titleKo}</p>
          <p className="text-xs text-gray-500">{intent.titleEn}</p>
          <p className="text-xs text-gray-400 mt-2">{intent.descriptionKo}</p>
        </div>
      </div>
    </button>
  )
}
