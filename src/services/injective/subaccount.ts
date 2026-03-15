import {
  getEthereumAddress,
  IndexerGrpcAccountPortfolioApi,
} from '@injectivelabs/sdk-ts'
import { AGENT_SUBACCOUNT_NONCE } from '@/utils/constants'

/**
 * Generate the agent subaccount ID for a given Injective address.
 * Uses nonce 1 (NOT 0) -- nonce 0 shares balance with bank module since chain v1.10.0.
 *
 * Subaccount ID format: 0x{ethAddress}{24-char nonce suffix}
 * Example: 0xc6fe5d33615a1c52c08018c47e8bc53646a0e101 + 000000000000000000000001
 */
export function getAgentSubaccountId(injectiveAddress: string): string {
  const ethAddress = getEthereumAddress(injectiveAddress).toLowerCase()
  // Nonce suffix: 24 hex chars, nonce value right-padded
  const nonceSuffix = AGENT_SUBACCOUNT_NONCE.toString().padStart(24, '0')
  return `${ethAddress}${nonceSuffix}`
}

/** Single subaccount balance entry from the indexer portfolio */
export interface SubaccountBalanceEntry {
  subaccountId: string
  denom: string
  deposit: {
    totalBalance: string
    availableBalance: string
  }
}

/**
 * Fetch the portfolio (including subaccount balances) for an Injective address.
 * Uses IndexerGrpcAccountPortfolioApi (the non-deprecated API).
 */
export async function fetchSubaccountBalances(
  injectiveAddress: string
): Promise<SubaccountBalanceEntry[]> {
  const INDEXER_ENDPOINTS = [
    'https://testnet.sentry.exchange.grpc-web.injective.network',
    'https://k8s.testnet.exchange.grpc-web.injective.network',
  ]

  let lastError: Error | undefined
  for (const endpoint of INDEXER_ENDPOINTS) {
    try {
      const api = new IndexerGrpcAccountPortfolioApi(endpoint)
      const portfolio = await api.fetchAccountPortfolio(injectiveAddress)

      // Each entry in subaccountsList is { subaccountId, denom, deposit: { totalBalance, availableBalance } }
      return (portfolio.subaccountsList ?? []) as SubaccountBalanceEntry[]
    } catch (error) {
      lastError = error as Error
      console.warn(
        `[Subaccount] Indexer endpoint ${endpoint} failed: ${lastError.message}. Trying next...`
      )
    }
  }

  throw lastError ?? new Error('All indexer endpoints failed')
}
