import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExecutionRecord, StrategyStatus } from '@/lib/monitoring/types'

interface ExecutionHistoryState {
  records: ExecutionRecord[]
  addRecord: (record: ExecutionRecord) => void
  updateStatus: (id: string, status: StrategyStatus) => void
  getByWallet: (walletAddress: string) => ExecutionRecord[]
}

export const useExecutionHistoryStore = create<ExecutionHistoryState>()(
  persist(
    (set, get) => ({
      records: [],

      addRecord: (record) =>
        set((state) => ({
          records: [record, ...state.records].slice(0, 50),
        })),

      updateStatus: (id, status) =>
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id ? { ...r, status } : r
          ),
        })),

      getByWallet: (walletAddress) =>
        get().records.filter((r) => r.walletAddress === walletAddress),
    }),
    { name: 'axora-execution-history' }
  )
)
