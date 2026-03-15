'use client'

import { IntentCardGrid } from './IntentCardGrid'

export function IntentSection() {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          무엇을 하고 싶으세요?
        </h2>
        <p className="text-sm text-gray-500">What would you like to do?</p>
      </div>
      <IntentCardGrid />
      {/* Free-text input added in 02-02 */}
    </section>
  )
}
