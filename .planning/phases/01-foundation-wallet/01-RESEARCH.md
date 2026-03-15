# Phase 1: Foundation & Subaccount Onboarding - Research

**Researched:** 2026-03-15
**Domain:** Injective wallet integration, subaccount management, AuthZ grants, Next.js dApp
**Confidence:** MEDIUM-HIGH

## Summary

Phase 1 requires building a Next.js browser dApp that connects Keplr and MetaMask wallets to the Injective blockchain (testnet-first), creates agent subaccounts, deposits funds, and sets up AuthZ grants -- all in a streamlined 3-step onboarding flow. The Injective TypeScript SDK (`@injectivelabs/sdk-ts` v1.18.x) provides all necessary primitives: `WalletStrategy` for unified wallet abstraction, `MsgBroadcaster` for browser-based transaction signing/broadcasting, `MsgDeposit` for subaccount funding, and `MsgGrant` for AuthZ authorization. Multiple messages can be batched into a single transaction, enabling the "single signature" onboarding requirement.

The critical architectural insight is that Injective subaccounts are not explicitly "created" -- they exist implicitly once you deposit into a subaccount ID derived from the user's Ethereum address + a nonce suffix. The default subaccount (nonce 0) shares balance with the bank module since chain v1.10.0, so the agent subaccount should use nonce 1 or higher. AuthZ grants use `GenericAuthorization` with specific message types (e.g., `MsgCreateSpotLimitOrder`), and expiry can be set in seconds via the `expiryInSeconds` parameter.

**Primary recommendation:** Use `@injectivelabs/wallet-strategy` (not deprecated `wallet-ts`) with `MsgBroadcaster` for all browser wallet interactions. Batch `MsgDeposit` + multiple `MsgGrant` messages into a single transaction for the onboarding signature.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Next.js** frontend framework
- **Microservice** architecture with individual Git repos (Web, API, AI Engine)
- **TypeScript (Node.js)** backend, unified with frontend language
- **Header right-side** wallet connect button, **modal** for wallet selection
- **Compressed address + INJ balance** shown in header after connection
- **Installation page link** when wallet not installed
- **Testnet-first** connection (MVP)
- **Auto-switch** when wallet changes network -- app follows wallet's network
- **3-step onboarding**: wallet connect -> agent account explanation -> amount setup + approval
- **Single transaction (or minimum signatures)** for Subaccount creation + Deposit + AuthZ Grant
- **Recommended amount** with adjustable slider
- **Spot markets full** AuthZ scope
- **Within deposited amount only** execution limit
- **7-day expiry** default for AuthZ grants
- **Dynamic RPC fallback** with multiple endpoints
- **Network auto-detection** from wallet (no UI toggle)
- **Dashboard cards** for balance display
- **INJ + major tokens** (USDT, ATOM etc.) display, **token quantity only** (no USD conversion)
- **Auto-polling** for balance refresh
- **"Connect wallet" prompt** when disconnected

### Claude's Discretion
- Session persistence (auto-reconnect etc.)
- Error display method (toast/modal etc.)
- Chain connection status indicator level
- Non-Injective network connection handling
- Onboarding step-by-step detailed UI composition

### Deferred Ideas (OUT OF SCOPE)
- Agent layer role separation (Phase 4/7)
- Go microservice data layer (Phase 3/4)
- AI Hallucination prevention (Phase 3)
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@injectivelabs/sdk-ts` | ^1.18.3 | Core SDK: messages, queries, utilities | Official Injective TS SDK, actively maintained |
| `@injectivelabs/wallet-strategy` | ^1.15.5 | Unified wallet abstraction (Keplr, MetaMask) | Replaces deprecated `wallet-ts`, official recommendation |
| `@injectivelabs/wallet-core` | ^1.17.6 | Core wallet types and functionality | Required base for all wallet packages |
| `@injectivelabs/wallet-cosmos` | latest | Keplr wallet implementation | Cosmos-native wallet support |
| `@injectivelabs/wallet-evm` | latest | MetaMask wallet implementation | EVM-native wallet support |
| `@injectivelabs/networks` | latest | Network endpoints and configuration | Pre-defined testnet/mainnet endpoints |
| `@injectivelabs/ts-types` | latest | Shared TypeScript types (ChainId, EvmChainId) | Type safety across Injective packages |
| `@injectivelabs/utils` | latest | Utilities (BigNumberInBase, toChainFormat) | Number formatting for chain interactions |
| `next` | ^14.x or ^15.x | Frontend framework | User decision (locked) |
| `react` | ^18.x or ^19.x | UI library | Paired with Next.js |
| `typescript` | ^5.x | Language | User decision (locked) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zustand` | ^4.x | Client-side state management | Wallet state, connection status, balances |
| `@tanstack/react-query` | ^5.x | Server state / async data | Balance polling, chain queries with caching |
| `tailwindcss` | ^3.x or ^4.x | Utility-first CSS | All UI styling |
| `sonner` | ^1.x | Toast notifications | Error/success feedback (Claude's discretion: recommend toasts) |
| `@radix-ui/react-dialog` | latest | Accessible modal primitive | Wallet selection modal |
| `@radix-ui/react-slider` | latest | Accessible slider primitive | Deposit amount slider |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `zustand` | `jotai` or React Context | Zustand is simpler for cross-component wallet state, no provider nesting |
| `@tanstack/react-query` | SWR | React Query has better mutation support for tx broadcasting |
| `sonner` | `react-hot-toast` | Sonner has better Next.js App Router compatibility |
| Radix UI | shadcn/ui | shadcn/ui is built on Radix; use shadcn/ui for full component library if desired |

**Installation:**
```bash
# Core Injective packages
npm install @injectivelabs/sdk-ts @injectivelabs/wallet-strategy @injectivelabs/wallet-core @injectivelabs/wallet-cosmos @injectivelabs/wallet-evm @injectivelabs/networks @injectivelabs/ts-types @injectivelabs/utils @injectivelabs/exceptions

# UI and state
npm install zustand @tanstack/react-query sonner @radix-ui/react-dialog @radix-ui/react-slider

# Dev
npm install -D tailwindcss typescript @types/react @types/node
```

## Architecture Patterns

### Recommended Project Structure (Web repo)
```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main dashboard
│   └── onboarding/
│       └── page.tsx        # Onboarding flow
├── components/
│   ├── layout/
│   │   └── Header.tsx      # Header with wallet button + balance
│   ├── wallet/
│   │   ├── ConnectButton.tsx    # Wallet connect trigger
│   │   ├── WalletModal.tsx      # Wallet selection modal
│   │   └── WalletInfo.tsx       # Connected state display
│   ├── onboarding/
│   │   ├── OnboardingStepper.tsx  # 3-step flow controller
│   │   ├── StepConnect.tsx        # Step 1: wallet connect
│   │   ├── StepExplain.tsx        # Step 2: agent account info
│   │   └── StepDeposit.tsx        # Step 3: amount + approve
│   └── dashboard/
│       └── BalanceCard.tsx        # Token balance cards
├── services/
│   ├── injective/
│   │   ├── client.ts        # WalletStrategy + MsgBroadcaster setup
│   │   ├── network.ts       # Network config with fallback
│   │   ├── wallet.ts        # Wallet connection logic
│   │   ├── subaccount.ts    # Subaccount ID generation, deposit
│   │   ├── authz.ts         # AuthZ grant creation
│   │   └── bank.ts          # Balance queries
│   └── index.ts
├── stores/
│   ├── walletStore.ts       # Zustand: wallet state
│   └── onboardingStore.ts   # Zustand: onboarding step state
├── hooks/
│   ├── useWallet.ts         # Wallet connection hook
│   ├── useBalances.ts       # Balance polling hook
│   └── useOnboarding.ts     # Onboarding flow hook
├── types/
│   └── index.ts             # App-specific types
└── utils/
    ├── address.ts           # Address formatting
    └── constants.ts         # Chain IDs, denoms, defaults
```

### Pattern 1: WalletStrategy Singleton
**What:** Single WalletStrategy instance shared across the app, initialized once.
**When to use:** Always -- WalletStrategy manages wallet state internally.
**Example:**
```typescript
// src/services/injective/client.ts
import { WalletStrategy } from '@injectivelabs/wallet-strategy'
import { MsgBroadcaster } from '@injectivelabs/sdk-ts'
import { ChainId, EvmChainId } from '@injectivelabs/ts-types'
import { Network, getNetworkEndpoints } from '@injectivelabs/networks'

const NETWORK = Network.Testnet
const ENDPOINTS = getNetworkEndpoints(NETWORK)

export const walletStrategy = new WalletStrategy({
  chainId: ChainId.Testnet,    // 'injective-888'
  evmOptions: {
    evmChainId: EvmChainId.TestnetEvm,
    rpcUrl: 'https://testnet.rpc.injective.network'
  }
})

export const msgBroadcaster = new MsgBroadcaster({
  walletStrategy,
  network: NETWORK,
  simulateTx: true,  // auto-calculate gas
})
```

### Pattern 2: Subaccount ID Generation
**What:** Deterministic subaccount IDs from user address + nonce.
**When to use:** Creating agent subaccounts (nonce >= 1).
**Example:**
```typescript
// src/services/injective/subaccount.ts
import { getEthereumAddress } from '@injectivelabs/sdk-ts'

/**
 * Generate a subaccount ID for the agent.
 * Default subaccount (nonce 0) shares balance with bank module since v1.10.0.
 * Agent subaccount uses nonce 1.
 */
export function getAgentSubaccountId(injectiveAddress: string): string {
  const ethAddress = getEthereumAddress(injectiveAddress).toLowerCase()
  const subaccountIndex = 1  // Agent subaccount
  const suffix = '0'.repeat(23) + subaccountIndex
  return ethAddress + suffix
}

// Format: 0x{40-char eth address}{24-char nonce}
// Example: 0xc7dca7c15c364865f77a4fb67ab11dc95502e6fe000000000000000000000001
```

### Pattern 3: Batched Onboarding Transaction
**What:** Combine MsgDeposit + multiple MsgGrant into a single transaction.
**When to use:** Onboarding step 3 -- single signature for deposit + grants.
**Example:**
```typescript
// src/services/injective/onboarding.ts
import { MsgDeposit, MsgGrant } from '@injectivelabs/sdk-ts'
import { toChainFormat } from '@injectivelabs/utils'
import { msgBroadcaster } from './client'
import { getAgentSubaccountId } from './subaccount'

const SPOT_MSG_TYPES = [
  '/injective.exchange.v1beta1.MsgCreateSpotLimitOrder',
  '/injective.exchange.v1beta1.MsgCreateSpotMarketOrder',
  '/injective.exchange.v1beta1.MsgCancelSpotOrder',
  '/injective.exchange.v1beta1.MsgBatchUpdateOrders',
]

const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60

export async function executeOnboarding(
  injectiveAddress: string,
  depositAmountInj: number
) {
  const subaccountId = getAgentSubaccountId(injectiveAddress)
  const granteeAddress = injectiveAddress // or agent's address

  // 1. Deposit message
  const depositMsg = MsgDeposit.fromJSON({
    amount: {
      denom: 'inj',
      amount: toChainFormat(depositAmountInj).toFixed(),
    },
    subaccountId,
    injectiveAddress,
  })

  // 2. AuthZ grant messages for each spot message type
  const grantMsgs = SPOT_MSG_TYPES.map((messageType) =>
    MsgGrant.fromJSON({
      messageType,
      grantee: granteeAddress,
      granter: injectiveAddress,
      expiryInSeconds: SEVEN_DAYS_IN_SECONDS,
    })
  )

  // 3. Broadcast all messages in a single transaction
  const txHash = await msgBroadcaster.broadcast({
    msgs: [depositMsg, ...grantMsgs],
    injectiveAddress,
  })

  return txHash
}
```

### Pattern 4: Balance Polling with React Query
**What:** Auto-refresh balances using React Query's refetchInterval.
**When to use:** Dashboard balance cards, header balance display.
**Example:**
```typescript
// src/hooks/useBalances.ts
import { useQuery } from '@tanstack/react-query'
import { ChainGrpcBankApi } from '@injectivelabs/sdk-ts'
import { getNetworkEndpoints, Network } from '@injectivelabs/networks'

const ENDPOINTS = getNetworkEndpoints(Network.Testnet)
const bankApi = new ChainGrpcBankApi(ENDPOINTS.grpc)

export function useBalances(injectiveAddress: string | undefined) {
  return useQuery({
    queryKey: ['balances', injectiveAddress],
    queryFn: () => bankApi.fetchBalances(injectiveAddress!),
    enabled: !!injectiveAddress,
    refetchInterval: 10_000, // 10 second polling
    staleTime: 5_000,
  })
}
```

### Pattern 5: Network Fallback
**What:** Try multiple RPC endpoints, auto-switch on failure.
**When to use:** All chain queries and broadcasts.
**Example:**
```typescript
// src/services/injective/network.ts
import { getNetworkEndpoints, Network } from '@injectivelabs/networks'

const FALLBACK_GRPC_ENDPOINTS = [
  getNetworkEndpoints(Network.Testnet).grpc,
  'https://testnet.sentry.chain.grpc-web.injective.network',
  // Add more fallback endpoints
]

export async function withFallback<T>(
  fn: (endpoint: string) => Promise<T>
): Promise<T> {
  let lastError: Error | undefined
  for (const endpoint of FALLBACK_GRPC_ENDPOINTS) {
    try {
      return await fn(endpoint)
    } catch (error) {
      lastError = error as Error
      console.warn(`Endpoint ${endpoint} failed, trying next...`)
    }
  }
  throw lastError
}
```

### Anti-Patterns to Avoid
- **Using default subaccount (nonce 0) for agent:** Default subaccount shares balance with bank module since v1.10.0. Use nonce >= 1.
- **Using `@injectivelabs/wallet-ts`:** This package is deprecated. Use `@injectivelabs/wallet-strategy` instead.
- **Using `MsgBroadcasterWithPk` in browser:** This is for backend/private-key scenarios. Browser dApps must use `MsgBroadcaster` with `WalletStrategy`.
- **Single MsgGrant for all spot operations:** AuthZ requires separate grants per message type. You must create one MsgGrant per Msg type you want to authorize.
- **Storing private keys client-side:** Never. All signing happens through the wallet extension via WalletStrategy.
- **Hardcoding a single RPC endpoint:** Endpoints go down. Always implement fallback logic.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Wallet connection | Custom window.ethereum/keplr integration | `@injectivelabs/wallet-strategy` | Handles address format conversion, signing differences, wallet switching |
| Transaction broadcasting | Manual tx construction, gas estimation, signing | `MsgBroadcaster` | Handles gas simulation, EIP-712 for MetaMask, Cosmos signing for Keplr |
| Address conversion | Manual bech32/hex conversion | `getInjectiveAddress()`, `getEthereumAddress()` from sdk-ts | Edge cases in checksum, prefix handling |
| Network endpoints | Hardcoded URLs | `getNetworkEndpoints()` from `@injectivelabs/networks` | Pre-configured, tested, updated with SDK releases |
| Number formatting | Manual BigNumber math for chain amounts | `toChainFormat()`, `BigNumberInBase` from `@injectivelabs/utils` | Handles 18-decimal precision, prevents rounding errors |
| Subaccount ID calculation | String concatenation without padding | Utility function with proper 24-char nonce padding | Off-by-one in padding breaks subaccount resolution |

**Key insight:** The Injective SDK handles many blockchain-specific edge cases (EIP-712 typed data construction, Cosmos amino/direct signing differences, gas estimation). Rolling custom solutions will miss edge cases that cause silent failures.

## Common Pitfalls

### Pitfall 1: MetaMask Returns Ethereum Addresses, Keplr Returns Injective Addresses
**What goes wrong:** Different wallet types return addresses in different formats. Using the wrong format causes transaction failures.
**Why it happens:** MetaMask is an EVM wallet (hex addresses), Keplr is a Cosmos wallet (bech32 addresses).
**How to avoid:** Always convert using `getInjectiveAddress(ethAddress)` for MetaMask addresses. WalletStrategy handles this internally but you need awareness when storing/displaying.
**Warning signs:** "Invalid address" errors on transaction broadcast.

### Pitfall 2: Default Subaccount (Nonce 0) is the Bank Balance
**What goes wrong:** Depositing to default subaccount appears to have no effect since v1.10.0.
**Why it happens:** Chain upgrade merged default subaccount with bank module balance.
**How to avoid:** Use nonce >= 1 for agent subaccounts. Document this clearly in code.
**Warning signs:** Balance queries show same amount in bank and subaccount.

### Pitfall 3: AuthZ Grants Are Per-Message-Type
**What goes wrong:** Granting authorization for `MsgCreateSpotLimitOrder` does NOT automatically grant `MsgCreateSpotMarketOrder` or `MsgCancelSpotOrder`.
**Why it happens:** Cosmos AuthZ module design -- each message type needs explicit authorization.
**How to avoid:** Create separate MsgGrant for each message type. Batch them in a single transaction.
**Warning signs:** "unauthorized" errors when trying to execute specific order types.

### Pitfall 4: BigNumber Precision for Chain Amounts
**What goes wrong:** Sending "1 INJ" as "1" instead of "1000000000000000000" (18 decimals).
**Why it happens:** Chain expects amounts in base denomination (wei equivalent).
**How to avoid:** Always use `toChainFormat()` or `BigNumberInBase(amount).toWei()` for conversion.
**Warning signs:** Transactions succeed but with dust amounts, or "insufficient funds" for large-seeming amounts.

### Pitfall 5: Window Object Access in Next.js SSR
**What goes wrong:** `window.ethereum` or `window.keplr` accessed during server-side rendering causes errors.
**Why it happens:** Next.js renders on server where `window` doesn't exist.
**How to avoid:** Guard all wallet access with `typeof window !== 'undefined'` checks. Use `'use client'` directive. Initialize WalletStrategy only in browser context.
**Warning signs:** "window is not defined" errors during build or hydration.

### Pitfall 6: Wallet Extension Detection Timing
**What goes wrong:** Checking for wallet extension before it's injected into the page.
**Why it happens:** Browser extensions inject globals (`window.ethereum`, `window.keplr`) asynchronously.
**How to avoid:** Wait for `DOMContentLoaded` or use a small delay/retry. Check on user interaction (button click), not page load.
**Warning signs:** Wallet reported as "not installed" even when installed.

### Pitfall 7: MsgGrant Expiry Default is 5 Years
**What goes wrong:** Not setting expiry results in a 5-year grant, not the intended 7-day grant.
**Why it happens:** MsgGrant defaults to `expiryInYears: 5` if neither `expiration`, `expiryInYears`, nor `expiryInSeconds` is provided.
**How to avoid:** Always explicitly set `expiryInSeconds: 7 * 24 * 60 * 60` for 7-day grants.
**Warning signs:** Grants lasting much longer than intended.

## Code Examples

### Wallet Connection with WalletStrategy
```typescript
// Source: Injective TS SDK docs + injective-simple-sc-counter-ui
import { WalletStrategy } from '@injectivelabs/wallet-strategy'
import { MsgBroadcaster } from '@injectivelabs/sdk-ts'
import { ChainId, EvmChainId, Wallet } from '@injectivelabs/ts-types'
import { Network, getNetworkEndpoints } from '@injectivelabs/networks'
import { getInjectiveAddress } from '@injectivelabs/sdk-ts'

const NETWORK = Network.Testnet
const ENDPOINTS = getNetworkEndpoints(NETWORK)

// Initialize once
export const walletStrategy = new WalletStrategy({
  chainId: ChainId.Testnet,
  evmOptions: {
    evmChainId: EvmChainId.TestnetEvm,
    rpcUrl: ENDPOINTS.rpc || 'https://testnet.rpc.injective.network',
  },
})

export const msgBroadcaster = new MsgBroadcaster({
  walletStrategy,
  network: NETWORK,
  simulateTx: true,
})

// Connect wallet
export async function connectWallet(walletType: Wallet): Promise<string> {
  await walletStrategy.setWallet(walletType)
  const addresses = await walletStrategy.getAddresses()
  if (addresses.length === 0) {
    throw new Error('No addresses returned from wallet')
  }

  // MetaMask returns hex addresses, need conversion
  const address = walletType === Wallet.Metamask
    ? getInjectiveAddress(addresses[0])
    : addresses[0]

  return address
}

// Disconnect
export function disconnectWallet() {
  walletStrategy.disconnect()
}
```

### Querying Bank Balances
```typescript
// Source: Injective TS SDK docs
import { ChainGrpcBankApi } from '@injectivelabs/sdk-ts'
import { getNetworkEndpoints, Network } from '@injectivelabs/networks'

const ENDPOINTS = getNetworkEndpoints(Network.Testnet)
const bankApi = new ChainGrpcBankApi(ENDPOINTS.grpc)

// Fetch all balances
export async function fetchBalances(injectiveAddress: string) {
  const balances = await bankApi.fetchBalances(injectiveAddress)
  return balances
}

// Fetch single token balance
export async function fetchBalance(injectiveAddress: string, denom: string) {
  const balance = await bankApi.fetchBalance({
    accountAddress: injectiveAddress,
    denom
  })
  return balance
}
```

### Subaccount Balance Query
```typescript
// Source: Injective TS SDK docs
import { IndexerGrpcAccountApi } from '@injectivelabs/sdk-ts'
import { getNetworkEndpoints, Network } from '@injectivelabs/networks'

const ENDPOINTS = getNetworkEndpoints(Network.Testnet)
const accountApi = new IndexerGrpcAccountApi(ENDPOINTS.indexer)

// Fetch portfolio (replaces deprecated fetchSubaccountBalancesList)
export async function fetchPortfolio(injectiveAddress: string) {
  return await accountApi.fetchPortfolio(injectiveAddress)
}
```

### AuthZ Grant Revocation (for disconnect/cleanup)
```typescript
// Source: Injective AuthZ docs
import { MsgRevoke } from '@injectivelabs/sdk-ts'
import { msgBroadcaster } from './client'

const SPOT_MSG_TYPES = [
  '/injective.exchange.v1beta1.MsgCreateSpotLimitOrder',
  '/injective.exchange.v1beta1.MsgCreateSpotMarketOrder',
  '/injective.exchange.v1beta1.MsgCancelSpotOrder',
  '/injective.exchange.v1beta1.MsgBatchUpdateOrders',
]

export async function revokeAllGrants(
  injectiveAddress: string,
  granteeAddress: string
) {
  const revokeMsgs = SPOT_MSG_TYPES.map((messageType) =>
    MsgRevoke.fromJSON({
      messageType,
      grantee: granteeAddress,
      granter: injectiveAddress,
    })
  )

  return await msgBroadcaster.broadcast({
    msgs: revokeMsgs,
    injectiveAddress,
  })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@injectivelabs/wallet-ts` | `@injectivelabs/wallet-strategy` + `wallet-core` + `wallet-cosmos` + `wallet-evm` | 2024 | Modular wallet packages, `wallet-ts` deprecated |
| `ethereumOptions` in WalletStrategy | `evmOptions` in WalletStrategy | Recent | Property rename, old name may still work but use new |
| Separate bank + default subaccount balances | Merged bank + default subaccount (nonce 0) | Chain v1.10.0 | Agent subaccounts must use nonce >= 1 |
| `fetchSubaccountBalancesList` | `fetchPortfolio` | Recent | Old method deprecated, use portfolio API |
| `messageType` param in MsgGrant | `authorization` param (+ helper `getGenericAuthorizationFromMessageType`) | Recent | `messageType` still works but marked deprecated |

**Deprecated/outdated:**
- `@injectivelabs/wallet-ts`: Deprecated, use `@injectivelabs/wallet-strategy` instead
- `@injectivelabs/subaccount-consumer`: Old package, functionality absorbed into `sdk-ts`
- `@injectivelabs/sdk-ui-ts`: Legacy UI utilities
- `MsgGrant.fromJSON({ messageType })`: Deprecated in favor of `authorization` param, but still functional

## Discretion Recommendations

### Session Persistence
**Recommendation:** Store last connected wallet type in `localStorage`. On page load, attempt silent reconnect via `walletStrategy.setWallet(savedType)` + `getAddresses()`. If it fails (user revoked permission), clear state and show connect prompt. Do NOT auto-trigger wallet popup on load.

### Error Display
**Recommendation:** Use **toast notifications** (sonner) for:
- Transaction success/failure
- Wallet connection errors
- Network issues
Toast is less intrusive than modal and matches the "Toss-style simple UX" requirement. Reserve modals only for critical actions (wallet selection, onboarding steps).

### Chain Connection Status
**Recommendation:** Small colored dot indicator next to the wallet address in header:
- Green: connected and synced
- Yellow: connecting/switching
- Red: disconnected or wrong network
Minimal but informative.

### Non-Injective Network Handling
**Recommendation:** If wallet is on a non-Injective network, show a gentle prompt toast: "Please switch to Injective Testnet in your wallet." Do NOT auto-switch programmatically (can be disruptive). Disable transaction buttons until correct network is detected.

### Onboarding UI Composition
**Recommendation:** Full-page onboarding flow (not modal) with horizontal stepper indicator. Each step is a distinct view within the same page. Step 2 (explanation) should be concise: icon + 3 bullet points + "Continue" button. Step 3 combines amount input (slider + manual input) with a summary of what will happen, then a single "Approve & Start" button.

## Open Questions

1. **Agent address for AuthZ grantee**
   - What we know: AuthZ grants need a grantee address (the agent that will execute on behalf of the user)
   - What's unclear: In Phase 1, there is no separate "agent" service yet. Is the grantee the user's own address (self-grant for later use by the API service)? Or is there a pre-determined agent address?
   - Recommendation: For Phase 1, grant to a known API service address (configured as env var). If the API service doesn't exist yet, grant to the user's own address as a placeholder and update in Phase 2.

2. **MsgGrant `authorization` param migration**
   - What we know: `messageType` param is deprecated, `authorization` param is recommended
   - What's unclear: Exact usage of `getGenericAuthorizationFromMessageType` helper
   - Recommendation: Use `messageType` for now (still functional), plan migration when SDK docs stabilize. LOW risk.

3. **Subaccount nonce management**
   - What we know: Nonce >= 1 needed for agent subaccount, IDs are deterministic
   - What's unclear: If user re-onboards, should we reuse nonce 1 or create nonce 2? How to detect existing subaccounts?
   - Recommendation: Always use nonce 1 for the agent subaccount in MVP. Check existing balance at nonce 1 before deposit to handle re-onboarding gracefully.

4. **Wallet event listeners for network switching**
   - What we know: User decided app should follow wallet's network
   - What's unclear: Exact event API from WalletStrategy for network change detection
   - Recommendation: Listen to `window.ethereum` `chainChanged` event for MetaMask, re-initialize WalletStrategy on change. For Keplr, listen to `keplr_keystorechange` event.

## Sources

### Primary (HIGH confidence)
- [Injective TS SDK docs - Wallet Strategy](https://docs.injective.network/developers-native/wallets/strategy) - WalletStrategy API, configuration
- [Injective TS SDK docs - AuthZ](https://docs.injective.network/developers-native/examples/authz) - MsgGrant, MsgExec, MsgRevoke examples
- [Injective TS SDK docs - Exchange](https://docs.injective.network/developers-native/examples/exchange) - MsgDeposit, subaccount operations
- [Injective Trading Account docs](https://docs.injective.network/developers/concepts/trading-account) - Subaccount ID format, nonce system, v1.10.0 merge
- [injective-ts GitHub source - MsgGrant.ts](https://github.com/InjectiveLabs/injective-ts/tree/master/packages/sdk-ts) - MsgGrant params interface, expiry handling
- [injective-simple-sc-counter-ui](https://github.com/InjectiveLabs/injective-simple-sc-counter-ui) - Official Next.js reference implementation

### Secondary (MEDIUM confidence)
- [InjectiveLabs/injective-ts Wiki](https://github.com/InjectiveLabs/injective-ts/wiki/01WalletStrategy) - WalletStrategy wiki
- [npm: @injectivelabs/sdk-ts v1.18.3](https://www.npmjs.com/package/@injectivelabs/sdk-ts) - Latest version verification
- [npm: @injectivelabs/wallet-strategy v1.15.5](https://www.npmjs.com/package/@injectivelabs/wallet-strategy) - Package status, wallet-ts deprecation notice

### Tertiary (LOW confidence)
- MsgGrant `authorization` param migration path - based on source code reading, not official migration guide
- Exact wallet event listener APIs for network switching - inferred from standard MetaMask/Keplr patterns, not verified with WalletStrategy abstraction

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - packages verified on npm with recent publish dates, official examples reference same stack
- Architecture: MEDIUM-HIGH - patterns derived from official example repo (injective-simple-sc-counter-ui) and SDK docs, adapted for Next.js
- Pitfalls: HIGH - verified through SDK source code (MsgGrant expiry default), official docs (subaccount nonce 0 merge), and known Next.js SSR patterns
- AuthZ grant specifics: MEDIUM - code examples verified, but `authorization` param migration and exact `expiryInSeconds` behavior confirmed only via source code

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (30 days - SDK is actively maintained with frequent releases)
