# Phase 4: Delegated Execution - Research

**Researched:** 2026-03-17
**Domain:** Injective spot order execution via direct wallet signing
**Confidence:** HIGH

## Summary

Phase 4 takes a validated `StrategyProposal` (from `strategyStore`) and executes it on Injective testnet as batched spot limit orders. Since AuthZ self-grants were rejected by the chain in Phase 1, all execution uses **direct wallet signing** via `MsgBroadcaster` -- the user signs each transaction themselves.

The core flow is: StrategyProposal -> convert orders to chain format -> build `MsgBatchUpdateOrders` -> pre-execution confirmation UI -> user signs via wallet -> track order status -> enable cancellation of unfilled orders.

**Primary recommendation:** Use `MsgBatchUpdateOrders` for both order creation and cancellation in a single atomic message. Use the existing `spotPriceToChainPriceToFixed` and `spotQuantityToChainQuantityToFixed` helpers from `@injectivelabs/sdk-ts` for price/quantity conversion. Safety guardrails (balance check, 30% capital cap) run client-side before building the transaction.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@injectivelabs/sdk-ts` | ^1.18.8 | Message construction (MsgBatchUpdateOrders, MsgCreateSpotLimitOrder, MsgCancelSpotOrder), price/quantity conversion utilities, IndexerGrpcSpotApi for order queries | Official Injective SDK |
| `@injectivelabs/wallet-core` | ^1.18.8 | MsgBroadcaster for transaction broadcasting with wallet signing | Official broadcaster |
| `@injectivelabs/utils` | ^1.18.8 | BigNumberInBase / BigNumberInWei for precise amount math | Official math utilities |
| `zustand` | ^5.0.11 | executionStore for tracking execution state, order hashes, tx status | Already used for walletStore, strategyStore |
| `@tanstack/react-query` | ^5.90.21 | Polling for order status (filled/unfilled/cancelled) | Already used for balance queries |
| `sonner` | ^2.0.7 | Toast notifications for execution feedback | Already used |
| `zod` | ^4.3.6 | Validation schemas for execution params | Already used for strategy schemas |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@radix-ui/react-dialog` | ^1.1.15 | Confirmation modal before execution | Already installed |

### No New Dependencies Required
All necessary libraries are already installed. No additional packages needed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── services/injective/
│   ├── execution.ts          # Order construction + broadcast (NEW)
│   └── spot.ts               # Add fetchOrders, order status queries (EXTEND)
├── lib/execution/
│   ├── orderBuilder.ts       # StrategyProposal -> chain messages (NEW)
│   ├── guardrails.ts         # Balance check, capital cap, safety validation (NEW)
│   └── types.ts              # ExecutionResult, OrderStatus types (NEW)
├── stores/
│   └── executionStore.ts     # Execution state, order tracking (NEW)
├── hooks/
│   └── useExecution.ts       # React hook wrapping execution flow (NEW)
│   └── useActiveOrders.ts    # Poll for order status (NEW)
└── components/execution/
    ├── ConfirmationDialog.tsx # Pre-sign confirmation modal (NEW)
    ├── ExecutionStatus.tsx    # Post-execution status display (NEW)
    └── ActiveOrders.tsx       # List + cancel unfilled orders (NEW)
```

### Pattern 1: Order Construction from StrategyProposal

**What:** Convert human-readable StrategyProposal orders to chain-format messages
**When to use:** Before every execution

The critical conversion pipeline:
1. Human price (e.g., 8.50 USDT/INJ) -> chain price via `spotPriceToChainPriceToFixed`
2. Human quantity (e.g., 2.5 INJ) -> chain quantity via `spotQuantityToChainQuantityToFixed`
3. Map `order.side` ('buy'/'sell') -> `OrderType.BUY` (1) / `OrderType.SELL` (2)

```typescript
// Source: @injectivelabs/sdk-ts type definitions
import {
  MsgBatchUpdateOrders,
  spotPriceToChainPriceToFixed,
  spotQuantityToChainQuantityToFixed,
} from '@injectivelabs/sdk-ts'

// OrderType enum values from the protobuf definition:
// BUY = 1, SELL = 2, STOP_BUY = 3, STOP_SELL = 4, TAKE_BUY = 5, TAKE_SELL = 6

interface SpotOrderToCreate {
  orderType: number    // OrderType enum: 1=BUY, 2=SELL
  marketId: string
  feeRecipient: string // typically the sender's own address
  price: string        // chain-formatted price string
  quantity: string     // chain-formatted quantity string
  cid?: string         // optional client order ID for tracking
}

function buildSpotOrdersToCreate(
  proposal: StrategyProposal,
  baseDecimals: number,
  quoteDecimals: number,
  feeRecipient: string,
): SpotOrderToCreate[] {
  return proposal.orders.map((order, index) => ({
    orderType: order.side === 'buy' ? 1 : 2,  // OrderType.BUY : OrderType.SELL
    marketId: proposal.marketId,
    feeRecipient,
    price: spotPriceToChainPriceToFixed({
      value: order.price,
      baseDecimals,
      quoteDecimals,
    }),
    quantity: spotQuantityToChainQuantityToFixed({
      value: order.quantity,
      baseDecimals,
    }),
    cid: `axora-${Date.now()}-${index}`,  // unique client ID for tracking
  }))
}
```

### Pattern 2: MsgBatchUpdateOrders for Atomic Execution

**What:** Single message to create multiple orders atomically
**When to use:** Strategy execution (all orders succeed or all fail)

```typescript
// Source: @injectivelabs/sdk-ts MsgBatchUpdateOrders.Params type definition
const msg = MsgBatchUpdateOrders.fromJSON({
  subaccountId: getAgentSubaccountId(injectiveAddress),
  injectiveAddress,
  spotOrdersToCreate: spotOrders,
  // For cancellation, use spotOrdersToCancel or spotMarketIdsToCancelAll
})

// Broadcast via existing MsgBroadcaster singleton
await ensureCorrectNetwork(walletType)
const broadcaster = getMsgBroadcaster()
const response = await broadcaster.broadcast({
  msgs: msg,
  injectiveAddress,
})
// response.txHash is the transaction hash
// response.code === 0 means success
```

### Pattern 3: Order Cancellation via MsgBatchUpdateOrders

**What:** Cancel unfilled orders using MsgBatchUpdateOrders (preferred) or MsgBatchCancelSpotOrders
**When to use:** User requests cancellation of unfilled orders from an active strategy

```typescript
// Option A: MsgBatchUpdateOrders with spotOrdersToCancel
const cancelMsg = MsgBatchUpdateOrders.fromJSON({
  subaccountId,
  injectiveAddress,
  spotOrdersToCancel: orderHashes.map(hash => ({
    marketId,
    subaccountId,
    orderHash: hash,
  })),
})

// Option B: MsgBatchCancelSpotOrders (dedicated cancel message)
const cancelMsg = MsgBatchCancelSpotOrders.fromJSON({
  injectiveAddress,
  orders: orderHashes.map(hash => ({
    marketId,
    subaccountId,
    orderHash: hash,
  })),
})
```

### Pattern 4: Querying Active Orders

**What:** Fetch open orders for a subaccount to track status and enable cancellation
**When to use:** After execution, poll for order status

```typescript
// Source: IndexerGrpcSpotApi.fetchOrders type definition
const api = new IndexerGrpcSpotApi(endpoints.indexer)
const { orders } = await api.fetchOrders({
  subaccountId,
  marketId,
})
// Each order has: orderHash, state, price, quantity, unfilledQuantity, cid
// state is OrderState enum (from sdk-ts)
```

### Pattern 5: Execution Store State Machine

**What:** Zustand store tracking execution lifecycle
**When to use:** Managing UI state through the execution flow

```typescript
type ExecutionPhase =
  | 'idle'           // No active execution
  | 'confirming'     // Showing confirmation dialog
  | 'signing'        // Waiting for wallet signature
  | 'broadcasting'   // Transaction submitted, waiting for confirmation
  | 'success'        // Orders placed successfully
  | 'error'          // Execution failed

interface ExecutionState {
  phase: ExecutionPhase
  txHash: string | null
  orderHashes: string[]     // From tx response logs
  error: string | null
  proposalId: number | null // Links to strategyStore.proposalId
}
```

### Anti-Patterns to Avoid
- **Sending individual MsgCreateSpotLimitOrder per order:** Use MsgBatchUpdateOrders instead -- one tx, one signature, atomic execution
- **Using deprecated price/quantity converters:** `spotPriceToChainPrice` is deprecated; use `spotPriceToChainPriceToFixed` which returns a string
- **Skipping ensureCorrectNetwork before broadcast:** The wallet might be on the wrong chain, causing silent failures
- **Building AuthZ execution paths:** AuthZ self-grants failed. Phase 4 is direct signing only. AuthZ moves to Phase 7
- **Floating point math for amounts:** Always use BigNumberInBase for token amount calculations to avoid precision loss

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Price conversion (human -> chain) | Manual `* 10^(baseDecimals - quoteDecimals)` | `spotPriceToChainPriceToFixed()` from sdk-ts | Handles edge cases, rounding, and string formatting correctly |
| Quantity conversion (human -> chain) | Manual `* 10^baseDecimals` | `spotQuantityToChainQuantityToFixed()` from sdk-ts | Same precision handling |
| Subaccount ID generation | String concatenation | `getAgentSubaccountId()` (already exists) | Already handles nonce 1, eth address conversion |
| Transaction broadcasting | Direct gRPC calls | `getMsgBroadcaster().broadcast()` (already exists) | Handles signing, simulation, gas estimation |
| Network switching | Manual chain ID checks | `ensureCorrectNetwork()` (already exists) | Already handles Keplr/MetaMask differences |
| Batch order construction | Multiple individual messages | `MsgBatchUpdateOrders.fromJSON()` | Atomic: all-or-nothing execution |

**Key insight:** The Injective SDK already provides all the message construction and conversion utilities. The primary work is gluing StrategyProposal data to SDK message params, plus building the confirmation UI and safety guardrails.

## Common Pitfalls

### Pitfall 1: Chain Price Format Confusion
**What goes wrong:** Orders fail or execute at wrong prices because human-readable prices are sent as-is
**Why it happens:** Injective chain requires prices in `value / 10^(quoteDecimals - baseDecimals)` format. For INJ/USDT (base=18, quote=6), a price of 8.50 becomes `8.50 / 10^(6-18)` = `8.50 * 10^12`
**How to avoid:** Always use `spotPriceToChainPriceToFixed({ value, baseDecimals, quoteDecimals })`. Never pass human prices directly.
**Warning signs:** Orders rejected with "invalid price" or orders filling at astronomically wrong amounts

### Pitfall 2: Quantity Decimal Precision
**What goes wrong:** Chain rejects orders with quantities that have too many decimal places
**Why it happens:** The chain has a minimum quantity tick size (`minQuantityTickSize` on the market). Quantities must be multiples of this value.
**How to avoid:** After converting with `spotQuantityToChainQuantityToFixed`, verify the result respects the market's tick size. Consider querying `market.minQuantityTickSize` and rounding accordingly.
**Warning signs:** "quantity is not a multiple of the minimum tick size" errors

### Pitfall 3: Price Tick Size Violation
**What goes wrong:** Orders rejected by chain
**Why it happens:** Similar to quantity, prices must be multiples of `minPriceTickSize`
**How to avoid:** Query market metadata for `minPriceTickSize` and round chain-formatted prices to the nearest multiple.
**Warning signs:** "price is not a multiple of the minimum tick size" errors

### Pitfall 4: Insufficient Subaccount Balance
**What goes wrong:** Batch order tx fails entirely (atomic -- all or nothing)
**Why it happens:** The subaccount (nonce 1) doesn't have enough deposited balance for the total order capital
**How to avoid:** Pre-flight check: query subaccount available balance, compare against `proposal.totalCapitalRequired`, reject if insufficient. Buy orders need quote balance (USDT), sell orders need base balance (INJ).
**Warning signs:** Transaction simulation fails with insufficient funds

### Pitfall 5: Subaccount Nonce Mismatch
**What goes wrong:** Orders placed on default subaccount (nonce 0) instead of agent subaccount (nonce 1)
**Why it happens:** Using wrong subaccount ID or forgetting to use `getAgentSubaccountId()`
**How to avoid:** Always use `getAgentSubaccountId(injectiveAddress)` which hardcodes nonce 1. Never construct subaccount IDs manually.
**Warning signs:** Orders appear but balance doesn't decrement from expected subaccount

### Pitfall 6: feeRecipient Must Be a Valid Address
**What goes wrong:** Message construction fails or tx rejected
**Why it happens:** `feeRecipient` in SpotOrderToCreate cannot be empty -- it must be a valid Injective address
**How to avoid:** Set `feeRecipient` to the user's own `injectiveAddress` (standard pattern for self-trading)
**Warning signs:** Proto serialization errors

### Pitfall 7: OrderType Enum Import
**What goes wrong:** TypeScript import errors or wrong enum values
**Why it happens:** The OrderType is a re-exported protobuf enum. It's exported from sdk-ts but the path may be confusing.
**How to avoid:** Use numeric literals (1 for BUY, 2 for SELL) or import the enum properly. The SpotOrderToCreate interface expects `OrderType$1` which maps to numeric values.
**Warning signs:** TypeScript compile errors about incompatible types

## Code Examples

### Complete Order Execution Flow

```typescript
// Source: Verified from @injectivelabs/sdk-ts type definitions

import {
  MsgBatchUpdateOrders,
  spotPriceToChainPriceToFixed,
  spotQuantityToChainQuantityToFixed,
} from '@injectivelabs/sdk-ts'
import { getMsgBroadcaster } from '@/services/injective/client'
import { getAgentSubaccountId } from '@/services/injective/subaccount'
import { ensureCorrectNetwork } from '@/services/injective/wallet'
import type { StrategyProposal } from '@/lib/ai/schemas'

export async function executeStrategy(
  proposal: StrategyProposal,
  injectiveAddress: string,
  walletType: Wallet,
  baseDecimals: number,
  quoteDecimals: number,
): Promise<{ txHash: string }> {
  const subaccountId = getAgentSubaccountId(injectiveAddress)

  const spotOrdersToCreate = proposal.orders.map((order, i) => ({
    orderType: order.side === 'buy' ? 1 : 2,
    marketId: proposal.marketId,
    feeRecipient: injectiveAddress,
    price: spotPriceToChainPriceToFixed({
      value: order.price,
      baseDecimals,
      quoteDecimals,
    }),
    quantity: spotQuantityToChainQuantityToFixed({
      value: order.quantity,
      baseDecimals,
    }),
    cid: `axora-${Date.now()}-${i}`,
  }))

  const msg = MsgBatchUpdateOrders.fromJSON({
    subaccountId,
    injectiveAddress,
    spotOrdersToCreate,
  })

  await ensureCorrectNetwork(walletType)

  const broadcaster = getMsgBroadcaster()
  const response = await broadcaster.broadcast({
    msgs: msg,
    injectiveAddress,
  })

  if (response.code !== 0) {
    throw new Error(`Execution failed: ${response.rawLog}`)
  }

  return { txHash: response.txHash }
}
```

### Fetching Active Orders for Cancellation

```typescript
import { IndexerGrpcSpotApi } from '@injectivelabs/sdk-ts'
import { getEndpoints } from '@/services/injective/network'

export async function fetchActiveOrders(
  subaccountId: string,
  marketId: string,
) {
  const api = new IndexerGrpcSpotApi(getEndpoints().indexer)
  const { orders } = await api.fetchOrders({
    subaccountId,
    marketId,
  })

  // Filter to only open/unfilled orders
  return orders.filter(o =>
    o.state === 'booked' || o.state === 'partial_filled'
  )
}
```

### Cancel Unfilled Orders

```typescript
import { MsgBatchCancelSpotOrders } from '@injectivelabs/sdk-ts'

export async function cancelOrders(
  orderHashes: string[],
  marketId: string,
  subaccountId: string,
  injectiveAddress: string,
  walletType: Wallet,
) {
  const msg = MsgBatchCancelSpotOrders.fromJSON({
    injectiveAddress,
    orders: orderHashes.map(orderHash => ({
      marketId,
      subaccountId,
      orderHash,
    })),
  })

  await ensureCorrectNetwork(walletType)
  const broadcaster = getMsgBroadcaster()
  const response = await broadcaster.broadcast({
    msgs: msg,
    injectiveAddress,
  })

  return { txHash: response.txHash }
}
```

### Pre-Execution Balance Guardrail

```typescript
import { fetchSubaccountBalances } from '@/services/injective/subaccount'

export async function validateExecutionBalance(
  injectiveAddress: string,
  subaccountId: string,
  requiredCapital: number,    // in quote currency (USDT)
  quoteDenom: string,
  quoteDecimals: number,
): Promise<{ canExecute: boolean; availableBalance: number; reason?: string }> {
  const balances = await fetchSubaccountBalances(injectiveAddress)

  const subBalance = balances.find(
    b => b.subaccountId === subaccountId && b.denom === quoteDenom
  )

  const available = subBalance
    ? Number(subBalance.deposit.availableBalance) / Math.pow(10, quoteDecimals)
    : 0

  // EXEC-04: Max 30% of available balance per strategy
  const maxAllowed = available * 0.3

  if (requiredCapital > available) {
    return {
      canExecute: false,
      availableBalance: available,
      reason: `Insufficient balance: need ${requiredCapital} but only ${available.toFixed(2)} available`,
    }
  }

  if (requiredCapital > maxAllowed) {
    return {
      canExecute: false,
      availableBalance: available,
      reason: `Exceeds 30% capital limit: strategy needs ${requiredCapital} but max allowed is ${maxAllowed.toFixed(2)} (30% of ${available.toFixed(2)})`,
    }
  }

  return { canExecute: true, availableBalance: available }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `spotPriceToChainPrice` (BigNumber) | `spotPriceToChainPriceToFixed` (string) | Deprecated in recent sdk-ts | Use the `ToFixed` variant that returns strings, not BigNumber |
| `spotQuantityToChainQuantity` (BigNumber) | `spotQuantityToChainQuantityToFixed` (string) | Deprecated in recent sdk-ts | Same -- returns string ready for message params |
| Individual MsgCreateSpotLimitOrder per order | MsgBatchUpdateOrders | Always available | Single signature, atomic execution |
| AuthZ delegation (grantee != granter) | Direct wallet signing | Phase 1 discovery | Self-grants rejected by chain; direct signing for Phase 4 |

**Deprecated/outdated:**
- `spotPriceToChainPrice`: Use `spotPriceToChainPriceToFixed` instead
- `spotQuantityToChainQuantity`: Use `spotQuantityToChainQuantityToFixed` instead
- `IndexerGrpcSpotApi.fetchOrderbook`: Use `fetchOrderbookV2` (already done in codebase)

## Open Questions

1. **Order Hash Extraction from TxResponse**
   - What we know: `TxResponse` has `txHash`, `rawLog`, `logs`, `events` fields
   - What's unclear: Exactly how to extract individual order hashes from a MsgBatchUpdateOrders response. The order hashes may be in `events` or `logs` array.
   - Recommendation: Parse `response.logs` or `response.events` for `EventOrderNew` or similar events. Alternatively, after tx confirmation, query `fetchOrders` by subaccountId to find recently created orders matching our CIDs.

2. **OrderState Enum Values**
   - What we know: The `SpotLimitOrder.state` is typed as `OrderState` (imported from sdk-ts)
   - What's unclear: Exact string values for filtering (e.g., is it `'booked'` or `'BOOKED'`?)
   - Recommendation: Use the CID-based approach -- assign unique CIDs to orders at creation, then query `fetchOrders` and match by CID. This avoids needing to parse order hashes from tx response.

3. **Tick Size Enforcement**
   - What we know: Markets have `minPriceTickSize` and `minQuantityTickSize`
   - What's unclear: Whether the `spotPriceToChainPriceToFixed` helper handles tick size rounding automatically or if we need to do it manually
   - Recommendation: Query market metadata via `fetchMarket(marketId)` and round prices/quantities to tick size multiples before building messages. Better to be safe.

4. **EXEC-05: Stop-Loss on Leveraged Positions**
   - What we know: The MVP is spot-only, so leveraged positions don't apply
   - What's unclear: Whether any light enforcement is needed
   - Recommendation: Mark as N/A for spot MVP. Add a simple check that if `strategyType === 'stop-loss'`, the stop price is below current market price for sells (basic sanity).

## Sources

### Primary (HIGH confidence)
- `@injectivelabs/sdk-ts` v1.18.8 type definitions -- `MsgBatchUpdateOrders.Params`, `MsgCreateSpotLimitOrder.Params`, `MsgBatchCancelSpotOrders.Params`, `MsgCancelSpotOrder.Params`, `SpotOrderToCreate`, `OrderType` enum, `SpotLimitOrder` interface, `IndexerGrpcSpotApi.fetchOrders`, price/quantity conversion utilities
- `@injectivelabs/wallet-core` v1.18.8 type definitions -- `MsgBroadcaster.broadcast()`, `MsgBroadcasterTxOptions`, `TxResponse`
- Existing codebase: `client.ts` (MsgBroadcaster singleton), `wallet.ts` (ensureCorrectNetwork), `subaccount.ts` (getAgentSubaccountId with nonce 1), `onboarding.ts` (broadcast pattern), `spot.ts` (market queries), `schemas.ts` (StrategyProposal), `strategyStore.ts`, `calculator.ts`

### Secondary (MEDIUM confidence)
- Price conversion formula: `chainPrice = humanPrice / 10^(quoteDecimals - baseDecimals)` confirmed by sdk-ts JSDoc comments
- Quantity conversion formula: `chainQuantity = humanQuantity * 10^(baseDecimals)` confirmed by sdk-ts JSDoc comments

### Tertiary (LOW confidence)
- Order hash extraction from batch tx response (needs runtime verification)
- OrderState string values for filtering active orders (needs runtime verification)
- Tick size auto-handling in conversion utilities (needs testing)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed, types verified from node_modules
- Architecture: HIGH -- follows patterns established in Phase 1 (onboarding.ts broadcast flow)
- Message construction: HIGH -- all Params interfaces verified from SDK type definitions
- Price/quantity conversion: HIGH -- JSDoc comments confirm formulas, ToFixed variants confirmed
- Order status tracking: MEDIUM -- fetchOrders API confirmed, but state enum values need runtime verification
- Pitfalls: HIGH -- derived from SDK type analysis and Phase 1 learnings (nonce 1, self-grant rejection)

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable -- sdk version is pinned)
