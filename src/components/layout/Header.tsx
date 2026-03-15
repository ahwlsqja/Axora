'use client'

import { ConnectButton } from '@/components/wallet/ConnectButton'

/**
 * App header with logo on left and wallet connect button on right.
 * Sticky at top, clean minimal styling.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="text-lg font-semibold text-gray-900">
          Injective Agent
        </div>
        <ConnectButton />
      </div>
    </header>
  )
}
