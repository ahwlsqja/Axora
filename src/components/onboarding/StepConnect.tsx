'use client'

import { Wallet } from '@injectivelabs/wallet-base'
import { isWalletInstalled, getInstallUrl } from '@/services/injective/wallet'
import { useWallet } from '@/hooks/useWallet'
import { useOnboarding } from '@/hooks/useOnboarding'

const WALLET_OPTIONS = [
  { type: Wallet.Keplr, name: 'Keplr', icon: 'K' },
  { type: Wallet.Metamask, name: 'MetaMask', icon: 'M' },
] as const

export function StepConnect() {
  const { address, status, connect } = useWallet()
  const { nextStep, isWalletConnected } = useOnboarding()

  const handleSelect = async (walletType: Wallet) => {
    if (!isWalletInstalled(walletType)) {
      const url = getInstallUrl(walletType)
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    await connect(walletType)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">Connect Wallet</h2>
      <p className="mt-1 text-sm text-gray-500">
        Choose a wallet to get started with your agent account.
      </p>

      {isWalletConnected && address ? (
        <div className="mt-6">
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-5 w-5 text-green-600"
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
            <div>
              <div className="text-sm font-medium text-green-900">
                Wallet Connected
              </div>
              <div className="text-xs text-green-700 font-mono">
                {address.slice(0, 12)}...{address.slice(-6)}
              </div>
            </div>
          </div>

          <button
            onClick={nextStep}
            className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Continue
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {WALLET_OPTIONS.map(({ type, name, icon }) => {
            const installed = isWalletInstalled(type)
            const isConnecting = status === 'connecting'

            return (
              <button
                key={type}
                onClick={() => handleSelect(type)}
                disabled={isConnecting}
                className="flex w-full items-center gap-4 rounded-xl border border-gray-200 px-4 py-3 text-left transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg font-bold text-gray-700">
                  {icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{name}</div>
                  <div className="text-xs text-gray-500">
                    {installed ? 'Installed' : `Install ${name}`}
                  </div>
                </div>
                {isConnecting && (
                  <svg
                    className="h-5 w-5 animate-spin text-gray-400"
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
                )}
                {!installed && !isConnecting && (
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
