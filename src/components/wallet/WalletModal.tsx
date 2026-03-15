'use client'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Wallet } from '@injectivelabs/wallet-base'
import { isWalletInstalled, getInstallUrl } from '@/services/injective/wallet'
import { useWallet } from '@/hooks/useWallet'

interface WalletModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const WALLET_OPTIONS = [
  { type: Wallet.Keplr, name: 'Keplr', icon: 'K' },
  { type: Wallet.Metamask, name: 'MetaMask', icon: 'M' },
] as const

export function WalletModal({ open, onOpenChange }: WalletModalProps) {
  const { connect, status } = useWallet()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSelect = async (walletType: Wallet) => {
    if (!isWalletInstalled(walletType)) {
      const url = getInstallUrl(walletType)
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
      return
    }

    await connect(walletType)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-gray-900">
            Connect Wallet
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-gray-500">
            Choose a wallet to connect to Injective.
          </Dialog.Description>

          <div className="mt-6 space-y-3">
            {WALLET_OPTIONS.map(({ type, name, icon }) => {
              const installed = mounted && isWalletInstalled(type)
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
                  {!installed && (
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

          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
