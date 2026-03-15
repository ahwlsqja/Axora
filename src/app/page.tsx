'use client'

import { useWallet } from '@/hooks/useWallet'
import { useBalances } from '@/hooks/useBalances'
import { BalanceCardList } from '@/components/dashboard/BalanceCard'

export default function Home() {
  const { address, status } = useWallet()
  const { balances, isLoading } = useBalances(address)

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {status !== 'connected' ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <p className="text-lg text-gray-500">
            Connect your wallet to get started
          </p>
        </div>
      ) : (
        <div>
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            Your Balances
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <svg
                className="h-8 w-8 animate-spin text-gray-400"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          ) : (
            <BalanceCardList balances={balances} />
          )}
        </div>
      )}
    </main>
  )
}
