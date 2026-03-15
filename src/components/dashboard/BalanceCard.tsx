'use client'

import type { TokenBalance } from '@/types'

interface BalanceCardProps {
  balance: TokenBalance
}

/**
 * Single token balance card showing symbol and amount.
 */
export function BalanceCard({ balance }: BalanceCardProps) {
  const displayAmount = parseFloat(balance.amount).toFixed(4)

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-gray-500">{balance.symbol}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">
        {displayAmount}
      </div>
    </div>
  )
}

interface BalanceCardListProps {
  balances: TokenBalance[]
}

/**
 * Grid of balance cards for all tokens.
 */
export function BalanceCardList({ balances }: BalanceCardListProps) {
  if (balances.length === 0) {
    return (
      <p className="text-center text-gray-400">No token balances found.</p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {balances.map((balance) => (
        <BalanceCard key={balance.denom} balance={balance} />
      ))}
    </div>
  )
}
