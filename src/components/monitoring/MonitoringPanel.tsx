'use client'

import { useState, useEffect } from 'react'
import { useExecutionHistory } from '@/hooks/useExecutionHistory'
import { StrategyList } from './StrategyList'
import { StrategyDetail } from './StrategyDetail'
import { PnLSummary } from './PnLSummary'
import { ExecutionHistory } from './ExecutionHistory'

/** Default decimals for INJ/USDT (only supported market in MVP) */
const BASE_DECIMALS = 18
const QUOTE_DECIMALS = 6

export function MonitoringPanel() {
  const { records } = useExecutionHistory()
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)

  // Auto-select first record when records exist but none selected
  useEffect(() => {
    if (records.length > 0 && !selectedRecordId) {
      setSelectedRecordId(records[0].id)
    }
    // Clear selection if selected record was removed
    if (selectedRecordId && !records.find((r) => r.id === selectedRecordId)) {
      setSelectedRecordId(records.length > 0 ? records[0].id : null)
    }
  }, [records, selectedRecordId])

  const selectedRecord = records.find((r) => r.id === selectedRecordId) ?? null

  // Filter active strategies: non-terminal or last 5 if all terminal
  const activeRecords = records.filter(
    (r) => r.status !== 'complete' && r.status !== 'cancelled' && r.status !== 'failed'
  )
  const displayRecords =
    activeRecords.length > 0 ? activeRecords : records.slice(0, 5)

  if (records.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-200">Strategy Monitor</h3>
        <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-8 text-center">
          <p className="text-sm text-zinc-400">
            No strategies executed yet. Create a strategy to get started.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-zinc-200">Strategy Monitor</h3>

      {/* Active / Recent Strategies */}
      <StrategyList
        records={displayRecords}
        selectedId={selectedRecordId}
        onSelect={setSelectedRecordId}
      />

      {/* Selected Strategy Detail + P&L */}
      {selectedRecord && (
        <div className="space-y-4">
          <StrategyDetail
            record={selectedRecord}
            baseDecimals={BASE_DECIMALS}
            quoteDecimals={QUOTE_DECIMALS}
          />
          <PnLSummary
            record={selectedRecord}
            baseDecimals={BASE_DECIMALS}
            quoteDecimals={QUOTE_DECIMALS}
          />
        </div>
      )}

      {/* Full Execution History */}
      <ExecutionHistory
        records={records}
        selectedId={selectedRecordId}
        onSelect={setSelectedRecordId}
      />
    </div>
  )
}
