'use client'

import { useRef, useCallback } from 'react'
import * as Slider from '@radix-ui/react-slider'
import { useStrategyStore } from '@/stores/strategyStore'

export function ParameterAdjuster() {
  const proposal = useStrategyStore((s) => s.proposal)
  const adjustSplitCount = useStrategyStore((s) => s.adjustSplitCount)
  const adjustPriceRange = useStrategyStore((s) => s.adjustPriceRange)
  const adjustTotalAmount = useStrategyStore((s) => s.adjustTotalAmount)

  const splitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const priceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const amountTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedSplit = useCallback(
    (value: number) => {
      if (splitTimer.current) clearTimeout(splitTimer.current)
      splitTimer.current = setTimeout(() => adjustSplitCount(value), 300)
    },
    [adjustSplitCount]
  )

  const debouncedPriceRange = useCallback(
    (min: number, max: number) => {
      if (priceTimer.current) clearTimeout(priceTimer.current)
      priceTimer.current = setTimeout(() => adjustPriceRange(min, max), 300)
    },
    [adjustPriceRange]
  )

  const debouncedAmount = useCallback(
    (value: number) => {
      if (amountTimer.current) clearTimeout(amountTimer.current)
      amountTimer.current = setTimeout(() => adjustTotalAmount(value), 300)
    },
    [adjustTotalAmount]
  )

  if (!proposal) return null

  return (
    <div className="space-y-5">
      <p className="text-sm font-semibold text-gray-700">
        파라미터 조정 <span className="font-normal text-gray-400">Adjust Parameters</span>
      </p>

      {/* Split Count */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">분할 수 (Splits)</span>
          <span className="font-mono text-gray-800">{proposal.splitCount}</span>
        </div>
        <Slider.Root
          className="relative flex h-5 w-full touch-none select-none items-center"
          value={[proposal.splitCount]}
          min={1}
          max={20}
          step={1}
          onValueChange={([v]) => debouncedSplit(v)}
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
            value={proposal.priceRange.min}
            onChange={(e) => {
              const min = parseFloat(e.target.value)
              if (!isNaN(min) && min > 0) {
                debouncedPriceRange(min, proposal.priceRange.max)
              }
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-400">~</span>
          <input
            type="number"
            step="0.01"
            value={proposal.priceRange.max}
            onChange={(e) => {
              const max = parseFloat(e.target.value)
              if (!isNaN(max) && max > 0) {
                debouncedPriceRange(proposal.priceRange.min, max)
              }
            }}
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
          value={proposal.totalCapitalRequired}
          onChange={(e) => {
            const val = parseFloat(e.target.value)
            if (!isNaN(val) && val > 0) {
              debouncedAmount(val)
            }
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}
