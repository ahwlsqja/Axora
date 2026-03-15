# Phase 3: AI Strategy Engine - Research

**Researched:** 2026-03-16
**Domain:** LLM-powered intent parsing, structured output validation, Injective market data, strategy proposal UI
**Confidence:** MEDIUM-HIGH

## Summary

Phase 3 converts user intent (preset ID or free-text) into structured strategy proposals. The core technical challenge is: (1) calling an LLM to parse natural language intent into structured trading parameters, (2) strictly validating AI output with Zod schemas, (3) fetching current Injective spot market data (price, orderbook) for sanity-checking, and (4) rendering an interactive proposal card the user can adjust before execution.

The Vercel AI SDK (v6) is the standard for LLM integration in Next.js, providing built-in Zod schema validation via `Output.object()` with `generateText`. Injective's `IndexerGrpcSpotApi` provides snapshot orderbook and market data. The strategy engine runs entirely server-side (Next.js Route Handler or Server Action) to protect API keys, with the client receiving only the validated proposal object.

**Primary recommendation:** Use Vercel AI SDK v6 with `generateText` + `Output.object()` for schema-enforced structured output. Use `IndexerGrpcSpotApi.fetchOrderbookV2()` for market data snapshots. Keep all LLM calls in a single server-side endpoint that returns a validated `StrategyProposal` Zod type.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` | ^6.0 | Vercel AI SDK core - `generateText`, `Output.object()` | De facto standard for LLM in Next.js; built-in Zod validation, multi-provider |
| `@ai-sdk/openai` | ^3.0 | OpenAI provider (GPT-4o for structured output) | Best structured output support, `strictJsonSchema` defaults true in v6 |
| `zod` | ^3.23 | Schema definition and validation | Already implicit dep of AI SDK; use v3 for maximum compatibility with AI SDK 6 |
| `@injectivelabs/sdk-ts` | ^1.18.8 | `IndexerGrpcSpotApi` for market data | Already in project; provides orderbook, market list |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@ai-sdk/anthropic` | ^3.0 | Anthropic provider (Claude fallback) | Optional: swap provider with one line change |
| `@tanstack/react-query` | ^5.90 | Cache market data, strategy proposals | Already in project; use for orderbook/price caching |
| `@radix-ui/react-slider` | ^1.3.6 | Adjustable parameter sliders in proposal card | Already in project; for price range, split count adjustments |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vercel AI SDK | Direct OpenAI SDK (`openai` npm) | Loses multi-provider, built-in Zod validation, streaming helpers |
| GPT-4o | Claude 3.5 Sonnet | Claude needs `structuredOutputMode: "jsonTool"` workaround; GPT-4o has native structured output |
| Server-side generation | Edge runtime | Injective SDK uses gRPC which needs Node.js runtime, not Edge |

**Important version note:** Use Zod v3 (^3.23), NOT Zod v4. AI SDK 6 has native Zod support but `@ai-sdk/provider-utils` internally depends on `zod-to-json-schema` which targets Zod v3. Zod v4 may work but is not fully validated in the AI SDK ecosystem yet. The project currently has no explicit Zod dependency so this is a fresh install.

**Installation:**
```bash
npm install ai @ai-sdk/openai zod
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── api/
│       └── strategy/
│           └── route.ts          # POST endpoint: intent -> strategy proposal
├── services/
│   └── injective/
│       └── spot.ts               # IndexerGrpcSpotApi wrapper (market data)
├── lib/
│   ├── ai/
│   │   ├── provider.ts           # AI provider config (model selection)
│   │   ├── prompts.ts            # System prompts for intent parsing
│   │   └── schemas.ts            # Zod schemas for AI output validation
│   └── strategy/
│       ├── calculator.ts         # Strategy parameter calculation logic
│       ├── validator.ts          # Safety guardrails (risk thresholds, realism checks)
│       └── types.ts              # StrategyProposal, StrategyOrder types
├── stores/
│   └── strategyStore.ts          # Zustand store for proposal state + adjustments
├── components/
│   └── strategy/
│       ├── ProposalCard.tsx       # Main proposal display card
│       ├── OrderPreview.tsx       # Individual order line in proposal
│       ├── ParameterAdjuster.tsx  # Slider/input controls for adjusting params
│       └── RiskWarning.tsx        # Risk threshold warning display
└── hooks/
    ├── useStrategy.ts            # React Query hook for strategy generation
    └── useMarketData.ts          # React Query hook for spot market data
```

### Pattern 1: Server-Side Strategy Generation (Route Handler)
**What:** All LLM calls happen in a Next.js Route Handler. The client sends intent, receives validated proposal.
**When to use:** Always -- API keys must never reach the client.
**Example:**
```typescript
// src/app/api/strategy/route.ts
import { generateText, Output } from 'ai'
import { openai } from '@ai-sdk/openai'
import { strategyProposalSchema } from '@/lib/ai/schemas'
import { buildSystemPrompt } from '@/lib/ai/prompts'
import { fetchMarketSnapshot } from '@/services/injective/spot'
import { validateProposal } from '@/lib/strategy/validator'

export async function POST(req: Request) {
  const { intent, presetId, marketId } = await req.json()

  // 1. Fetch current market data
  const marketData = await fetchMarketSnapshot(marketId)

  // 2. Call LLM with market context
  const result = await generateText({
    model: openai('gpt-4o'),
    system: buildSystemPrompt(marketData),
    prompt: intent,
    output: Output.object({
      schema: strategyProposalSchema,
    }),
  })

  // 3. Post-validate against market reality
  const validated = validateProposal(result.output, marketData)

  return Response.json(validated)
}
```

### Pattern 2: Zod Schema as Single Source of Truth
**What:** Define one Zod schema that serves as: AI output constraint, runtime validation, and TypeScript type.
**When to use:** Always -- this is the "AI output must be Zod-validated" requirement.
**Example:**
```typescript
// src/lib/ai/schemas.ts
import { z } from 'zod'

export const strategyOrderSchema = z.object({
  side: z.enum(['buy', 'sell']).describe('Order side'),
  price: z.number().positive().describe('Limit price in quote currency (USDT)'),
  quantity: z.number().positive().describe('Amount in base currency'),
  percentOfTotal: z.number().min(0).max(100).describe('Percentage of total capital for this order'),
})

export const strategyProposalSchema = z.object({
  strategyType: z.enum([
    'dca', 'stop-loss', 'scale-in', 'take-profit', 'limit-buy', 'range-accumulate'
  ]).describe('Strategy type matching preset IDs'),
  marketId: z.string().describe('Injective spot market ID (0x...)'),
  baseDenom: z.string().describe('Base denomination symbol (e.g., INJ)'),
  quoteDenom: z.string().describe('Quote denomination symbol (e.g., USDT)'),
  orders: z.array(strategyOrderSchema).min(1).max(20)
    .describe('Individual orders composing this strategy'),
  totalCapitalRequired: z.number().positive()
    .describe('Total quote currency needed'),
  priceRange: z.object({
    min: z.number().positive(),
    max: z.number().positive(),
  }).describe('Price range the strategy covers'),
  splitCount: z.number().int().min(1).max(20)
    .describe('Number of order splits'),
  worstCaseOutcome: z.string()
    .describe('Human-readable worst case scenario description'),
  reasoning: z.string()
    .describe('Brief explanation of why this strategy was structured this way'),
})

export type StrategyProposal = z.infer<typeof strategyProposalSchema>
export type StrategyOrder = z.infer<typeof strategyOrderSchema>
```

### Pattern 3: Two-Phase Validation (AI + Market Reality)
**What:** AI output is first schema-validated by Zod, then post-validated against real market data.
**When to use:** Always -- AI can produce schema-valid but market-unrealistic values.
**Example:**
```typescript
// src/lib/strategy/validator.ts
export interface MarketSnapshot {
  midPrice: number
  bestBid: number
  bestAsk: number
  spread: number
  orderbookDepth: { bids: number; asks: number }
}

export interface ValidationResult {
  valid: boolean
  warnings: string[]
  errors: string[]
  adjustedProposal?: StrategyProposal
}

export function validateProposal(
  proposal: StrategyProposal,
  market: MarketSnapshot
): ValidationResult {
  const warnings: string[] = []
  const errors: string[] = []

  // Check price range vs current market
  const deviation = Math.abs(proposal.priceRange.min - market.midPrice) / market.midPrice
  if (deviation > 0.5) {
    errors.push(`Price range deviates >50% from current market price ($${market.midPrice})`)
  } else if (deviation > 0.2) {
    warnings.push(`Price range deviates >20% from current market price`)
  }

  // Check if orders would cross the spread
  for (const order of proposal.orders) {
    if (order.side === 'buy' && order.price > market.bestAsk) {
      warnings.push(`Buy order at ${order.price} is above best ask (${market.bestAsk})`)
    }
  }

  // Check total capital vs reasonable limits
  if (proposal.totalCapitalRequired <= 0) {
    errors.push('Total capital must be positive')
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  }
}
```

### Pattern 4: Preset-to-Prompt Mapping
**What:** Map preset IDs to specific prompt instructions, so AI generates appropriate strategy structure.
**When to use:** When user selects a preset (source === 'preset').
**Example:**
```typescript
// src/lib/ai/prompts.ts
const PRESET_PROMPTS: Record<string, string> = {
  'dca-inj': 'Create a dollar-cost averaging strategy that splits a buy order for INJ into equal-sized limit orders at regular price intervals below the current market price.',
  'stop-loss': 'Create a stop-loss strategy with a single sell limit order placed below the current market price to limit downside risk.',
  'scale-in': 'Create a scale-in strategy with progressively larger buy orders at lower price levels, weighted more heavily at deeper dips.',
  'take-profit': 'Create a take-profit strategy with sell orders placed at ascending price targets above the current price.',
  'limit-buy': 'Create a single limit buy order at a discount to the current market price.',
  'range-accumulate': 'Create a range accumulation strategy with evenly distributed buy orders across a specified price range below market.',
}

export function buildSystemPrompt(market: MarketSnapshot): string {
  return `You are a DeFi trading strategy assistant for the Injective blockchain.
You structure user trading intents into precise order parameters.

Current market data:
- Mid price: ${market.midPrice} USDT
- Best bid: ${market.bestBid} USDT
- Best ask: ${market.bestAsk} USDT
- Spread: ${(market.spread * 100).toFixed(3)}%

Rules:
- All prices must be realistic relative to current market price
- Buy orders should be at or below current price
- Sell orders should be at or above current price
- Maximum 20 orders per strategy
- Respect the user's stated budget/amount
- Output prices with appropriate decimal precision for this market
- Always explain the worst-case outcome honestly`
}

export function getPromptForIntent(
  presetId: string | null,
  freeText: string,
  source: 'preset' | 'freetext'
): string {
  if (source === 'preset' && presetId && PRESET_PROMPTS[presetId]) {
    return PRESET_PROMPTS[presetId]
  }
  return freeText
}
```

### Anti-Patterns to Avoid
- **Client-side LLM calls:** Never expose API keys in browser. All AI calls go through Route Handler.
- **Trusting AI output without validation:** Even with Zod schema enforcement, post-validate against market reality. AI can produce schema-valid but absurd values.
- **Streaming structured output for this use case:** The proposal is a single object the user reviews. Streaming partial objects adds complexity without UX benefit here. Use `generateText` (non-streaming), not `streamText`.
- **Hardcoding market IDs:** Market IDs are long hex strings that differ between testnet and mainnet. Fetch dynamically via `IndexerGrpcSpotApi.fetchMarkets()`.
- **Using Edge runtime:** Injective SDK uses gRPC-web which requires Node.js runtime. Set `export const runtime = 'nodejs'` in route handler.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| LLM structured output | Custom JSON parsing + regex extraction | AI SDK `Output.object()` with Zod | Handles retries, schema enforcement, provider differences |
| JSON Schema from Zod | Manual JSON Schema writing | AI SDK auto-converts Zod to JSON Schema | Keeps single source of truth, avoids drift |
| Orderbook mid-price calc | Custom WebSocket orderbook aggregator | `IndexerGrpcSpotApi.fetchOrderbookV2()` snapshot | MVP uses snapshots per spec; streaming is Phase 4+ |
| Price/quantity chain conversion | Manual decimal shifting | `spotPriceToChainPriceToFixed()`, `spotQuantityToChainQuantityToFixed()` from SDK | Handles tensMultiplier, baseDecimals, quoteDecimals correctly |
| Form state for parameter adjustment | Manual React state with onChange handlers | Zustand store + controlled inputs | Consistent with existing store pattern; enables undo/reset |

**Key insight:** The AI SDK abstracts away the provider-specific differences in structured output (OpenAI uses `response_format.json_schema`, Anthropic uses `tool_use` trick). Using it means you can swap models without changing application code.

## Common Pitfalls

### Pitfall 1: Injective Price/Quantity Decimals
**What goes wrong:** Prices and quantities on Injective use chain-specific decimal encoding. INJ has 18 base decimals, USDT has 6 quote decimals. Raw orderbook values are in chain format, not human-readable.
**Why it happens:** Injective's on-chain representation differs from display values by orders of magnitude.
**How to avoid:** Always use SDK conversion functions: `spotPriceToChainPriceToFixed()` for converting human prices to chain format, and reverse for display. Fetch market metadata (`baseDecimals`, `quoteDecimals`, `tensMultiplier`) alongside orderbook data.
**Warning signs:** Prices appearing as very large or very small numbers; orders failing with "price out of range" errors.

### Pitfall 2: AI Generating Invalid Market IDs
**What goes wrong:** LLM hallucinates market IDs (they are 66-character hex strings like `0x...`).
**Why it happens:** Market IDs are not memorable strings; they change between networks.
**How to avoid:** Never let the AI generate market IDs. Pass the market ID into the prompt as context. The AI should only output strategy parameters, not market selection. Maintain a `SUPPORTED_MARKETS` config that maps readable names to actual market IDs.
**Warning signs:** 404/not-found errors when querying markets.

### Pitfall 3: Schema Description Quality Affects AI Output
**What goes wrong:** AI returns technically valid but semantically wrong values (e.g., negative split count wrapped as positive by Zod transform).
**Why it happens:** Zod `.describe()` strings are sent to the AI as field instructions. Vague descriptions produce vague outputs.
**How to avoid:** Write detailed `.describe()` on every schema field. Include units, ranges, and examples. Test prompts with edge cases.
**Warning signs:** AI consistently returns default-looking values or ignores constraints.

### Pitfall 4: Rate Limiting and Cost
**What goes wrong:** Each strategy generation calls GPT-4o which costs ~$5-15/1M input tokens. Free-text input allows arbitrarily long prompts.
**Why it happens:** No input sanitization or rate limiting.
**How to avoid:** Truncate user input (max 500 chars). Add rate limiting per wallet address. Cache identical preset+market combinations. Use GPT-4o-mini for simple presets, GPT-4o for free-text.
**Warning signs:** Unexpectedly high API bills; slow responses from throttling.

### Pitfall 5: Node.js Runtime Required
**What goes wrong:** Route handler fails at runtime with gRPC/Buffer errors.
**Why it happens:** Next.js Edge runtime doesn't support Node.js APIs that Injective SDK needs.
**How to avoid:** Add `export const runtime = 'nodejs'` to every route file that uses Injective SDK.
**Warning signs:** Build succeeds but runtime crashes with "Buffer is not defined" or gRPC errors.

### Pitfall 6: Bilingual Output
**What goes wrong:** AI generates English-only explanations for Korean users.
**Why it happens:** System prompt doesn't specify language; GPT defaults to English.
**How to avoid:** Detect user language preference (from browser or app setting). Include language instruction in system prompt: "Respond in Korean" or "Respond in English". The `worstCaseOutcome` and `reasoning` fields should be in the user's language.
**Warning signs:** Korean users seeing English-only proposal explanations.

## Code Examples

### Fetching Spot Market Orderbook Snapshot
```typescript
// src/services/injective/spot.ts
// Source: https://docs.injective.network/developers-native/query-indexer/spot
import { IndexerGrpcSpotApi } from '@injectivelabs/sdk-ts/client/indexer'
import { getNetworkEndpoints } from '@injectivelabs/networks'
import { NETWORK } from '@/utils/constants'

const endpoints = getNetworkEndpoints(NETWORK)
const indexerSpotApi = new IndexerGrpcSpotApi(endpoints.indexer)

export async function fetchSpotMarkets() {
  return await indexerSpotApi.fetchMarkets()
}

export async function fetchOrderbookSnapshot(marketId: string) {
  return await indexerSpotApi.fetchOrderbookV2(marketId)
}

export async function fetchMarketSnapshot(marketId: string): Promise<MarketSnapshot> {
  const [market, orderbook] = await Promise.all([
    indexerSpotApi.fetchMarket(marketId),
    indexerSpotApi.fetchOrderbookV2(marketId),
  ])

  const bestBid = orderbook.buys?.[0]?.price ? Number(orderbook.buys[0].price) : 0
  const bestAsk = orderbook.sells?.[0]?.price ? Number(orderbook.sells[0].price) : 0
  const midPrice = (bestBid + bestAsk) / 2

  return {
    marketId,
    midPrice,
    bestBid,
    bestAsk,
    spread: bestAsk > 0 ? (bestAsk - bestBid) / bestAsk : 0,
    orderbookDepth: {
      bids: orderbook.buys?.length ?? 0,
      asks: orderbook.sells?.length ?? 0,
    },
    baseDecimals: market.baseToken?.decimals ?? 18,
    quoteDecimals: market.quoteToken?.decimals ?? 6,
  }
}
```

### Strategy Generation with AI SDK v6
```typescript
// src/app/api/strategy/route.ts
// Source: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
import { generateText, Output, NoObjectGeneratedError } from 'ai'
import { openai } from '@ai-sdk/openai'
import { strategyProposalSchema } from '@/lib/ai/schemas'
import { buildSystemPrompt, getPromptForIntent } from '@/lib/ai/prompts'
import { fetchMarketSnapshot } from '@/services/injective/spot'
import { validateProposal } from '@/lib/strategy/validator'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { presetId, freeText, source, marketId } = body

    // Fetch market snapshot for context
    const market = await fetchMarketSnapshot(marketId)

    // Build prompt from intent
    const userPrompt = getPromptForIntent(presetId, freeText, source)

    const result = await generateText({
      model: openai('gpt-4o'),
      system: buildSystemPrompt(market),
      prompt: userPrompt,
      output: Output.object({
        schema: strategyProposalSchema,
      }),
    })

    if (!result.output) {
      return NextResponse.json(
        { error: 'Failed to generate strategy proposal' },
        { status: 500 }
      )
    }

    // Post-validate against market reality
    const validation = validateProposal(result.output, market)

    return NextResponse.json({
      proposal: result.output,
      validation,
      market: {
        midPrice: market.midPrice,
        bestBid: market.bestBid,
        bestAsk: market.bestAsk,
      },
    })
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      return NextResponse.json(
        { error: 'AI could not generate a valid strategy', details: error.text },
        { status: 422 }
      )
    }
    throw error
  }
}
```

### Zustand Strategy Store
```typescript
// src/stores/strategyStore.ts
import { create } from 'zustand'
import type { StrategyProposal, ValidationResult } from '@/lib/strategy/types'

interface StrategyState {
  proposal: StrategyProposal | null
  validation: ValidationResult | null
  isGenerating: boolean
  error: string | null

  // Actions
  setProposal: (proposal: StrategyProposal, validation: ValidationResult) => void
  adjustSplitCount: (count: number) => void
  adjustPriceRange: (min: number, max: number) => void
  adjustTotalAmount: (amount: number) => void
  reset: () => void
}

export const useStrategyStore = create<StrategyState>((set, get) => ({
  proposal: null,
  validation: null,
  isGenerating: false,
  error: null,

  setProposal: (proposal, validation) =>
    set({ proposal, validation, isGenerating: false, error: null }),

  adjustSplitCount: (count) => {
    const { proposal } = get()
    if (!proposal) return
    // Recalculate orders with new split count
    // This is a client-side recalculation, not an AI call
    set({
      proposal: { ...proposal, splitCount: count },
    })
  },

  adjustPriceRange: (min, max) => {
    const { proposal } = get()
    if (!proposal) return
    set({
      proposal: { ...proposal, priceRange: { min, max } },
    })
  },

  adjustTotalAmount: (amount) => {
    const { proposal } = get()
    if (!proposal) return
    set({
      proposal: { ...proposal, totalCapitalRequired: amount },
    })
  },

  reset: () =>
    set({ proposal: null, validation: null, isGenerating: false, error: null }),
}))
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `generateObject()` | `generateText()` + `Output.object()` | AI SDK v6 (2025) | generateObject is removed in v6; must use new API |
| Zod v3 only | Zod v3 + v4 supported | AI SDK v6 (2025) | v3 recommended for stability with AI SDK |
| API Routes for AI | Server Actions preferred in AI SDK 6 | 2025 | Route Handlers still work; Server Actions are alternative |
| `json_object` response format | `json_schema` strict mode | OpenAI 2024 | Guarantees schema adherence, not just valid JSON |

**Deprecated/outdated:**
- `generateObject()` / `streamObject()`: Removed in AI SDK v6. Use `generateText` with `output` parameter.
- `CoreMessage` type: Renamed to `ModelMessage` in AI SDK v6.
- `convertToCoreMessages()`: Renamed to `convertToModelMessages()` and now async.
- Injective `IndexerGrpcSpotStream` (v1): Use `IndexerGrpcSpotStreamV2` if streaming is needed.

## Open Questions

1. **Which Injective spot markets to support in MVP?**
   - What we know: INJ/USDT is the primary market. Market IDs differ between testnet and mainnet.
   - What's unclear: Exact market IDs need to be fetched dynamically or configured. Are there other spot markets to support?
   - Recommendation: Start with INJ/USDT only. Fetch market ID dynamically via `fetchMarkets()` and filter by base/quote denom. Store result in a `SUPPORTED_MARKETS` config.

2. **LLM model selection and cost optimization**
   - What we know: GPT-4o has the best structured output support. GPT-4o-mini is 10x cheaper.
   - What's unclear: Whether GPT-4o-mini can reliably produce correct strategy parameters for all 6 preset types.
   - Recommendation: Use GPT-4o for free-text input, GPT-4o-mini for preset-based generation (simpler, more templated). Test during implementation.

3. **User-defined risk thresholds (AI-05)**
   - What we know: AI must refuse strategies exceeding risk thresholds.
   - What's unclear: Where do users define these thresholds? Is it a per-strategy setting or a global profile setting?
   - Recommendation: Start with hardcoded sensible defaults (max 50% deviation from market price, max 80% of available balance). Add user-configurable thresholds as a stretch goal.

4. **Recalculation on parameter adjustment (AI-03)**
   - What we know: Users can adjust price range, amount, split count on the proposal card.
   - What's unclear: Should adjustments trigger a new AI call or use deterministic client-side recalculation?
   - Recommendation: Use deterministic client-side recalculation for parameter adjustments (simple math: redistribute orders evenly across new price range). Only call AI for initial generation. This is faster and cheaper.

5. **Prompt engineering for Injective-specific denominations**
   - What we know: STATE.md flags this as a known blocker needing iteration.
   - What's unclear: How well GPT-4o understands Injective market specifics (denom formats, tick sizes).
   - Recommendation: Don't rely on AI to know Injective specifics. Pass all market metadata (market ID, denoms, decimals, tick sizes, current prices) as structured context in the system prompt. AI only structures the strategy logic; all Injective-specific values come from the API.

## Sources

### Primary (HIGH confidence)
- [AI SDK Core: Generating Structured Data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) - generateText + Output.object API
- [AI SDK v6 Migration Guide](https://ai-sdk.dev/docs/migration-guides/migration-guide-6-0) - Breaking changes from v5
- [AI SDK Core: zodSchema](https://ai-sdk.dev/docs/reference/ai-sdk-core/zod-schema) - Zod integration details
- [Injective Spot Indexer Query Docs](https://docs.injective.network/developers-native/query-indexer/spot) - IndexerGrpcSpotApi methods
- [Injective DEX Example](https://docs.injective.network/developers/dapps/example-dex) - Spot market code patterns

### Secondary (MEDIUM confidence)
- [AI SDK npm package](https://www.npmjs.com/package/ai) - v6.0.116 confirmed current
- [@ai-sdk/openai npm](https://www.npmjs.com/package/@ai-sdk/openai) - v3.0.41 confirmed current
- [Zod npm](https://www.npmjs.com/package/zod) - v4.3.6 current, v3.23 recommended for AI SDK compat
- [Vercel AI SDK 6 Announcement](https://vercel.com/blog/ai-sdk-6) - Architecture changes

### Tertiary (LOW confidence)
- GPT-4o-mini vs GPT-4o structured output reliability comparison -- based on general knowledge, not benchmarked for this specific use case
- Injective orderbook depth/liquidity characteristics on testnet -- may differ significantly from mainnet

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - AI SDK v6 is well-documented, confirmed current; Injective SDK already in project
- Architecture: HIGH - Route Handler + Zod schema pattern is standard, well-documented
- Pitfalls: MEDIUM - Injective decimal handling and market ID issues verified via docs; bilingual/cost pitfalls based on general experience
- Market data integration: MEDIUM - IndexerGrpcSpotApi methods confirmed but exact response shapes for v1.18.8 not fully verified

**Research date:** 2026-03-16
**Valid until:** 2026-04-15 (30 days -- AI SDK and Injective SDK are stable)
