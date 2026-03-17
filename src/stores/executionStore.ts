import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { ExecutionPhase } from '@/lib/execution/types'

interface ExecutionState {
  phase: ExecutionPhase
  txHash: string | null
  orderCids: string[]
  error: string | null
  proposalId: number | null
  marketId: string | null

  startConfirmation: (proposalId: number, marketId: string) => void
  startSigning: () => void
  startBroadcasting: () => void
  setSuccess: (txHash: string, orderCids: string[]) => void
  setError: (error: string) => void
  reset: () => void
}

export const useExecutionStore = create<ExecutionState>()(subscribeWithSelector((set) => ({
  phase: 'idle',
  txHash: null,
  orderCids: [],
  error: null,
  proposalId: null,
  marketId: null,

  startConfirmation: (proposalId, marketId) => {
    set({
      phase: 'confirming',
      proposalId,
      marketId,
      txHash: null,
      orderCids: [],
      error: null,
    })
  },

  startSigning: () => {
    set({ phase: 'signing' })
  },

  startBroadcasting: () => {
    set({ phase: 'broadcasting' })
  },

  setSuccess: (txHash, orderCids) => {
    set({ phase: 'success', txHash, orderCids })
  },

  setError: (error) => {
    set({ phase: 'error', error })
  },

  reset: () => {
    set({
      phase: 'idle',
      txHash: null,
      orderCids: [],
      error: null,
      proposalId: null,
      marketId: null,
    })
  },
})))
