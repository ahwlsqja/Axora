'use client'

import { useIntentStore } from '@/stores/intentStore'
import { FreeTextInput } from './FreeTextInput'
import { IntentCardGrid } from './IntentCardGrid'
import { IntentConfirmation } from './IntentConfirmation'

export function IntentSection() {
  const { freeText, setFreeText, submitFreeText, source } = useIntentStore()
  const hasSelection = source !== null

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          무엇을 하고 싶으세요?
        </h2>
        <p className="text-sm text-gray-500">What would you like to do?</p>
      </div>

      <div className="mb-4">
        <FreeTextInput
          value={freeText}
          onChange={setFreeText}
          onSubmit={submitFreeText}
          disabled={hasSelection}
        />
      </div>

      <IntentCardGrid />

      {hasSelection && (
        <div className="mt-6">
          <IntentConfirmation />
        </div>
      )}
    </section>
  )
}
