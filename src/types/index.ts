/** Supported wallet types for connection */
export type WalletType = 'keplr' | 'metamask'

/** Wallet connection status */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

/** Onboarding flow steps */
export type OnboardingStep = 'connect' | 'explain' | 'deposit'

/** Token balance representation */
export interface TokenBalance {
  denom: string
  symbol: string
  amount: string
  decimals: number
}
