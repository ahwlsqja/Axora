import { Network } from '@injectivelabs/networks'

/**
 * Agent subaccount nonce.
 * NOT 0 -- nonce 0 shares balance with bank module since chain v1.10.0.
 */
export const AGENT_SUBACCOUNT_NONCE = 1

/** Default AuthZ grant expiry: 7 days in seconds */
export const DEFAULT_AUTHZ_EXPIRY_SECONDS = 7 * 24 * 60 * 60

/** Balance polling interval: 10 seconds */
export const BALANCE_POLL_INTERVAL = 10_000

/**
 * Spot exchange message type URLs for AuthZ grants.
 * Each requires a separate MsgGrant.
 */
export const SPOT_MSG_TYPES = [
  '/injective.exchange.v1beta1.MsgCreateSpotLimitOrder',
  '/injective.exchange.v1beta1.MsgCreateSpotMarketOrder',
  '/injective.exchange.v1beta1.MsgCancelSpotOrder',
  '/injective.exchange.v1beta1.MsgBatchUpdateOrders',
] as const

/**
 * Display configuration for known token denominations.
 */
export const DISPLAY_DENOMS: Record<
  string,
  { symbol: string; decimals: number }
> = {
  inj: { symbol: 'INJ', decimals: 18 },
  peggy0xdAC17F958D2ee523a2206206994597C13D831ec7: {
    symbol: 'USDT',
    decimals: 6,
  },
}

/**
 * Current network derived from environment variable.
 * Defaults to testnet if not set.
 */
const networkEnv = process.env.NEXT_PUBLIC_NETWORK || 'testnet'

export const NETWORK: Network =
  networkEnv === 'mainnet' ? Network.Mainnet : Network.Testnet
