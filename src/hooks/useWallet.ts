'use client'

import { useEffect, useRef } from 'react'
import { useWalletStore } from '@/stores/walletStore'

/**
 * Thin wrapper around the wallet store.
 * Automatically attempts reconnection on mount (once).
 */
export function useWallet() {
  const { address, walletType, status, connect, disconnect, tryReconnect } =
    useWalletStore()

  const reconnectAttempted = useRef(false)

  useEffect(() => {
    // Guard against double-call in StrictMode
    if (reconnectAttempted.current) return
    reconnectAttempted.current = true
    tryReconnect()
  }, [tryReconnect])

  return { address, walletType, status, connect, disconnect }
}
