import { getNetworkEndpoints } from '@injectivelabs/networks'
import { NETWORK } from '@/utils/constants'

/**
 * Fallback gRPC-web endpoints for testnet.
 * If the primary endpoint fails, we try alternates.
 */
const FALLBACK_GRPC_ENDPOINTS = [
  getNetworkEndpoints(NETWORK).grpc,
  'https://testnet.sentry.chain.grpc-web.injective.network',
  'https://k8s.testnet.chain.grpc-web.injective.network',
]

/**
 * Get network endpoints for the current network configuration.
 */
export function getEndpoints() {
  return getNetworkEndpoints(NETWORK)
}

/**
 * Execute a function with endpoint fallback.
 * Tries each endpoint sequentially until one succeeds.
 * Throws the last error if all endpoints fail.
 */
export async function withFallback<T>(
  fn: (endpoint: string) => Promise<T>
): Promise<T> {
  let lastError: Error | undefined

  for (const endpoint of FALLBACK_GRPC_ENDPOINTS) {
    try {
      return await fn(endpoint)
    } catch (error) {
      lastError = error as Error
      console.warn(
        `[Network] Endpoint ${endpoint} failed: ${lastError.message}. Trying next...`
      )
    }
  }

  throw lastError ?? new Error('All endpoints failed')
}
