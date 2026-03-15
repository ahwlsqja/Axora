'use client'

import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useWalletStore } from '@/stores/walletStore'
import { executeOnboarding } from '@/services/injective/onboarding'

/**
 * Hook that combines onboarding store state with wallet state
 * and provides the executeOnboardingFlow action.
 */
export function useOnboarding() {
  const {
    currentStep,
    depositAmount,
    isExecuting,
    txHash,
    error,
    setStep,
    nextStep,
    prevStep,
    setDepositAmount,
    setExecuting,
    setTxHash,
    setError,
    reset,
  } = useOnboardingStore()

  const { address, status } = useWalletStore()
  const isWalletConnected = status === 'connected'

  /**
   * Execute the full onboarding flow:
   * deposit to agent subaccount + AuthZ grants in a single transaction.
   */
  const executeOnboardingFlow = useCallback(async () => {
    if (!address) {
      toast.error('Please connect your wallet first')
      return
    }

    setExecuting(true)
    setError(null)

    try {
      const hash = await executeOnboarding(address, depositAmount)
      setTxHash(hash)
      toast.success('Onboarding complete! Agent account created.')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Onboarding transaction failed'
      setError(message)
      toast.error(message)
    } finally {
      setExecuting(false)
    }
  }, [address, depositAmount, setExecuting, setError, setTxHash])

  /**
   * Whether the user can proceed from the current step.
   */
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 'connect':
        return isWalletConnected
      case 'explain':
        return true
      case 'deposit':
        return depositAmount > 0
      default:
        return false
    }
  }, [currentStep, isWalletConnected, depositAmount])

  return {
    // State
    currentStep,
    depositAmount,
    isExecuting,
    txHash,
    error,
    isWalletConnected,
    canProceed,

    // Actions
    setStep,
    nextStep,
    prevStep,
    setDepositAmount,
    executeOnboardingFlow,
    reset,
  }
}
