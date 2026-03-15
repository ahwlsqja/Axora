'use client'

import { useState, useCallback, useEffect } from 'react'
import * as Slider from '@radix-ui/react-slider'
import { useOnboarding } from '@/hooks/useOnboarding'
import { useWallet } from '@/hooks/useWallet'
import { useBalances } from '@/hooks/useBalances'
import { useRouter } from 'next/navigation'

const MIN_DEPOSIT = 0.01
const GAS_RESERVE = 0.01
const RECOMMENDED_AMOUNT = 0.1

export function StepDeposit() {
  const router = useRouter()
  const { address } = useWallet()
  const { balances } = useBalances(address)
  const {
    depositAmount,
    isExecuting,
    txHash,
    error,
    prevStep,
    setDepositAmount,
    executeOnboardingFlow,
  } = useOnboarding()

  // Get user's available INJ balance
  const injBalance = balances.find((b) => b.symbol === 'INJ')
  const availableBalance = Math.max(
    0,
    parseFloat(injBalance?.amount ?? '0') - GAS_RESERVE
  )
  const maxDeposit = Math.max(MIN_DEPOSIT, availableBalance)

  // Set default deposit amount on mount
  useEffect(() => {
    const recommended = Math.min(RECOMMENDED_AMOUNT, availableBalance * 0.1)
    const defaultAmount = Math.max(MIN_DEPOSIT, recommended)
    if (defaultAmount > MIN_DEPOSIT) {
      setDepositAmount(parseFloat(defaultAmount.toFixed(4)))
    }
  }, [availableBalance, setDepositAmount])

  // Manual input state
  const [inputValue, setInputValue] = useState(depositAmount.toString())

  // Sync input with slider
  useEffect(() => {
    setInputValue(depositAmount.toFixed(4))
  }, [depositAmount])

  const handleSliderChange = useCallback(
    (values: number[]) => {
      const val = parseFloat(values[0].toFixed(4))
      setDepositAmount(val)
    },
    [setDepositAmount]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value)
      const parsed = parseFloat(e.target.value)
      if (!isNaN(parsed) && parsed >= MIN_DEPOSIT && parsed <= maxDeposit) {
        setDepositAmount(parseFloat(parsed.toFixed(4)))
      }
    },
    [setDepositAmount, maxDeposit]
  )

  const handleApprove = useCallback(async () => {
    await executeOnboardingFlow()
  }, [executeOnboardingFlow])

  // Redirect to dashboard after successful onboarding
  useEffect(() => {
    if (txHash) {
      const timer = setTimeout(() => {
        router.push('/')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [txHash, router])

  if (txHash) {
    return (
      <div className="text-center py-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="mt-3 text-lg font-semibold text-gray-900">
          Onboarding Complete!
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Your agent account is ready. Redirecting to dashboard...
        </p>
        <p className="mt-2 text-xs font-mono text-gray-400 break-all">
          TX: {txHash}
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">
        Fund Agent Account
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Choose how much INJ to deposit. Start small -- you can add more later.
      </p>

      {/* Available balance */}
      <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5">
        <span className="text-sm text-gray-500">Available balance</span>
        <span className="text-sm font-medium text-gray-900">
          {injBalance ? `${parseFloat(injBalance.amount).toFixed(4)} INJ` : 'Loading...'}
        </span>
      </div>

      {/* Amount slider */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Deposit Amount
          </label>
          <span className="text-xs text-gray-400">
            Recommended: {RECOMMENDED_AMOUNT} INJ
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Slider.Root
            className="relative flex h-5 flex-1 touch-none select-none items-center"
            value={[depositAmount]}
            onValueChange={handleSliderChange}
            min={MIN_DEPOSIT}
            max={maxDeposit}
            step={0.001}
          >
            <Slider.Track className="relative h-1.5 w-full grow rounded-full bg-gray-200">
              <Slider.Range className="absolute h-full rounded-full bg-blue-600" />
            </Slider.Track>
            <Slider.Thumb className="block h-5 w-5 rounded-full border-2 border-blue-600 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" />
          </Slider.Root>

          <div className="relative w-28">
            <input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              min={MIN_DEPOSIT}
              max={maxDeposit}
              step={0.001}
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-right text-sm font-mono text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
              INJ
            </span>
          </div>
        </div>
      </div>

      {/* Transaction summary */}
      <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Transaction Summary
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Deposit</span>
            <span className="font-medium text-gray-900">
              {depositAmount.toFixed(4)} INJ to agent account
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Permissions</span>
            <span className="text-gray-700">Spot market trading</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Grant types</span>
            <span>Limit, Market, Cancel, Batch</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Expires</span>
            <span className="text-gray-700">7 days from now</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between">
            <span className="text-gray-500">Transaction</span>
            <span className="font-medium text-gray-900">
              1 deposit + 4 authorization grants
            </span>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={prevStep}
          disabled={isExecuting}
          className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleApprove}
          disabled={isExecuting || depositAmount < MIN_DEPOSIT}
          className="flex-[2] rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExecuting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
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
              Signing...
            </span>
          ) : (
            'Approve & Start'
          )}
        </button>
      </div>
    </div>
  )
}
