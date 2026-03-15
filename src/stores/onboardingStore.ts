import { create } from 'zustand'
import type { OnboardingStep } from '@/types'

const STEP_ORDER: OnboardingStep[] = ['connect', 'explain', 'deposit']
const DEFAULT_DEPOSIT_AMOUNT = 0.1 // 0.1 INJ -- small amount for testnet

interface OnboardingState {
  currentStep: OnboardingStep
  depositAmount: number
  isExecuting: boolean
  txHash: string | null
  error: string | null

  setStep: (step: OnboardingStep) => void
  nextStep: () => void
  prevStep: () => void
  setDepositAmount: (amount: number) => void
  setExecuting: (executing: boolean) => void
  setTxHash: (hash: string) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentStep: 'connect',
  depositAmount: DEFAULT_DEPOSIT_AMOUNT,
  isExecuting: false,
  txHash: null,
  error: null,

  setStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const { currentStep } = get()
    const idx = STEP_ORDER.indexOf(currentStep)
    if (idx < STEP_ORDER.length - 1) {
      set({ currentStep: STEP_ORDER[idx + 1] })
    }
  },

  prevStep: () => {
    const { currentStep } = get()
    const idx = STEP_ORDER.indexOf(currentStep)
    if (idx > 0) {
      set({ currentStep: STEP_ORDER[idx - 1] })
    }
  },

  setDepositAmount: (amount) => set({ depositAmount: amount }),
  setExecuting: (executing) => set({ isExecuting: executing }),
  setTxHash: (hash) => set({ txHash: hash }),
  setError: (error) => set({ error }),

  reset: () =>
    set({
      currentStep: 'connect',
      depositAmount: DEFAULT_DEPOSIT_AMOUNT,
      isExecuting: false,
      txHash: null,
      error: null,
    }),
}))
