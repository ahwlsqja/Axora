import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { IntentSource } from '@/types'

interface IntentState {
  selectedPresetId: string | null
  freeText: string
  source: IntentSource | null

  selectPreset: (presetId: string) => void
  setFreeText: (text: string) => void
  submitFreeText: () => void
  clear: () => void
}

export const useIntentStore = create<IntentState>()(subscribeWithSelector((set, get) => ({
  selectedPresetId: null,
  freeText: '',
  source: null,

  selectPreset: (presetId: string) => {
    set({
      selectedPresetId: presetId,
      freeText: '',
      source: 'preset',
    })
  },

  setFreeText: (text: string) => {
    set({ freeText: text })
  },

  submitFreeText: () => {
    const { freeText } = get()
    if (freeText.trim()) {
      set({
        selectedPresetId: null,
        source: 'freetext',
      })
    }
  },

  clear: () => {
    set({
      selectedPresetId: null,
      freeText: '',
      source: null,
    })
  },
})))
