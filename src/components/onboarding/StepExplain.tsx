'use client'

import { useOnboarding } from '@/hooks/useOnboarding'

const BENEFITS = [
  {
    title: 'Isolated sub-wallet',
    description:
      'A dedicated sub-wallet for automated trading -- separate from your main balance.',
    icon: (
      <svg
        className="h-5 w-5 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
  },
  {
    title: 'Bounded risk',
    description:
      'The agent can only trade within the amount you deposit -- never more.',
    icon: (
      <svg
        className="h-5 w-5 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    title: 'Full control',
    description:
      'You can revoke access anytime -- you stay in full control.',
    icon: (
      <svg
        className="h-5 w-5 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
        />
      </svg>
    ),
  },
]

export function StepExplain() {
  const { nextStep, prevStep } = useOnboarding()

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">
        What is an Agent Account?
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Understand how your funds are protected during automated trading.
      </p>

      <div className="mt-6 space-y-4">
        {BENEFITS.map((item) => (
          <div key={item.title} className="flex gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              {item.icon}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {item.title}
              </div>
              <div className="text-sm text-gray-500">{item.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3">
        <p className="text-xs text-gray-500">
          Permissions expire automatically after 7 days. You can renew or revoke
          them at any time.
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={prevStep}
          className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={nextStep}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
