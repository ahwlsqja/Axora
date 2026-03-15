import { create } from 'zustand'
import { Wallet } from '@injectivelabs/wallet-base'
import { toast } from 'sonner'
import type { ConnectionStatus } from '@/types'
import {
  connectWallet,
  disconnectWallet,
  getSavedWalletType,
} from '@/services/injective/wallet'

interface WalletState {
  address: string | null
  walletType: Wallet | null
  status: ConnectionStatus

  connect: (walletType: Wallet) => Promise<void>
  disconnect: () => void
  tryReconnect: () => Promise<void>
}

export const useWalletStore = create<WalletState>((set, get) => ({
  address: null,
  walletType: null,
  status: 'disconnected',

  connect: async (walletType: Wallet) => {
    set({ status: 'connecting' })

    try {
      const address = await connectWallet(walletType)
      set({ address, walletType, status: 'connected' })
    } catch (error) {
      set({ status: 'disconnected' })
      const message =
        error instanceof Error ? error.message : 'Failed to connect wallet'
      toast.error(message)
    }
  },

  disconnect: () => {
    disconnectWallet()
    set({ address: null, walletType: null, status: 'disconnected' })
  },

  tryReconnect: async () => {
    const savedWallet = getSavedWalletType()
    if (!savedWallet) return

    // Only attempt reconnect if currently disconnected
    if (get().status !== 'disconnected') return

    set({ status: 'connecting' })

    try {
      const address = await connectWallet(savedWallet)
      set({ address, walletType: savedWallet, status: 'connected' })
    } catch {
      // Silent failure on auto-reconnect -- just reset state
      set({ address: null, walletType: null, status: 'disconnected' })
      // Clear saved state since reconnect failed
      try {
        localStorage.removeItem('injective-agent-wallet')
      } catch {
        // ignore
      }
    }
  },
}))
