'use client'

import { PRESET_INTENTS } from '@/constants/intents'
import { useIntentStore } from '@/stores/intentStore'
import { IntentCard } from './IntentCard'

export function IntentCardGrid() {
  const selectedPresetId = useIntentStore((s) => s.selectedPresetId)
  const selectPreset = useIntentStore((s) => s.selectPreset)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {PRESET_INTENTS.map((intent) => (
        <IntentCard
          key={intent.id}
          intent={intent}
          selected={selectedPresetId === intent.id}
          onSelect={selectPreset}
        />
      ))}
    </div>
  )
}
