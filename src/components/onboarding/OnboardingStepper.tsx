'use client'

import { useOnboarding } from '@/hooks/useOnboarding'
import type { OnboardingStep } from '@/types'
import { StepConnect } from './StepConnect'
import { StepExplain } from './StepExplain'
import { StepDeposit } from './StepDeposit'

const STEPS: { key: OnboardingStep; label: string }[] = [
  { key: 'connect', label: 'Connect' },
  { key: 'explain', label: 'Learn' },
  { key: 'deposit', label: 'Approve' },
]

function StepIndicator({
  step,
  index,
  currentStep,
}: {
  step: { key: OnboardingStep; label: string }
  index: number
  currentStep: OnboardingStep
}) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep)
  const isCompleted = index < currentIndex
  const isCurrent = index === currentIndex

  return (
    <div className="flex items-center">
      {index > 0 && (
        <div
          className={`mx-2 h-px w-8 sm:w-12 ${
            isCompleted ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        />
      )}
      <div className="flex flex-col items-center gap-1.5">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
            isCompleted
              ? 'bg-blue-600 text-white'
              : isCurrent
                ? 'border-2 border-blue-600 text-blue-600'
                : 'border-2 border-gray-200 text-gray-400'
          }`}
        >
          {isCompleted ? (
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            index + 1
          )}
        </div>
        <span
          className={`text-xs font-medium ${
            isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'
          }`}
        >
          {step.label}
        </span>
      </div>
    </div>
  )
}

export function OnboardingStepper() {
  const { currentStep } = useOnboarding()

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      {/* Stepper indicator */}
      <div className="mb-10 flex items-start justify-center">
        {STEPS.map((step, index) => (
          <StepIndicator
            key={step.key}
            step={step}
            index={index}
            currentStep={currentStep}
          />
        ))}
      </div>

      {/* Active step content */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {currentStep === 'connect' && <StepConnect />}
        {currentStep === 'explain' && <StepExplain />}
        {currentStep === 'deposit' && <StepDeposit />}
      </div>
    </div>
  )
}
