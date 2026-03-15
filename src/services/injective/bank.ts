import { ChainGrpcBankApi } from '@injectivelabs/sdk-ts'
import { withFallback } from './network'

/**
 * Fetch all token balances for an Injective address.
 * Uses network fallback to try multiple endpoints.
 */
export async function fetchBalances(injectiveAddress: string) {
  return withFallback(async (endpoint) => {
    const bankApi = new ChainGrpcBankApi(endpoint)
    const response = await bankApi.fetchBalances(injectiveAddress)
    return response.balances
  })
}

/**
 * Fetch a single token balance for an Injective address.
 * Uses network fallback to try multiple endpoints.
 */
export async function fetchBalance(
  injectiveAddress: string,
  denom: string
) {
  return withFallback(async (endpoint) => {
    const bankApi = new ChainGrpcBankApi(endpoint)
    return bankApi.fetchBalance({ accountAddress: injectiveAddress, denom })
  })
}
