import { create } from 'zustand'
import type { StrategyProposal } from '@/lib/ai/schemas'
import type { ValidationResult, MarketSnapshot } from '@/lib/strategy/types'
import { recalculateOrders } from '@/lib/strategy/calculator'
import { validateProposal } from '@/lib/strategy/validator'

interface StrategyState {
  proposal: StrategyProposal | null
  validation: ValidationResult | null
  marketSnapshot: MarketSnapshot | null
  /** Monotonically increasing ID to uniquely identify each proposal generation */
  proposalId: number
  isGenerating: boolean
  error: string | null

  setProposal: (proposal: StrategyProposal, validation: ValidationResult, market: MarketSnapshot) => void
  setGenerating: () => void
  setError: (msg: string) => void
  adjustSplitCount: (count: number) => void
  adjustPriceRange: (min: number, max: number) => void
  adjustTotalAmount: (amount: number) => void
  reset: () => void
}

/**
 * Re-validate proposal against stored market snapshot after parameter adjustment.
 */
function revalidate(proposal: StrategyProposal, market: MarketSnapshot | null): ValidationResult | null {
  if (!market) return null
  return validateProposal(proposal, market)
}

export const useStrategyStore = create<StrategyState>((set, get) => ({
  proposal: null,
  validation: null,
  marketSnapshot: null,
  proposalId: 0,
  isGenerating: false,
  error: null,

  setProposal: (proposal, validation, market) => {
    set((state) => ({
      proposal,
      validation,
      marketSnapshot: market,
      proposalId: state.proposalId + 1,
      isGenerating: false,
      error: null,
    }))
  },

  setGenerating: () => {
    set({ isGenerating: true, error: null })
  },

  setError: (msg) => {
    set({ error: msg, isGenerating: false })
  },

  adjustSplitCount: (count) => {
    const { proposal, marketSnapshot } = get()
    if (!proposal) return

    const side = proposal.orders[0]?.side ?? 'buy'
    const orders = recalculateOrders({
      strategyType: proposal.strategyType,
      priceRange: proposal.priceRange,
      splitCount: count,
      totalAmount: proposal.totalCapitalRequired,
      side,
    })

    const updated = { ...proposal, splitCount: count, orders }
    set({
      proposal: updated,
      validation: revalidate(updated, marketSnapshot),
    })
  },

  adjustPriceRange: (min, max) => {
    const { proposal, marketSnapshot } = get()
    if (!proposal) return

    const side = proposal.orders[0]?.side ?? 'buy'
    const orders = recalculateOrders({
      strategyType: proposal.strategyType,
      priceRange: { min, max },
      splitCount: proposal.splitCount,
      totalAmount: proposal.totalCapitalRequired,
      side,
    })

    const updated = { ...proposal, priceRange: { min, max }, orders }
    set({
      proposal: updated,
      validation: revalidate(updated, marketSnapshot),
    })
  },

  adjustTotalAmount: (amount) => {
    const { proposal, marketSnapshot } = get()
    if (!proposal) return

    const side = proposal.orders[0]?.side ?? 'buy'
    const orders = recalculateOrders({
      strategyType: proposal.strategyType,
      priceRange: proposal.priceRange,
      splitCount: proposal.splitCount,
      totalAmount: amount,
      side,
    })

    const updated = { ...proposal, totalCapitalRequired: amount, orders }
    set({
      proposal: updated,
      validation: revalidate(updated, marketSnapshot),
    })
  },

  reset: () => {
    set((state) => ({
      proposal: null,
      validation: null,
      marketSnapshot: null,
      proposalId: state.proposalId + 1,
      isGenerating: false,
      error: null,
    }))
  },
}))
