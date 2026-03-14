# Architecture Research

**Domain:** AI-powered consumer trading agent on Injective blockchain
**Researched:** 2026-03-14
**Confidence:** MEDIUM (Injective SDK patterns verified via official docs; AI agent integration patterns based on multiple credible sources; some streaming details LOW confidence)

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Chat / NL   │  │  Goal-Based  │  │  Strategy Dashboard /    │  │
│  │  Input UI    │  │  Entry UI    │  │  Position Monitor UI     │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
│         │                 │                        │                │
├─────────┴─────────────────┴────────────────────────┴────────────────┤
│                         APPLICATION LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Intent      │  │  Strategy    │  │  Execution               │  │
│  │  Parser      │  │  Engine      │  │  Manager                 │  │
│  │  (LLM)       │  │              │  │                          │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
│         │                 │                        │                │
├─────────┴─────────────────┴────────────────────────┴────────────────┤
│                      INFRASTRUCTURE LAYER                           │
│  ┌──────────┐  ┌──────────────┐  ┌─────────┐  ┌────────────────┐  │
│  │  Wallet  │  │  Injective   │  │  State  │  │  Market Data   │  │
│  │  Service │  │  Chain       │  │  Store  │  │  Stream        │  │
│  │          │  │  Client      │  │         │  │  Manager       │  │
│  └──────────┘  └──────────────┘  └─────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Boundaries

| Component | Responsibility | Communicates With | Owns |
|-----------|---------------|-------------------|------|
| **Intent Parser** | Converts natural language / goal selections into structured strategy definitions | LLM API, Strategy Engine | Prompt templates, intent schemas |
| **Strategy Engine** | Validates, sizes, and structures multi-order strategies from parsed intents | Intent Parser, Execution Manager, Market Data | Strategy definitions, validation rules, position sizing logic |
| **Execution Manager** | Translates strategies into Injective Msgs, handles tx lifecycle | Strategy Engine, Chain Client, State Store | Order construction, batch sequencing, retry logic |
| **Wallet Service** | Key management, signing, subaccount/AuthZ delegation | Execution Manager, Chain Client | Key storage, grant lifecycle, permission model |
| **Chain Client** | Thin wrapper around @injectivelabs/sdk-ts for broadcasting and querying | Execution Manager, Wallet Service | Network config, broadcaster instances |
| **Market Data Stream Manager** | Manages gRPC streams to Injective Indexer for real-time data | Strategy Engine, Presentation Layer, State Store | Stream subscriptions, reconnection logic |
| **State Store** | Persists strategy state, execution history, user preferences | All components | Local DB / in-memory state |
| **Presentation Layer** | Chat UI, goal entry, strategy review, position monitoring | Intent Parser, Strategy Engine, State Store, Market Data | UI components, display logic |

## Recommended Architecture: Backend-for-Frontend (BFF) with Injective Direct

Use a **thin backend** that owns the LLM integration and strategy logic, with the frontend connecting to Injective Indexer directly for real-time market data streaming.

**Why this split:**
- LLM API keys must stay server-side (security boundary)
- Strategy validation and position sizing should run server-side (tamper resistance)
- Market data streaming is high-frequency -- direct frontend-to-Indexer avoids backend as bottleneck
- Transaction signing happens client-side (user's wallet) for direct-signing mode
- For delegated subaccount mode, signing happens server-side with the delegated key

```
┌─────────────┐         ┌──────────────────────┐
│   Browser   │────────>│  Backend (BFF)       │
│   Client    │<────────│                      │
│             │         │  - Intent Parser     │
│  - Chat UI  │   REST/ │  - Strategy Engine   │
│  - Review   │   WS    │  - AuthZ Manager     │
│  - Monitor  │         │  - Delegated Exec    │
│             │         │  - State Store       │
└──────┬──────┘         └──────────┬───────────┘
       │                           │
       │  gRPC-web/WS              │  gRPC / MsgBroadcaster
       │  (streaming)              │  (tx broadcast)
       │                           │
       v                           v
┌─────────────────────────────────────────────┐
│           Injective Network                  │
│  ┌──────────────┐  ┌────────────────────┐   │
│  │  Indexer API  │  │  Chain (Sentry)    │   │
│  │  (read/stream)│  │  (write/query)     │   │
│  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Why NOT a fully client-side architecture

- LLM API keys cannot be exposed in the browser
- Delegated subaccount execution requires server-held private keys
- Strategy state needs persistence beyond browser session
- Rate limiting and abuse prevention require a server boundary

### Why NOT a thick backend that proxies all data

- Orderbook and position streaming would create unnecessary server load
- Adds latency to real-time data that users need for review/monitoring
- Injective Indexer gRPC-web is designed for browser consumption

## Data Flow

### Flow 1: Intent to Strategy Proposal

```
User Input (NL text or goal selection)
    |
    v
[Frontend] ──POST /intent──> [Backend: Intent Parser]
                                    |
                                    v
                              [LLM API Call]
                              (structured output: strategy JSON)
                                    |
                                    v
                              [Strategy Engine]
                              - Validate against market state
                              - Calculate position sizes
                              - Generate order parameters
                              - Apply risk bounds
                                    |
                                    v
                              [Strategy Proposal Response]
                              {
                                orders: [...],
                                estimatedCost: ...,
                                risks: [...],
                                requiresApproval: true
                              }
    |
    v
[Frontend] displays proposal for user review
```

### Flow 2: Direct Signing Execution

```
User approves strategy
    |
    v
[Frontend] requests unsigned Msgs from Backend
    |
    v
[Backend: Execution Manager]
    - Constructs MsgCreateSpotLimitOrder / MsgCreateDerivativeLimitOrder
    - Uses MsgBatchUpdateOrders for multi-order strategies
    - Returns unsigned message array
    |
    v
[Frontend: Wallet Service]
    - Signs with user wallet (Keplr / Metamask via Injective wallet-strategy)
    - Broadcasts via MsgBroadcaster
    |
    v
[Injective Chain]
    |
    v
[Frontend] monitors execution via Indexer streams
```

### Flow 3: Delegated Subaccount Execution

```
One-time setup: User grants AuthZ permissions
    |
    v
[Frontend] signs MsgGrant for each required message type:
    - /injective.exchange.v1beta1.MsgCreateSpotLimitOrder
    - /injective.exchange.v1beta1.MsgCreateDerivativeLimitOrder
    - /injective.exchange.v1beta1.MsgCancelSpotOrder
    - /injective.exchange.v1beta1.MsgCancelDerivativeOrder
    - /injective.exchange.v1beta1.MsgBatchUpdateOrders
    - /injective.exchange.v1beta1.MsgDeposit
    |
    v
[Injective Chain] stores grants

--- Subsequent executions ---

User approves strategy
    |
    v
[Backend: Execution Manager]
    - Constructs Msgs with granter's subaccount
    - Wraps in MsgExec with grantee (server wallet) as sender
    - Signs with server-held grantee private key
    - Broadcasts via MsgBroadcasterWithPk
    |
    v
[Injective Chain] verifies AuthZ grant, executes
    |
    v
[Backend] monitors via Indexer, updates State Store
[Frontend] receives updates via WebSocket from Backend
```

### Flow 4: Real-Time Market Data

```
[Injective Indexer]
    |
    | gRPC streams (IndexerGrpcSpotStream, IndexerGrpcDerivativesStream)
    |
    v
[Market Data Stream Manager]
    - Orderbook updates (OrderbookStreamCallback)
    - Order history updates
    - Position updates
    - Trade execution updates
    |
    v
[State Store] ──> [Frontend UI updates]
```

### Key Data Flows Summary

1. **Intent Flow:** User input --> Backend LLM --> Strategy proposal --> User review (human-in-the-loop)
2. **Execution Flow:** Approved strategy --> Msg construction --> Sign (client or server) --> Broadcast --> Monitor
3. **Data Flow:** Indexer streams --> Stream Manager --> State Store --> UI
4. **Grant Flow:** User signs MsgGrant --> Chain stores --> Server uses MsgExec for delegated ops

## Recommended Project Structure

```
src/
├── server/                     # Backend (Node.js / Express or Fastify)
│   ├── intent/                 # Intent parsing module
│   │   ├── parser.ts           # LLM integration, prompt management
│   │   ├── schemas.ts          # Structured output schemas (zod)
│   │   └── prompts/            # Prompt templates per strategy type
│   ├── strategy/               # Strategy engine
│   │   ├── engine.ts           # Orchestrates validation + sizing
│   │   ├── validator.ts        # Market state validation
│   │   ├── sizer.ts            # Position sizing logic
│   │   └── types.ts            # Strategy type definitions
│   ├── execution/              # Execution manager
│   │   ├── builder.ts          # Msg construction from strategies
│   │   ├── broadcaster.ts      # Wraps MsgBroadcasterWithPk
│   │   ├── delegated.ts        # MsgExec wrapping for AuthZ
│   │   └── monitor.ts          # Tx confirmation + status tracking
│   ├── chain/                  # Injective chain client
│   │   ├── client.ts           # SDK client initialization
│   │   ├── queries.ts          # Chain state queries
│   │   └── streams.ts          # Indexer stream management
│   ├── wallet/                 # Server-side wallet (for delegated mode)
│   │   ├── keystore.ts         # Encrypted key storage
│   │   └── grants.ts           # AuthZ grant tracking
│   ├── state/                  # State management
│   │   ├── store.ts            # Strategy + execution state
│   │   └── history.ts          # Execution history
│   └── api/                    # API routes
│       ├── intent.routes.ts    # POST /intent, POST /intent/refine
│       ├── strategy.routes.ts  # GET /strategy/:id, POST /strategy/execute
│       ├── market.routes.ts    # GET /markets, GET /orderbook/:market
│       └── ws.ts               # WebSocket for real-time updates to client
├── client/                     # Frontend (React / Next.js)
│   ├── components/             # UI components
│   │   ├── chat/               # Natural language input
│   │   ├── goals/              # Goal-based entry points
│   │   ├── strategy/           # Strategy review + approval
│   │   └── monitor/            # Position + execution monitoring
│   ├── hooks/                  # React hooks
│   │   ├── useIntent.ts        # Intent submission
│   │   ├── useStrategy.ts      # Strategy state
│   │   ├── useMarketData.ts    # Indexer stream subscriptions
│   │   └── useWallet.ts        # Wallet connection + signing
│   ├── services/               # Client-side services
│   │   ├── api.ts              # Backend API client
│   │   ├── stream.ts           # Direct Indexer stream connections
│   │   └── wallet.ts           # @injectivelabs/wallet-strategy wrapper
│   └── store/                  # Client state (zustand / context)
│       ├── market.ts           # Orderbook, prices
│       ├── strategy.ts         # Active strategies
│       └── user.ts             # User preferences, wallet state
└── shared/                     # Shared types between client/server
    ├── types/                  # Strategy, order, market types
    └── constants/              # Market IDs, supported assets
```

### Structure Rationale

- **server/intent/** and **server/strategy/**: Separated because intent parsing (LLM-dependent) and strategy logic (deterministic) have different testing and failure modes
- **server/execution/**: Isolated because it is the only module that writes to chain -- clear security boundary
- **shared/**: Strategy type definitions shared between client review UI and server strategy engine
- **client/services/stream.ts**: Direct Indexer connection from client, not proxied through backend

## Architectural Patterns

### Pattern 1: Human-in-the-Loop Proposal Pattern

**What:** Every AI-generated strategy becomes a proposal that requires explicit user approval before any on-chain action. The LLM never has direct execution authority.

**When to use:** Always. This is the core trust model.

**Trade-offs:** Adds one interaction step before execution; users may want "just do it" mode eventually, but start with mandatory approval.

```typescript
// Strategy proposal lifecycle
interface StrategyProposal {
  id: string;
  status: 'pending_review' | 'approved' | 'executing' | 'completed' | 'failed' | 'cancelled';
  intent: UserIntent;           // Original user input
  strategy: StructuredStrategy; // LLM-generated, engine-validated
  orders: UnsignedOrderMsg[];   // Ready-to-sign Injective messages
  estimates: CostEstimate;      // Gas, fees, slippage bounds
  risks: RiskWarning[];         // What could go wrong
  createdAt: number;
  expiresAt: number;            // Proposals expire (market moves)
}
```

### Pattern 2: Bounded Delegation Model

**What:** Server-side execution authority is strictly bounded by AuthZ grants that users can revoke at any time. The server wallet (grantee) can only execute specific message types on behalf of the user (granter), and only on subaccounts the user designates.

**When to use:** For automated/delegated execution mode where users want strategies to execute without manual signing each time.

**Trade-offs:** More complex setup (multiple MsgGrant transactions); server holds a private key (operational security burden); but user retains full revocation control.

```typescript
// AuthZ grant scope -- each must be individually granted
const REQUIRED_GRANTS = [
  '/injective.exchange.v1beta1.MsgCreateSpotLimitOrder',
  '/injective.exchange.v1beta1.MsgCreateDerivativeLimitOrder',
  '/injective.exchange.v1beta1.MsgCancelSpotOrder',
  '/injective.exchange.v1beta1.MsgCancelDerivativeOrder',
  '/injective.exchange.v1beta1.MsgBatchUpdateOrders',
] as const;

// Execution via MsgExec wrapper
async function executeDelegated(
  msgs: EncodeObject[],
  granteePrivateKey: string,
  granteeAddress: string,
) {
  const execMsg = MsgExec.fromJSON({
    msgs,
    grantee: granteeAddress,
  });

  return new MsgBroadcasterWithPk({
    privateKey: granteePrivateKey,
    network: Network.Mainnet,
  }).broadcast({ msgs: execMsg });
}
```

### Pattern 3: Structured LLM Output with Validation

**What:** The LLM returns structured JSON matching a Zod schema, which is then validated by the Strategy Engine against current market state before becoming a proposal.

**When to use:** For all intent parsing. Never trust raw LLM output for financial parameters.

**Trade-offs:** Constrains LLM creativity but ensures safety; requires well-defined strategy schemas upfront.

```typescript
import { z } from 'zod';

const StrategyOutputSchema = z.object({
  type: z.enum(['limit_buy', 'limit_sell', 'split_order', 'bracket_order', 'dca']),
  market: z.string(),           // e.g., "INJ/USDT"
  side: z.enum(['buy', 'sell']),
  orders: z.array(z.object({
    price: z.number().positive(),
    quantity: z.number().positive(),
    orderType: z.enum(['limit', 'market']),
  })),
  totalBudget: z.number().positive(),
  reasoning: z.string(),        // LLM explains its logic to user
});

// Strategy Engine validates against market reality
function validateStrategy(strategy: StrategyOutput, marketState: MarketState): ValidationResult {
  // Check: prices within reasonable range of current market
  // Check: quantities meet market minimum order size
  // Check: total budget within user's available balance
  // Check: position sizing within risk bounds
}
```

### Pattern 4: Subaccount Isolation for Risk Management

**What:** Use Injective's native subaccount system to isolate delegated trading funds from the user's main portfolio. The user deposits a specific amount into a designated subaccount, and the delegated agent can only operate on that subaccount.

**When to use:** Always for delegated mode. This is the primary risk boundary.

**Trade-offs:** Requires explicit deposit step; subaccount 0 (default) costs ~15% more gas, so use subaccount index 1+.

```typescript
// Subaccount ID = ethereum address + 24-char suffix
// Default (index 0): address + '0'.repeat(24)
// Index 1: address + '0'.repeat(23) + '1'

function getSubaccountId(injectiveAddress: string, index: number): string {
  const ethAddress = getEthereumAddress(injectiveAddress);
  return ethAddress + index.toString().padStart(24, '0');
}

// Deposit funds into trading subaccount before delegated execution
const depositMsg = MsgDeposit.fromJSON({
  subaccountId: getSubaccountId(userAddress, 1), // Non-default subaccount
  injectiveAddress: userAddress,
  amount: { denom: 'peggy0x...', amount: depositAmount },
});
```

### Pattern 5: Stream Manager with Reconnection

**What:** Centralized stream management that handles Indexer gRPC stream lifecycle including reconnection, backoff, and state reconciliation after reconnect.

**When to use:** For all real-time data consumption from Injective Indexer.

**Trade-offs:** More setup than simple polling; but essential for responsive UX on a trading product.

```typescript
class StreamManager {
  private streams: Map<string, StreamSubscription> = new Map();

  async subscribeOrderbook(marketId: string, callback: OrderbookCallback) {
    const stream = new IndexerGrpcSpotStream(indexerEndpoint);

    // SDK handles gRPC streaming with callbacks
    stream.streamSpotOrderbookUpdate({
      marketIds: [marketId],
      callback: (orderbook) => {
        this.updateState(marketId, orderbook);
        callback(orderbook);
      },
      onEndCallback: () => this.reconnect(marketId),
      onStatusCallback: (status) => this.handleStatus(marketId, status),
    });

    this.streams.set(marketId, stream);
  }
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: LLM with Direct Execution Authority

**What people do:** Let the LLM output directly trigger on-chain transactions without human review.

**Why it is wrong:** LLMs hallucinate. A hallucinated price, wrong market ID, or misinterpreted intent could cause immediate financial loss. There is no undo on-chain.

**Do this instead:** LLM output always flows through Strategy Engine validation, then becomes a proposal requiring user approval. The LLM is an intent parser, never an executor.

### Anti-Pattern 2: Single Subaccount for Everything

**What people do:** Use the user's default subaccount (index 0) for both manual and delegated trading.

**Why it is wrong:** No isolation between user's manual activity and agent's delegated activity. Agent errors could affect the user's entire portfolio. Also, subaccount 0 costs ~15% more gas since its balance is managed by the Bank module.

**Do this instead:** Dedicate a non-default subaccount (index 1+) for delegated operations. User explicitly deposits a bounded amount. Agent cannot access funds beyond what is deposited in that subaccount.

### Anti-Pattern 3: Proxying All Market Data Through Backend

**What people do:** Route all orderbook and market data streams through the backend server to the frontend.

**Why it is wrong:** Creates unnecessary server load, adds latency, and turns the backend into a bottleneck for data that Injective's Indexer already serves directly via gRPC-web. For a 1-2 person team, this is operational burden with no benefit.

**Do this instead:** Frontend connects directly to Injective Indexer for market data streams. Backend only handles intent parsing, strategy logic, and delegated execution.

### Anti-Pattern 4: Storing Private Keys in Plain Text

**What people do:** Store the delegated grantee wallet's private key in environment variables or config files without encryption.

**Why it is wrong:** Server compromise exposes the key. While the key can only perform AuthZ-granted actions, it can still drain the delegated subaccount.

**Do this instead:** Use encrypted key storage (e.g., encrypted at rest with a KMS or hardware-backed secret). For MVP, at minimum use environment variables with strict access controls and rotate keys periodically.

### Anti-Pattern 5: Treating Strategy State as Ephemeral

**What people do:** Keep strategy and execution state only in memory, losing it on server restart.

**Why it is wrong:** Server restart during strategy execution means losing track of pending orders, leading to orphaned orders on-chain that the user does not know about.

**Do this instead:** Persist strategy state to disk (SQLite for MVP). On startup, reconcile persisted state with on-chain state via Indexer queries.

## Scaling Considerations

| Concern | MVP (0-100 users) | Growth (100-1K users) | Scale (1K+ users) |
|---------|--------------------|-----------------------|--------------------|
| **LLM calls** | Direct OpenAI/Anthropic API calls | Add response caching for similar intents | Consider self-hosted model or batch processing |
| **Market data** | Client-side Indexer streams | Client-side Indexer streams (no change) | Add server-side aggregation if needed |
| **State storage** | SQLite on server | PostgreSQL | PostgreSQL with read replicas |
| **Execution** | Single server, serial execution | Queue-based execution (BullMQ) | Distributed workers |
| **Websockets** | Direct from single server | Sticky sessions or Redis pub/sub | Dedicated WS gateway |

### Scaling Priorities

1. **First bottleneck: LLM latency.** Intent parsing takes 1-3 seconds per call. Mitigate with streaming responses, caching common intents, and optimizing prompts for smaller/faster models where possible.
2. **Second bottleneck: Execution throughput.** At high user counts, many delegated strategies could need simultaneous execution. Mitigate with execution queues and prioritization.
3. **Non-bottleneck: Market data.** Injective Indexer handles this. Each client streams directly; no server scaling needed.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **LLM API (OpenAI/Anthropic)** | REST API with structured output (JSON mode) | Server-side only. Use streaming for UX. Implement retry with exponential backoff. Budget ~$0.01-0.05 per intent parse. |
| **Injective Indexer** | gRPC / gRPC-web via @injectivelabs/sdk-ts | Both client and server. Use IndexerGrpcSpotApi, IndexerGrpcDerivativesApi for queries; Stream variants for real-time. |
| **Injective Chain (Sentry)** | gRPC via @injectivelabs/sdk-ts | Server-side for delegated execution (MsgBroadcasterWithPk). Client-side for direct signing (MsgBroadcaster with wallet-strategy). |
| **Wallet Providers** | @injectivelabs/wallet-strategy | Client-side only. Supports Keplr, MetaMask, Leap, etc. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend <-> Backend | REST + WebSocket | REST for intent/strategy CRUD; WS for execution status updates |
| Intent Parser <-> LLM | REST (HTTP) | Async, 1-3s latency. Stream response tokens for UX. |
| Strategy Engine <-> Market Data | In-process function calls | Engine queries cached market state, does not stream |
| Execution Manager <-> Chain | gRPC via MsgBroadcasterWithPk | Fire-and-wait for tx hash, then monitor via Indexer |
| Backend <-> State Store | In-process (SQLite) or DB driver | Synchronous for MVP; async with connection pool at scale |

## Build Order (Dependencies)

The following build order reflects component dependencies -- each phase builds on the previous:

1. **Chain Client + Wallet Service** -- Foundation. Cannot test anything without chain connectivity and signing capability. Wrap @injectivelabs/sdk-ts client initialization, network config, and basic query/broadcast. (Confidence: HIGH -- well-documented SDK patterns)

2. **Market Data Queries (non-streaming)** -- Required by Strategy Engine for validation. Simple IndexerGrpcSpotApi / IndexerGrpcDerivativesApi queries for markets, orderbooks, balances. (Confidence: HIGH)

3. **Execution Manager (direct signing only)** -- Construct and broadcast Msgs. Start with single order types (MsgCreateSpotLimitOrder), then add batch operations. Frontend signs. (Confidence: HIGH -- documented patterns)

4. **Intent Parser + Strategy Engine (basic)** -- LLM integration with structured output. Start with 2-3 strategy types (limit order, split order, bracket order). Strategy Engine validates LLM output and produces order params. (Confidence: MEDIUM -- LLM integration patterns well-known, but prompt engineering for financial strategies needs iteration)

5. **Presentation Layer (core flows)** -- Chat input, strategy proposal review, execution trigger, basic position view. (Confidence: HIGH)

6. **AuthZ + Delegated Execution** -- MsgGrant flow, server-side MsgExec wrapping, subaccount isolation. This is the harder execution mode. (Confidence: MEDIUM -- AuthZ patterns documented but delegation lifecycle has edge cases around grant expiry and revocation)

7. **Market Data Streaming** -- Real-time orderbook and position updates via IndexerGrpcSpotStream / IndexerGrpcDerivativesStream. Reconnection logic. (Confidence: MEDIUM -- streaming API exists but reconnection patterns need validation)

8. **Advanced Strategies + Monitoring** -- Conditional orders, DCA, multi-leg strategies. Full execution monitoring dashboard. (Confidence: LOW -- requires iteration based on user feedback)

**Key dependency chain:**
```
Chain Client --> Market Data Queries --> Strategy Engine --> Intent Parser
                                    --> Execution Manager --> AuthZ/Delegation
                                                         --> Monitoring
```

## Security Boundaries

| Boundary | What It Protects | Implementation |
|----------|------------------|----------------|
| **LLM API keys** | Prevent unauthorized LLM usage billing | Server-side only, never sent to client |
| **Grantee private key** | Prevent unauthorized delegated execution | Encrypted storage, server-side only, minimal permissions |
| **AuthZ grant scope** | Limit what delegated agent can do | Grant only specific Msg types, user can revoke via MsgRevoke at any time |
| **Subaccount isolation** | Cap financial exposure of delegation | User deposits bounded amount into dedicated subaccount; agent cannot access other subaccounts |
| **Proposal approval** | Prevent LLM hallucination from causing loss | Every strategy requires explicit user approval before execution |
| **Strategy expiry** | Prevent stale strategies from executing at wrong prices | Proposals expire after configurable TTL (e.g., 60 seconds) |

## Sources

- [Injective TypeScript SDK (GitHub)](https://github.com/InjectiveLabs/injective-ts) -- monorepo structure, package list (HIGH confidence)
- [Injective Exchange Module Messages](https://docs.injective.network/developers/modules/injective/exchange/05_messages) -- all Msg types for trading (HIGH confidence)
- [Injective AuthZ Examples](https://docs.injective.network/developers-native/examples/authz) -- MsgGrant/MsgExec/MsgRevoke patterns (HIGH confidence)
- [Injective Exchange Examples](https://docs.injective.network/developers-native/examples/exchange) -- order creation, subaccount patterns (HIGH confidence)
- [Injective Indexer API Concepts](https://docs.injective.network/developers/concepts/indexer-api) -- streaming architecture, MongoDB backing (MEDIUM confidence)
- [Injective DEX Example](https://docs.injective.network/developers/dapps/example-dex) -- StreamManagerV2 pattern, wallet-strategy usage (MEDIUM confidence)
- [iAgent GitHub](https://github.com/InjectiveLabs/iAgent) -- reference AI agent architecture on Injective (MEDIUM confidence)
- [Injective API Reference](https://api.injective.exchange/) -- gRPC endpoints (MEDIUM confidence)
- [TradingAgents: Multi-Agent LLM Framework](https://arxiv.org/abs/2412.20138) -- AI trading agent architecture patterns (LOW confidence -- academic, not Injective-specific)
- [Hummingbot Injective Connector](https://hummingbot.org/exchanges/injective/) -- subaccount delegation configuration patterns (MEDIUM confidence)

---
*Architecture research for: AI-powered consumer trading agent on Injective blockchain*
*Researched: 2026-03-14*
