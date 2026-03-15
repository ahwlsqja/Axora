'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useIntentStore } from '@/stores/intentStore'
import { PRESET_INTENTS } from '@/constants/intents'
import { useWallet } from '@/hooks/useWallet'
import { WalletModal } from '@/components/wallet/WalletModal'

export function IntentConfirmation() {
  const { source, selectedPresetId, freeText, clear } = useIntentStore()
  const { status } = useWallet()
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
    toast.info('전략 엔진 준비 중... (Phase 3)')
  }

  return (
    <>
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-sm font-medium text-blue-900">선택한 의도</p>
        <p className="mt-2 text-base text-blue-800">{displayText}</p>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={clear}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            다시 선택
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            계속하기
          </button>
        </div>
      </div>

      <WalletModal open={showWalletModal} onOpenChange={setShowWalletModal} />
    </>
  )
}
