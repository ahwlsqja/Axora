'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import * as Slider from '@radix-ui/react-slider'
import { useStrategyStore } from '@/stores/strategyStore'

export function ParameterAdjuster() {
  const proposal = useStrategyStore((s) => s.proposal)
  const adjustSplitCount = useStrategyStore((s) => s.adjustSplitCount)
  const adjustPriceRange = useStrategyStore((s) => s.adjustPriceRange)
  const adjustTotalAmount = useStrategyStore((s) => s.adjustTotalAmount)

  // Local state for immediate UI feedback
  const [localSplits, setLocalSplits] = useState(proposal?.splitCount ?? 5)
  const [localPriceMin, setLocalPriceMin] = useState(
    proposal?.priceRange.min.toString() ?? ''
  )
  const [localPriceMax, setLocalPriceMax] = useState(
    proposal?.priceRange.max.toString() ?? ''
  )
  const [localAmount, setLocalAmount] = useState(
    proposal?.totalCapitalRequired.toString() ?? ''
  )

  // Sync local state when proposal changes from outside (e.g., new generation)
  useEffect(() => {
    if (proposal) {
      setLocalSplits(proposal.splitCount)
      setLocalPriceMin(proposal.priceRange.min.toString())
      setLocalPriceMax(proposal.priceRange.max.toString())
      setLocalAmount(proposal.totalCapitalRequired.toString())
    }
  }, [proposal?.splitCount, proposal?.priceRange.min, proposal?.priceRange.max, proposal?.totalCapitalRequired])

  const splitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const priceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const amountTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup all pending timers on unmount or proposal change (reset/new generation)
  useEffect(() => {
    return () => {
      if (splitTimer.current) clearTimeout(splitTimer.current)
      if (priceTimer.current) clearTimeout(priceTimer.current)
      if (amountTimer.current) clearTimeout(amountTimer.current)
    }
  }, [proposal?.marketId, proposal?.strategyType])

  const handleSplitChange = useCallback(
    (value: number) => {
      setLocalSplits(value)
      if (splitTimer.current) clearTimeout(splitTimer.current)
      const currentMarketId = proposal?.marketId
      splitTimer.current = setTimeout(() => {
        // Guard: only apply if proposal hasn't been replaced
        if (useStrategyStore.getState().proposal?.marketId === currentMarketId) {
          adjustSplitCount(value)
        }
      }, 300)
    },
    [adjustSplitCount, proposal?.marketId]
  )

  const handlePriceMinChange = useCallback(
    (raw: string) => {
      setLocalPriceMin(raw)
      const min = parseFloat(raw)
      if (!isNaN(min) && min > 0 && proposal) {
        if (priceTimer.current) clearTimeout(priceTimer.current)
        const currentMarketId = proposal.marketId
        const currentMax = proposal.priceRange.max
        priceTimer.current = setTimeout(() => {
          if (useStrategyStore.getState().proposal?.marketId === currentMarketId) {
            adjustPriceRange(min, currentMax)
          }
        }, 500)
      }
    },
    [adjustPriceRange, proposal?.marketId, proposal?.priceRange.max]
  )

  const handlePriceMaxChange = useCallback(
    (raw: string) => {
      setLocalPriceMax(raw)
      const max = parseFloat(raw)
      if (!isNaN(max) && max > 0 && proposal) {
        if (priceTimer.current) clearTimeout(priceTimer.current)
        const currentMarketId = proposal.marketId
        const currentMin = proposal.priceRange.min
        priceTimer.current = setTimeout(() => {
          if (useStrategyStore.getState().proposal?.marketId === currentMarketId) {
            adjustPriceRange(currentMin, max)
          }
        }, 500)
      }
    },
    [adjustPriceRange, proposal?.marketId, proposal?.priceRange.min]
  )

  const handleAmountChange = useCallback(
    (raw: string) => {
      setLocalAmount(raw)
      const val = parseFloat(raw)
      if (!isNaN(val) && val > 0) {
        if (amountTimer.current) clearTimeout(amountTimer.current)
        const currentMarketId = proposal?.marketId
        amountTimer.current = setTimeout(() => {
          if (useStrategyStore.getState().proposal?.marketId === currentMarketId) {
            adjustTotalAmount(val)
          }
        }, 500)
      }
    },
    [adjustTotalAmount, proposal?.marketId]
  )

  if (!proposal) return null

  return (
    <div className="space-y-5">
      <p className="text-sm font-semibold text-gray-700">
        파라미터 조정{' '}
        <span className="font-normal text-gray-400">Adjust Parameters</span>
      </p>

      {/* Split Count */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">분할 수 (Splits)</span>
          <span className="font-mono text-gray-800">{localSplits}</span>
        </div>
        <Slider.Root
          className="relative flex h-5 w-full touch-none select-none items-center"
          value={[localSplits]}
          min={1}
          max={20}
          step={1}
          onValueChange={([v]) => handleSplitChange(v)}
        >
          <Slider.Track className="relative h-1.5 w-full grow rounded-full bg-gray-200">
            <Slider.Range className="absolute h-full rounded-full bg-blue-500" />
          </Slider.Track>
          <Slider.Thumb className="block h-4 w-4 rounded-full border border-blue-400 bg-white shadow focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </Slider.Root>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <span className="text-sm text-gray-600">가격 범위 (Price Range)</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            value={localPriceMin}
            onChange={(e) => handlePriceMinChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-400">~</span>
          <input
            type="number"
            step="0.01"
            value={localPriceMax}
            onChange={(e) => handlePriceMaxChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Total Amount */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">총 자본 (Total Capital)</span>
          <span className="font-mono text-gray-800">
            {proposal.totalCapitalRequired.toLocaleString()} USDT
          </span>
        </div>
        <input
          type="number"
          step="1"
          min={1}
          value={localAmount}
          onChange={(e) => handleAmountChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
