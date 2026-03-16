import { create } from 'zustand'
import type { StrategyProposal } from '@/lib/ai/schemas'
import type { ValidationResult } from '@/lib/strategy/types'
import { recalculateOrders } from '@/lib/strategy/calculator'

interface StrategyState {
  proposal: StrategyProposal | null
  validation: ValidationResult | null
  isGenerating: boolean
  error: string | null

  setProposal: (proposal: StrategyProposal, validation: ValidationResult) => void
  setGenerating: () => void
  setError: (msg: string) => void
  adjustSplitCount: (count: number) => void
  adjustPriceRange: (min: number, max: number) => void
  adjustTotalAmount: (amount: number) => void
  reset: () => void
}

export const useStrategyStore = create<StrategyState>((set, get) => ({
  proposal: null,
  validation: null,
  isGenerating: false,
  error: null,

  setProposal: (proposal, validation) => {
    set({
      proposal,
      validation,
      isGenerating: false,
      error: null,
    })
  },

  setGenerating: () => {
    set({ isGenerating: true, error: null })
  },

  setError: (msg) => {
    set({ error: msg, isGenerating: false })
  },

  adjustSplitCount: (count) => {
    const { proposal } = get()
    if (!proposal) return

    const side = proposal.orders[0]?.side ?? 'buy'
    const orders = recalculateOrders({
      strategyType: proposal.strategyType,
      priceRange: proposal.priceRange,
      splitCount: count,
      totalAmount: proposal.totalCapitalRequired,
      side,
    })

    set({
      proposal: {
        ...proposal,
        splitCount: count,
        orders,
      },
    })
  },

  adjustPriceRange: (min, max) => {
    const { proposal } = get()
    if (!proposal) return

    const side = proposal.orders[0]?.side ?? 'buy'
    const orders = recalculateOrders({
      strategyType: proposal.strategyType,
      priceRange: { min, max },
      splitCount: proposal.splitCount,
      totalAmount: proposal.totalCapitalRequired,
      side,
    })

    set({
      proposal: {
        ...proposal,
        priceRange: { min, max },
        orders,
      },
    })
  },

  adjustTotalAmount: (amount) => {
    const { proposal } = get()
    if (!proposal) return

    const side = proposal.orders[0]?.side ?? 'buy'
    const orders = recalculateOrders({
      strategyType: proposal.strategyType,
      priceRange: proposal.priceRange,
      splitCount: proposal.splitCount,
      totalAmount: amount,
      side,
    })

    set({
      proposal: {
        ...proposal,
        totalCapitalRequired: amount,
        orders,
      },
    })
  },

  reset: () => {
    set({
      proposal: null,
      validation: null,
      isGenerating: false,
      error: null,
    })
  },
}))
