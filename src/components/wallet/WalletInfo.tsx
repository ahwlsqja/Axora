'use client'

import { useState, useRef, useEffect } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { useBalances } from '@/hooks/useBalances'
import { truncateAddress } from '@/utils/address'

/**
 * Displays the connected wallet's truncated address and INJ balance.
 * Click reveals a dropdown with a Disconnect button.
 */
export function WalletInfo() {
  const { address, disconnect } = useWallet()
  const { balances } = useBalances(address)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const injBalance = balances.find((b) => b.symbol === 'INJ')
  const formattedBalance = injBalance
    ? parseFloat(injBalance.amount).toFixed(4)
    : '0.0000'

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  if (!address) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm transition-colors hover:bg-gray-50"
      >
        <span className="h-2 w-2 rounded-full bg-green-500" />
        <span className="font-medium text-gray-900">
          {truncateAddress(address)}
        </span>
        <span className="text-gray-500">{formattedBalance} INJ</span>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg z-50">
          <button
            onClick={() => {
              disconnect()
              setDropdownOpen(false)
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}
