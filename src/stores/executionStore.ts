import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { ExecutionPhase, ExecutionAction } from '@/lib/execution/types'

interface ExecutionState {
  phase: ExecutionPhase
  actionType: ExecutionAction
  txHash: string | null
  orderCids: string[]
  error: string | null
  warnings: string[]
  proposalId: number | null
  marketId: string | null

  startConfirmation: (proposalId: number, marketId: string) => void
  startCancellation: (marketId: string) => void
  startSigning: () => void
  startBroadcasting: () => void
  setSuccess: (txHash: string, orderCids: string[]) => void
  setError: (error: string) => void
  setWarnings: (warnings: string[]) => void
  reset: () => void
}

export const useExecutionStore = create<ExecutionState>()(subscribeWithSelector((set) => ({
  phase: 'idle',
  actionType: 'execute',
  txHash: null,
  orderCids: [],
  error: null,
  warnings: [],
  proposalId: null,
  marketId: null,

  startConfirmation: (proposalId, marketId) => {
    set({
      phase: 'confirming',
      actionType: 'execute',
      proposalId,
      marketId,
      txHash: null,
      orderCids: [],
      error: null,
    })
  },

  startCancellation: (marketId) => {
    set({
      phase: 'signing',
      actionType: 'cancel',
      marketId,
      txHash: null,
      orderCids: [],
      error: null,
      proposalId: null,
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

  setWarnings: (warnings) => {
    set({ warnings })
  },

  reset: () => {
    set({
      phase: 'idle',
      actionType: 'execute',
      txHash: null,
      orderCids: [],
      error: null,
      warnings: [],
      proposalId: null,
      marketId: null,
    })
  },
})))
