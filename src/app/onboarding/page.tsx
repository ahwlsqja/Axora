'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingStepper } from '@/components/onboarding/OnboardingStepper'
import { useWallet } from '@/hooks/useWallet'
import { useSubaccountBalance } from '@/hooks/useSubaccountBalance'

export default function OnboardingPage() {
  const router = useRouter()
  const { address } = useWallet()
  const { hasSubaccount, isLoading } = useSubaccountBalance(address)

  // If user already has an active agent subaccount, redirect to dashboard
  useEffect(() => {
    if (hasSubaccount && !isLoading) {
      router.push('/')
    }
  }, [hasSubaccount, isLoading, router])

  if (hasSubaccount && !isLoading) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-gray-500">Already onboarded. Redirecting...</p>
      </main>
    )
  }

  return (
    <main className="min-h-[80vh]">
      <OnboardingStepper />
    </main>
  )
}
