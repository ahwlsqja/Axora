'use client'

import { useWallet } from '@/hooks/useWallet'
import { IntentSection } from '@/components/intent/IntentSection'
import { DashboardSection } from '@/components/dashboard/DashboardSection'

export default function Home() {
  const { address, status } = useWallet()

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <IntentSection />
      {status === 'connected' && address && (
        <DashboardSection address={address} />
      )}
    </main>
  )
}
