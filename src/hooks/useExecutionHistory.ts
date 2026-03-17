'use client'

import { useMemo } from 'react'
import { useWalletStore } from '@/stores/walletStore'
import { useExecutionHistoryStore } from '@/stores/executionHistoryStore'

/**
 * Hook wrapping executionHistoryStore with wallet-scoped filtering.
 * Only returns records matching the currently connected wallet address.
 */
export function useExecutionHistory() {
  const address = useWalletStore((s) => s.address)
  const records = useExecutionHistoryStore((s) => s.records)
  const addRecord = useExecutionHistoryStore((s) => s.addRecord)

  const walletRecords = useMemo(
    () => records.filter((r) => r.walletAddress === address),
    [records, address]
  )

  return { records: walletRecords, addRecord }
}
