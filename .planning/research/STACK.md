# Stack Research

**Domain:** AI-powered consumer trading agent on Injective blockchain
**Researched:** 2026-03-14
**Confidence:** MEDIUM (Injective SDK ecosystem verified via npm/GitHub; AI SDK verified via official docs; some version pinning based on latest available data)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.x | Full-stack framework (frontend + API routes) | Latest stable (Oct 2025). Turbopack default bundler for fast dev. App Router with React 19.2. Cache Components for hybrid static/dynamic. proxy.ts for request interception. 1-2 person team benefits from single deployable unit vs separate frontend/backend. |
| React | 19.2 | UI rendering | Ships with Next.js 16. View Transitions for smooth page animations (trading UX). Activity component for background state preservation. React Compiler for automatic memoization (no manual useMemo). |
| TypeScript | 5.x | Type safety | Required by Next.js 16 (min 5.1.0). Critical for trading apps where type errors = financial errors. Injective SDK is TypeScript-native. |
| Tailwind CSS | 4.x | Styling | CSS-first config (no tailwind.config.js). Auto content detection. 70% smaller production CSS vs v3. Perfect for rapid UI iteration on trading screens. |

### Injective Blockchain Layer

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @injectivelabs/sdk-ts | 1.18.x | Core SDK for chain interaction | Official TypeScript SDK. Covers trading (spot, derivatives), subaccounts, bank, exchange queries. Works in browser + Node.js + React Native. Actively maintained (last publish: March 2026). |
| @injectivelabs/wallet-strategy | 1.15.x | Wallet connection abstraction | Replaces deprecated @injectivelabs/wallet-ts. Unified interface for Keplr, Metamask, Leap, Ninji, Cosmostation, Ledger, Trezor. Single ConcreteStrategy interface -- swap wallets without code changes. |
| @injectivelabs/networks | 1.14.x+ | Network endpoint configuration | Provides Mainnet/Testnet endpoints. Single import for all RPC/gRPC/REST URLs. Version should match sdk-ts release cycle. |
| @injectivelabs/ts-types | 1.15.x | Shared type definitions | Required peer dependency. Enums for ChainId, wallet types, order types. Keep version aligned with sdk-ts. |
| @injectivelabs/utils | latest | Utility functions | BigNumber handling, address conversion, denomination utilities. Critical for correct decimal handling in financial operations. |

### AI / LLM Integration Layer

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| AI SDK (Vercel) | 6.x | LLM orchestration + streaming | Latest major (Dec 2025). ToolLoopAgent for agentic tool execution loops. Human-in-the-loop approval via needsApproval flag (maps directly to "bounded automation" requirement). SSE streaming for real-time chat UX. Provider-agnostic -- swap Claude/GPT without code changes. |
| @ai-sdk/anthropic | latest | Claude provider for AI SDK | Claude Sonnet 4 as primary model. Best-in-class tool use with fine-grained streaming. Excellent at structured output + reasoning for intent interpretation. |
| @ai-sdk/openai | latest | OpenAI provider (fallback) | GPT-4o as backup model. Useful if Claude rate-limited. AI SDK makes provider swapping trivial. |

### Database + State

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| PostgreSQL | 16+ | Primary database | Stores user profiles, strategy configs, execution history, AI conversation logs. JSONB for flexible strategy parameters. Row-level security for multi-user isolation. |
| Drizzle ORM | 0.45.x | Database access + migrations | TypeScript-native ORM with zero abstraction overhead. SQL-like queries (no magic). Drizzle Kit for schema migrations. Works with serverless (connection pooling via Neon/Supabase). |
| Upstash Redis | - | Caching + rate limiting | HTTP-based Redis (works in serverless/edge). Rate limit AI API calls. Cache market data. Session management. Free tier: 500K commands/month sufficient for MVP. |

### UI Components

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| shadcn/ui | latest | Component library | Not a dependency -- copies source into your project. Full ownership, zero runtime overhead. Tailwind-native. Radix primitives for accessibility. Customizable for trading-specific components. |
| Framer Motion | 11.x | Animation | Smooth transitions for trading UX. Order placement feedback, portfolio value changes, strategy activation states. View Transitions API integration with React 19.2. |
| Recharts | 2.x | Chart rendering | Lightweight charting for portfolio performance, P&L visualization. Built on D3 + React. Sufficient for consumer-grade displays (not TradingView-level). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Turbopack | Bundler (default in Next.js 16) | 2-5x faster builds, 10x faster HMR. No config needed. |
| Biome | Linting + formatting | Next.js 16 removed `next lint`. Biome replaces ESLint + Prettier in one tool. Faster than ESLint. |
| drizzle-kit | Database migrations | `drizzle-kit push` for dev, `drizzle-kit generate` for production migrations. |
| @ai-sdk/devtools | AI debugging | Inspect LLM calls, token usage, timing. Essential for tuning intent interpretation prompts. |

## Installation

```bash
# Core framework
npm install next@latest react@latest react-dom@latest

# Injective blockchain
npm install @injectivelabs/sdk-ts @injectivelabs/wallet-strategy @injectivelabs/networks @injectivelabs/ts-types @injectivelabs/utils

# AI SDK
npm install ai @ai-sdk/anthropic @ai-sdk/openai

# Database
npm install drizzle-orm postgres
npm install @upstash/redis @upstash/ratelimit

# UI
npm install framer-motion recharts
npx shadcn@latest init

# Dev dependencies
npm install -D typescript @types/react @types/node drizzle-kit @biomejs/biome @ai-sdk/devtools
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 16 | Separate React SPA + Express backend | Never for a 1-2 person team. Doubles deployment complexity, CORS config, auth duplication. Only consider if team grows to 5+ and needs independent scaling. |
| Next.js 16 | Next.js 15 | Only if a critical dependency breaks on v16. Check before starting -- most ecosystem has migrated. |
| AI SDK 6 | LangChain.js | If you need complex multi-agent orchestration with memory, retrieval chains, or vector store integration. AI SDK is simpler and better for our use case (intent -> tools -> execution). LangChain adds unnecessary abstraction. |
| AI SDK 6 | Direct Anthropic/OpenAI API calls | Never. AI SDK handles streaming, tool loops, provider switching, and UI integration. Raw API calls mean reimplementing all of this. |
| Claude Sonnet 4 | GPT-4o | If Claude's tool use doesn't handle Injective-specific schemas well. Test both during development -- AI SDK makes swapping trivial. |
| Drizzle ORM | Prisma | If you need more mature migration tooling or prefer declarative schema. Prisma generates a heavier client and is slower at runtime. Drizzle is closer to SQL which is better for complex trading queries. |
| Upstash Redis | Self-hosted Redis + BullMQ | If you need persistent background job queues (strategy monitoring, scheduled rebalancing). BullMQ requires a long-running Node.js process -- not compatible with pure serverless. Consider this for Phase 2+ when adding persistent strategy execution. |
| PostgreSQL (Neon/Supabase) | SQLite (Turso) | If costs matter more than features. Turso is cheaper but lacks JSONB, full-text search, and row-level security that strategy storage benefits from. |
| shadcn/ui | Ant Design / Material UI | Never for a trading app targeting Korean market (Toss-style). These have opinionated, enterprise-heavy designs that fight against minimal consumer UX. shadcn gives you full control. |
| Recharts | TradingView Lightweight Charts | If users demand professional-grade candlestick charts. Add this later as a differentiator, not MVP. Recharts covers portfolio visualization needs. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| @injectivelabs/wallet-ts | **Deprecated.** Last published a year ago. Replaced by wallet-strategy. | @injectivelabs/wallet-strategy |
| @injectivelabs/sdk-ui-ts | Deprecated UI utilities. Tightly coupled to Vue.js (Helix uses Nuxt). | Build your own React hooks wrapping sdk-ts directly. |
| iAgent SDK (Python) | Python-only. OpenAI-only. Server-side agent framework, not a consumer product SDK. Architecture doesn't fit a web app. | Build your own tool definitions using AI SDK 6 + @injectivelabs/sdk-ts. You get better model flexibility (Claude + GPT), TypeScript type safety, and streaming UI integration. |
| Injective Trader framework | Backend automation framework for algo traders. YAML config-based. Not designed for consumer UX with AI intent layer. | Use sdk-ts directly for order execution. Wrap in AI SDK tools for intent-to-action pipeline. |
| LangChain.js | Over-abstracted for this use case. Adds complexity without value when AI SDK 6 handles tool loops natively. Memory/retrieval chains not needed for intent interpretation. | AI SDK 6 with ToolLoopAgent. |
| Redux / Redux Toolkit | Overkill for a 1-2 person team. Trading state is mostly server-side (on-chain). Client state is minimal (UI state, wallet connection). | Zustand for global client state (wallet, UI preferences). React Query / SWR for server state. |
| Webpack | Next.js 16 defaults to Turbopack. Webpack is the fallback, not the primary. Only use if Turbopack breaks a specific dependency. | Turbopack (zero config). |
| middleware.ts | Deprecated in Next.js 16. Will be removed in future version. | proxy.ts (same API, renamed). |
| Bull (not BullMQ) | Predecessor to BullMQ. No longer maintained. | BullMQ if you need job queues (Phase 2+). |

## Stack Patterns by Variant

**If MVP (Phase 1 -- intent interpretation + direct signing):**
- Full serverless: Next.js API routes + Upstash Redis + Neon PostgreSQL
- Deploy on Vercel (free tier covers MVP traffic)
- No background workers needed -- all operations are request/response
- Because: Minimizes infrastructure management for 1-2 person team

**If adding persistent strategy execution (Phase 2+):**
- Add a long-running Node.js process for strategy monitoring
- BullMQ + Redis (not Upstash) for job scheduling
- Deploy worker on Railway/Fly.io alongside Vercel frontend
- Because: Serverless functions have 30s timeout limits -- strategy monitoring needs persistent connections to Injective gRPC streams

**If adding subaccount delegation (Phase 2+):**
- Backend-only execution path (no user signing per trade)
- Secure key management: environment variables for MVP, Vault/KMS for production
- Separate execution service from web frontend
- Because: Delegated trading requires server-side signing -- must isolate from frontend for security

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 16.x | React 19.2, Node.js 20.9+ | React 19.2 ships with Next.js 16. Do not use React 18. |
| @injectivelabs/sdk-ts 1.18.x | @injectivelabs/networks 1.14.x+, @injectivelabs/ts-types 1.15.x | Injective packages are versioned from the same monorepo. Use versions from the same release window. |
| AI SDK 6.x | @ai-sdk/anthropic latest, @ai-sdk/openai latest | Provider packages follow AI SDK major version. Always use latest within the 6.x range. |
| Drizzle ORM 0.45.x | postgres (pg driver), drizzle-kit 0.30.x+ | Use `postgres` package (not `pg`) for better performance with Drizzle. |
| Tailwind CSS 4.x | Next.js 16, shadcn/ui latest | shadcn/ui has explicit Tailwind v4 support. No additional PostCSS config needed. |

## Critical Implementation Notes

### Injective SDK in Browser vs Server

The Injective SDK works in both browser and Node.js, but streaming (gRPC) has limitations in browsers:
- **Browser:** Can use REST API and unary gRPC-Web calls. Server-side streaming works via gRPC-Web text mode. No client-side streaming.
- **Server (API routes):** Full gRPC support including bidirectional streaming. Use this for real-time orderbook data.
- **Recommendation:** Fetch market data server-side (API routes or server components), pass to client via SSE or polling. Do NOT attempt browser-direct gRPC streaming for production.

### Subaccount Architecture

Injective subaccounts are derived from the main address (index 0 = default). Key points:
- Each address can have unlimited subaccounts
- Subaccounts isolate funds for trading
- Account delegation allows one address to trade using another's subaccount funds
- This maps to the product's "bounded automation" -- user delegates specific subaccount to the agent backend

### AI Tool Definition Strategy

Define Injective operations as AI SDK tools:
```typescript
// Example: Define trading tools for AI SDK 6
const tools = {
  placeSpotOrder: tool({
    description: 'Place a spot market or limit order on Injective',
    parameters: z.object({
      market: z.string().describe('Market ID or symbol like INJ/USDT'),
      side: z.enum(['buy', 'sell']),
      type: z.enum(['market', 'limit']),
      quantity: z.number(),
      price: z.number().optional(),
    }),
    needsApproval: true, // Human-in-the-loop for all trades
    execute: async ({ market, side, type, quantity, price }) => {
      // Use @injectivelabs/sdk-ts to construct and broadcast tx
    },
  }),
};
```

This maps the AI SDK's `needsApproval` directly to the product requirement of "bounded automation with user-approved scope."

## Sources

- [@injectivelabs/sdk-ts npm](https://www.npmjs.com/package/@injectivelabs/sdk-ts) -- v1.18.3, last published March 2026 (HIGH confidence)
- [@injectivelabs/wallet-strategy npm](https://www.npmjs.com/package/@injectivelabs/wallet-strategy) -- v1.15.5, actively published (HIGH confidence)
- [Injective TypeScript monorepo](https://github.com/InjectiveLabs/injective-ts) -- verified active maintenance (HIGH confidence)
- [Injective Trading Account docs](https://docs.injective.network/developers/concepts/trading-account) -- subaccount concepts (MEDIUM confidence, docs may have reorganized)
- [Injective Wallet Strategy docs](https://docs.injective.network/developers-native/wallets/strategy) -- wallet integration patterns (MEDIUM confidence)
- [Injective iAgent GitHub](https://github.com/InjectiveLabs/iAgent) -- Python-only, OpenAI-only, evaluated and rejected (HIGH confidence)
- [Injective Trader announcement](https://injective.com/blog/introducing-injective-trader) -- algo trading framework, evaluated and rejected for consumer product (MEDIUM confidence)
- [AI SDK 6 announcement](https://vercel.com/blog/ai-sdk-6) -- Dec 2025, ToolLoopAgent, needsApproval, DevTools (HIGH confidence)
- [AI SDK docs](https://ai-sdk.dev/docs/introduction) -- streaming, tool calling patterns (HIGH confidence)
- [Next.js 16 announcement](https://nextjs.org/blog/next-16) -- Oct 2025, Turbopack default, React 19.2, proxy.ts (HIGH confidence)
- [Drizzle ORM npm](https://www.npmjs.com/package/drizzle-orm) -- v0.45.1 (HIGH confidence)
- [Upstash Redis pricing](https://upstash.com/docs/qstash/overall/compare) -- serverless Redis, free tier details (MEDIUM confidence)
- [shadcn/ui Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4) -- compatibility confirmed (HIGH confidence)

---
*Stack research for: AI-powered consumer trading agent on Injective*
*Researched: 2026-03-14*
