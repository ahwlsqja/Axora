import { WalletStrategy } from '@injectivelabs/wallet-strategy'
import { MsgBroadcaster } from '@injectivelabs/wallet-core'
import { ChainId, EvmChainId } from '@injectivelabs/ts-types'
import { NETWORK } from '@/utils/constants'
import { getEndpoints } from './network'
import { Network } from '@injectivelabs/networks'

/**
 * Determine chain IDs based on current network.
 */
const chainId =
  NETWORK === Network.Mainnet ? ChainId.Mainnet : ChainId.Testnet
const evmChainId =
  NETWORK === Network.Mainnet ? EvmChainId.MainnetEvm : EvmChainId.TestnetEvm

/**
 * Lazy singleton instances.
 * Guarded with typeof window check to prevent SSR errors.
 */
let _walletStrategy: WalletStrategy | null = null
let _msgBroadcaster: MsgBroadcaster | null = null

/**
 * Get the WalletStrategy singleton.
 * Creates on first call (browser only).
 */
export function getWalletStrategy(): WalletStrategy {
  if (typeof window === 'undefined') {
    throw new Error('WalletStrategy can only be used in the browser')
  }

  if (!_walletStrategy) {
    const endpoints = getEndpoints()

    _walletStrategy = new WalletStrategy({
      chainId,
      strategies: {},
      evmOptions: {
        evmChainId,
        rpcUrl: endpoints.rpc,
      },
    })
  }

  return _walletStrategy
}

/**
 * Get the MsgBroadcaster singleton.
 * Creates on first call (browser only).
 */
export function getMsgBroadcaster(): MsgBroadcaster {
  if (typeof window === 'undefined') {
    throw new Error('MsgBroadcaster can only be used in the browser')
  }

  if (!_msgBroadcaster) {
    _msgBroadcaster = new MsgBroadcaster({
      walletStrategy: getWalletStrategy(),
      network: NETWORK,
      simulateTx: true,
    })
  }

  return _msgBroadcaster
}

/**
 * Convenience exports for direct import.
 * These are getters that lazily initialize.
 */
export const walletStrategy = new Proxy({} as WalletStrategy, {
  get(_, prop) {
    return (getWalletStrategy() as unknown as Record<string, unknown>)[
      prop as string
    ]
  },
})

export const msgBroadcaster = new Proxy({} as MsgBroadcaster, {
  get(_, prop) {
    return (getMsgBroadcaster() as unknown as Record<string, unknown>)[
      prop as string
    ]
  },
})
