'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useIntentStore } from '@/stores/intentStore'
import { useStrategyStore } from '@/stores/strategyStore'
import { PRESET_INTENTS } from '@/constants/intents'
import { useWallet } from '@/hooks/useWallet'
import { useStrategy } from '@/hooks/useStrategy'
import { useSupportedMarkets } from '@/hooks/useMarketData'
import { WalletModal } from '@/components/wallet/WalletModal'
import { ProposalCard } from '@/components/strategy/ProposalCard'

export function IntentConfirmation() {
  const { source, selectedPresetId, freeText, clear } = useIntentStore()
  const proposal = useStrategyStore((s) => s.proposal)
  const strategyReset = useStrategyStore((s) => s.reset)
  const { status } = useWallet()
  const { generate, isGenerating } = useStrategy()
  const { data: supportedMarkets, isLoading: marketsLoading, error: marketsError } = useSupportedMarkets()
  const [showWalletModal, setShowWalletModal] = useState(false)

  if (source === null) return null

  const isConnected = status === 'connected'

  const preset =
    source === 'preset'
      ? PRESET_INTENTS.find((p) => p.id === selectedPresetId)
      : null

  const displayText =
    source === 'preset' && preset
      ? preset.titleKo
      : `"${freeText}"`

  const handleContinue = () => {
    if (!isConnected) {
      setShowWalletModal(true)
      return
    }

    if (!supportedMarkets || Object.keys(supportedMarkets).length === 0) {
      toast.error('마켓 데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    // Use first supported market (INJ/USDT for MVP)
    const marketEntries = Object.entries(supportedMarkets)

    const [, marketId] = marketEntries[0]

    generate({
      presetId: selectedPresetId,
      freeText,
      source: source!,
      marketId,
    })
  }

  const handleReset = () => {
    clear()
    strategyReset()
  }

  return (
    <>
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-sm font-medium text-blue-900">선택한 의도</p>
        <p className="mt-2 text-base text-blue-800">{displayText}</p>

        {marketsError && (
          <p className="mt-2 text-xs text-red-600">
            마켓 데이터 로드 실패 (Failed to load market data)
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            다시 선택
          </button>
          {!proposal && (
            <button
              type="button"
              onClick={handleContinue}
              disabled={isGenerating || marketsLoading || !!marketsError}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  생성 중...
                </>
              ) : marketsLoading ? (
                '마켓 로딩...'
              ) : (
                '계속하기'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Strategy Proposal */}
      {(proposal || isGenerating) && (
        <div className="mt-4">
          <ProposalCard />
        </div>
      )}

      <WalletModal open={showWalletModal} onOpenChange={setShowWalletModal} />
    </>
  )
}
