'use client'

import Link from 'next/link'
import { useBalances } from '@/hooks/useBalances'
import { useSubaccountBalance } from '@/hooks/useSubaccountBalance'
import { BalanceCardList } from '@/components/dashboard/BalanceCard'

function AgentSubaccountCard({
  balances,
}: {
  balances: { denom: string; totalBalance: string; availableBalance: string }[]
}) {
  const injBalance = balances.find((b) => b.denom === 'inj')

  const formatWei = (wei: string): string => {
    const num = BigInt(wei.split('.')[0])
    const whole = num / BigInt(10 ** 18)
    const remainder = num % BigInt(10 ** 18)
    const decimals = remainder.toString().padStart(18, '0').slice(0, 4)
    return `${whole}.${decimals}`
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-blue-900">Agent Account</h3>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          Active
        </span>
      </div>
      {injBalance ? (
        <div className="mt-2">
          <p className="text-2xl font-semibold text-blue-900">
            {formatWei(injBalance.availableBalance)} INJ
          </p>
          <p className="text-xs text-blue-600 mt-0.5">
            Available for trading
          </p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-blue-700">No INJ deposited</p>
      )}
    </div>
  )
}

function SetupAgentCard() {
  return (
    <Link
      href="/onboarding"
      className="block rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-5 transition-colors hover:bg-blue-50 hover:border-blue-300"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <svg
            className="h-5 w-5 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <div>
          <div className="text-sm font-medium text-blue-900">
            Set Up Agent Account
          </div>
          <div className="text-xs text-blue-600">
            Create a sub-wallet for automated trading
          </div>
        </div>
      </div>
    </Link>
  )
}

interface DashboardSectionProps {
  address: string
}

export function DashboardSection({ address }: DashboardSectionProps) {
  const { balances, isLoading } = useBalances(address)
  const {
    balances: subBalances,
    hasSubaccount,
    isLoading: subLoading,
  } = useSubaccountBalance(address)

  return (
    <div className="mt-12 pt-8 border-t border-gray-100">
      {/* Agent account section */}
      <div className="mb-8">
        {hasSubaccount ? (
          <AgentSubaccountCard balances={subBalances} />
        ) : !subLoading ? (
          <SetupAgentCard />
        ) : null}
      </div>

      {/* Main balances */}
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
  )
}
