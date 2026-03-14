# Project Research Summary

**Project:** AI-powered consumer trading agent on Injective blockchain
**Domain:** DeFAI (Decentralized Finance + AI) — intent-based trading
**Researched:** 2026-03-14
**Confidence:** MEDIUM

## Executive Summary

This product is a consumer-facing AI trading assistant on the Injective blockchain — a "DeFAI" application that converts natural language trading intent into structured, user-approved on-chain strategies. The recommended architecture is a Backend-for-Frontend (BFF) with a thin server handling LLM API integration, strategy validation, and delegated execution, while the frontend connects directly to the Injective Indexer for real-time market data. The full TypeScript stack (Next.js 16, AI SDK 6, @injectivelabs/sdk-ts) is purpose-built for this product: AI SDK's `needsApproval` flag maps directly to the human-in-the-loop requirement, Injective's native subaccount/AuthZ system provides the bounded delegation model, and Turbopack/React 19.2 deliver the fast iteration speed a 1-2 person team needs.

The recommended product approach is two-mode execution: direct signing (user approves each transaction via wallet) as the v1 launch mode, and subaccount delegation (server holds AuthZ grants, executes without per-tx signing) as the v1.x differentiator. This is NOT a chat bot, NOT a trading dashboard, and NOT an autonomous trading agent — it is a "goal-based intent → AI structuring → user-approved execution" flow. The Toss-style card UI (simple, single-screen, mobile-first) and strict anti-features (no market prediction, no real-time chat, no complex charts) are as important as the features that are included.

The primary risks are technical and product-scoped. Technically: LLM hallucination producing bad trade parameters, Cosmos SDK sequence number collisions in multi-step strategies, and over-permissioned key management in delegation mode. These must be addressed at infrastructure layer before any user-facing features ship. Product-wise: the biggest risk is scope creep into a general-purpose trading platform (supporting all Injective markets, all order types, perpetuals) before the core spot trading flow is validated. The MVP must be aggressively scoped — spot markets only, 5-8 pre-built intents, direct signing only — and expand based on actual user behavior.

## Key Findings

### Recommended Stack

The stack is anchored by Next.js 16 (full-stack, single deployment unit — ideal for a 1-2 person team), AI SDK 6 (ToolLoopAgent + `needsApproval` for human-in-the-loop), and `@injectivelabs/sdk-ts` 1.18.x (official TypeScript SDK, actively maintained through March 2026). Database layer is PostgreSQL via Neon/Supabase with Drizzle ORM and Upstash Redis for caching and rate limiting. Critical negative findings: do not use `@injectivelabs/wallet-ts` (deprecated), `iAgent` Python SDK (wrong architecture for web app), or LangChain.js (over-abstracted for this use case). Persistent strategy execution (Phase 2+) requires a long-running worker process on Railway/Fly.io alongside the Vercel frontend, because serverless functions time out before strategy monitoring completes.

**Core technologies:**
- Next.js 16 + React 19.2: Full-stack framework — single deployable for 1-2 person team, Turbopack default, React Compiler eliminates manual memoization
- AI SDK 6 (@ai-sdk/anthropic): LLM orchestration — ToolLoopAgent + `needsApproval` maps directly to human-in-the-loop product requirement
- @injectivelabs/sdk-ts 1.18.x: Blockchain layer — official SDK, covers spot/derivatives/subaccounts/AuthZ, TypeScript-native
- @injectivelabs/wallet-strategy 1.15.x: Wallet abstraction — unified interface for Keplr, MetaMask, Leap, Ledger; replaces deprecated wallet-ts
- Drizzle ORM 0.45.x + PostgreSQL: Data persistence — TypeScript-native, SQL-like queries, works with serverless connection pooling
- Upstash Redis: Caching + rate limiting — HTTP-based, works in serverless/edge, free tier sufficient for MVP
- shadcn/ui + Tailwind CSS 4.x: UI layer — full ownership, zero runtime overhead, Toss-style customization
- Zustand: Client state — lightweight, no boilerplate; server state via React Query/SWR

### Expected Features

**Must have (table stakes):**
- Wallet connection (Keplr + MetaMask) — cannot trade without it; do not force before browsing
- Goal-based entry points (5-8 pre-built intents) — the front door of the product; must be visible on landing
- Natural language intent input — free text as alternative to goal cards; single sentence, not conversation
- AI strategy structuring + proposal UI — the trust-building moment; show orders, prices, capital committed, worst-case
- Direct signing execution — user signs batched orders via wallet; MsgBatchUpdateOrders for multi-order strategies
- Position/strategy status display — active orders, fill status, P&L; one card per strategy, not a terminal
- Basic risk guardrails — hard cap on strategy capital (max 30%), mandatory stop-loss on leveraged positions; enforced by default
- Strategy cancellation — cancel unfilled orders; "cancel all" button visible on every active strategy

**Should have (competitive differentiators):**
- Subaccount delegation mode — the core differentiator; Injective-native bounded automation using AuthZ; no per-tx signing after initial grant setup
- Execution-aware parameter recommendation — AI checks live orderbook depth, spread, and volatility to flag unrealistic parameters
- Composite multi-order strategies — single intent maps to multiple coordinated orders (DCA, scale-in, bracket)
- Progressive trust building — direct → delegation transition triggered after N successful strategies
- Contextual strategy suggestions — AI suggests strategies based on current portfolio state

**Defer (v2+):**
- Cross-chain support — Injective-only until PMF proven
- Social/copy trading with vaults — separate product requiring vault smart contracts
- Advanced analytics dashboard — link to Helix/TradingView instead
- Mobile PWA — responsive web first
- Autonomous rebalancing — requires delegation maturity

### Architecture Approach

The recommended architecture is a Backend-for-Frontend (BFF) where the server owns LLM integration, strategy validation, and delegated execution (server-held AuthZ grants), while the browser connects directly to the Injective Indexer for high-frequency market data streaming. This split is driven by security requirements (LLM API keys and delegated private keys must stay server-side), performance (proxying orderbook streams through the backend adds unnecessary latency), and simplicity (the frontend uses established gRPC-web patterns that Injective Indexer already supports). The core architectural invariant is the Human-in-the-Loop Proposal Pattern: LLM output always flows through Strategy Engine validation and becomes a user-approved proposal before any on-chain action. The LLM is never an executor.

**Major components:**
1. Intent Parser (server) — converts NL text or goal selection into structured strategy JSON using LLM with Zod schema validation
2. Strategy Engine (server) — validates LLM output against market state, sizes positions, applies risk bounds, generates order parameters
3. Execution Manager (server) — constructs Injective Msgs, handles direct signing (returns unsigned msgs to client) and delegated execution (MsgExec with server key)
4. Wallet Service (client) — @injectivelabs/wallet-strategy wrapper; handles Keplr/MetaMask connection, signing, AuthZ grant transactions
5. Market Data Stream Manager (client) — direct gRPC-web connection to Injective Indexer; orderbook, position, and trade streams with reconnection logic
6. State Store (server) — PostgreSQL for strategy state, execution history, and user preferences; must persist through crashes for multi-step strategy recovery

**Key patterns:**
- Human-in-the-Loop Proposal: Every strategy → proposal → user approval → execution. Non-negotiable.
- Bounded Delegation Model: AuthZ grants scoped to specific Msg types and markets, time-expiring, user-revocable at any time
- Structured LLM Output with Validation: Zod schemas for all trade parameters; Strategy Engine validates against market reality before proposal
- Subaccount Isolation: Dedicated non-default subaccount (index 1+) for delegated operations; user deposits bounded amount

### Critical Pitfalls

1. **LLM hallucination producing invalid trade parameters** — The LLM must never have direct execution authority. All output flows through deterministic validation (market ID whitelist, quantity ranges, price within N% of market). This is a safety system, not a feature. Build it before any user-facing work.

2. **Cosmos SDK account sequence mismatch** — Concurrent transactions from the same account fail with sequence errors, causing partial strategy execution. Use `MsgBatchUpdateOrders` to reduce multi-step strategies to single transactions. Build a transaction sequencer that serializes outbound transactions per account from day one.

3. **Default subaccount (index 0) gas overhead and fund confusion** — Since Injective v1.10.0, the default subaccount merges with the bank module, costing ~15% more gas. Developers confuse bank balance vs. exchange subaccount deposit, causing "insufficient funds" errors. Use non-default subaccounts for all automated operations and build an explicit fund routing layer.

4. **Over-permissioned key management in delegation mode** — The grantee key must be scoped to minimum necessary Msg types on specific markets, with time expiry, and never stored as plaintext. Design the permission model before writing any transaction code; implement before delegation ships.

5. **Partial strategy execution without recovery** — Multi-step strategies have no `ROLLBACK`. If step 2 fails after step 1 succeeds, the user is left in an unintended state. Implement strategy state machines with explicit states and one-click recovery paths. Store state persistently (not in memory).

## Implications for Roadmap

Based on research, the dependency chain is clear: chain connectivity before strategy logic, strategy logic before AI intent parsing, AI parsing before delegation. The pitfall analysis reinforces this — the transaction pipeline must be solid before AI is layered on top. Scope must be locked at spot markets + 2 order types before any feature work begins.

### Phase 1: Core Infrastructure and Transaction Pipeline

**Rationale:** The blockchain plumbing must work reliably before AI or UI work begins. Pitfalls 1-4 all require foundational decisions made here. The chain client, execution manager, and fund routing layer are prerequisites for everything else. Build and validate the full transaction pipeline WITHOUT AI first (hardcoded test intent → validate → sign → broadcast → confirm).
**Delivers:** Working end-to-end transaction flow on Injective testnet; wallet connection; subaccount setup and fund routing; gas estimation; sequence number management; basic position queries
**Addresses:** Wallet connection (table stake), basic risk guardrails (design), strategy cancellation (cancel msgs)
**Avoids:** Account sequence mismatch (transaction sequencer), default subaccount gas overhead (use index 1+ from day one), over-permissioned key design (permission model established here)
**Research flag:** LOW — well-documented SDK patterns; official Injective docs are high confidence; no additional phase research needed

### Phase 2: AI Intent Layer and Core User Flow

**Rationale:** With reliable transaction execution proven, add the AI intent parsing and strategy proposal UI. This validates the core product hypothesis: do users execute AI-structured strategies? Direct signing only in this phase — delegation is a v1.x differentiator, not MVP. Scope: 5-8 preset goal intents + free text, spot markets only, 2 order types (market + limit).
**Delivers:** Goal-based entry points, natural language intent input, AI strategy structuring (LLM + Strategy Engine), strategy proposal UI (Toss-style card), direct signing execution, basic position/strategy status display
**Uses:** AI SDK 6 ToolLoopAgent with `needsApproval`, @ai-sdk/anthropic (Claude Sonnet 4), Zod schemas for structured LLM output
**Implements:** Intent Parser, Strategy Engine (validation + position sizing), Presentation Layer (core flows)
**Avoids:** LLM hallucination (validation layer from Phase 1 design is implemented here), scope creep (spot + 2 order types only)
**Research flag:** MEDIUM — LLM prompt engineering for financial strategies requires iteration; prompt tuning for Injective-specific market IDs and denominations needs validation during implementation

### Phase 3: Delegation Mode and Bounded Automation

**Rationale:** After users have executed strategies via direct signing and trust is established, introduce subaccount delegation — the core product differentiator. The progressive trust building flow (direct → delegation after N successes) is the onboarding mechanism. This phase also introduces composite multi-order strategies now that the basic flow is validated.
**Delivers:** AuthZ grant setup flow (MsgGrant per Msg type), server-side delegated execution (MsgExec with server key), subaccount isolation for delegated funds, delegation revocation, composite multi-order strategies (DCA, scale-in, bracket), progressive trust building UX
**Implements:** Wallet Service (AuthZ grants), Execution Manager (delegated path, MsgBroadcasterWithPk), grant lifecycle monitoring
**Avoids:** Over-permissioned keys (minimum grants, scoped to markets, time-expiring), partial execution without recovery (strategy state machines with persistent state)
**Research flag:** HIGH — AuthZ delegation lifecycle has edge cases around grant expiry, revocation during active strategies, and market-level scoping; recommend `/gsd:research-phase` before implementation

### Phase 4: Intelligence Layer and Execution Quality

**Rationale:** Once users are executing strategies (direct and delegated), add the intelligence that improves execution quality: real-time orderbook analysis for parameter recommendations, contextual strategy suggestions based on portfolio state, and market data streaming for responsive position monitoring.
**Delivers:** Execution-aware parameter recommendations (live orderbook depth, spread, volatility analysis), contextual strategy suggestions (portfolio-state-aware), real-time market data streaming (OrderbookStreamCallback, position updates), LLM cost optimization (model routing for simple vs. complex intents, semantic caching)
**Implements:** Market Data Stream Manager (with reconnection logic), stream subscriptions via IndexerGrpcSpotStream
**Avoids:** LLM cost explosion (model routing architecture, semantic caching, per-request cost tracking), polling orderbook on every request (streaming replaces polling)
**Research flag:** MEDIUM — gRPC stream reconnection patterns need validation; market data staleness detection thresholds need empirical tuning

### Phase Ordering Rationale

- **Infrastructure before AI:** The transaction pipeline must be reliable before intent parsing is layered on top. A hallucinated LLM parameter going through a broken execution layer doubles the damage.
- **Direct signing before delegation:** Users must trust the system via manual approval before delegating authority. Also, AuthZ delegation requires a signed MsgGrant transaction — users must have completed at least one direct-signing session.
- **Core flow before intelligence:** Execution-aware recommendations require live market data integration that adds system complexity. Validate the intent → execute flow with simpler heuristics first.
- **Spot-only before perpetuals:** Feature research explicitly recommends shipping spot markets alone for MVP. Perpetuals add derivative-specific risk logic, funding rate handling, and margin management — a separate engineering track.
- **Pitfalls 1-4 are all Phase 1 constraints:** The sequencer, subaccount architecture, validation layer, and permission model design must all be established before Phase 2 begins. These are not optional safety enhancements; they are foundational.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Delegation Mode):** AuthZ grant lifecycle has documented edge cases; grant expiry during active strategy execution is a specific failure mode not covered in official docs; recommend `/gsd:research-phase` with focus on MsgRevoke + MsgExec interaction and subaccount deposit/withdrawal flows during active delegation
- **Phase 4 (Intelligence Layer):** IndexerGrpcSpotStream reconnection behavior on node restart/upgrade is underdocumented; staleness thresholds and backpressure handling need empirical validation

Phases with standard patterns (skip research-phase):
- **Phase 1 (Core Infrastructure):** Injective SDK integration patterns are well-documented with official examples; chain client initialization, MsgBatchUpdateOrders, and MsgBroadcaster are high-confidence patterns
- **Phase 2 (AI Intent Layer):** AI SDK 6 ToolLoopAgent patterns are well-documented; the Zod-schema → structured output → validation pipeline is established; main unknowns are domain-specific prompt tuning (iterate during implementation, not pre-planned)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core technologies verified via npm (sdk-ts 1.18.3 published March 2026), official docs, and AI SDK 6 release notes. Version compatibility matrix validated. Only gaps: Upstash Redis pricing tiers (MEDIUM) and specific Next.js 16 / Injective SDK interaction patterns (untested). |
| Features | MEDIUM | Table stakes derived from competitor analysis (Bybit AI Skills, Velvet, 3Commas, Injective MCP Server) and official Injective ecosystem announcements. Anti-features and MVP scope are opinionated recommendations, not confirmed by user research. Delegation as differentiator is a hypothesis until validated with real users. |
| Architecture | MEDIUM | BFF architecture and component boundaries are well-reasoned from first principles and SDK capabilities. AuthZ delegation lifecycle and edge cases (grant expiry during execution, subaccount isolation for complex strategies) are MEDIUM confidence — documented patterns exist but implementation specifics need validation. Streaming reconnection patterns are LOW confidence. |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls (LLM hallucination, sequence mismatch, subaccount gas) are verified against official Injective docs and real-world incident reports. LLM cost projections are estimates based on current API pricing. Security recommendations are grounded in documented vulnerabilities but specific exploit vectors depend on deployment configuration. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **AuthZ grant expiry and lifecycle edge cases:** What happens when a grant expires during an active multi-step strategy? What is the user experience for grant renewal? Needs validation during Phase 3 planning — recommend `/gsd:research-phase` at that point.
- **Prompt engineering for Injective-specific strategies:** The LLM must correctly interpret Injective market IDs, denominations (peggy0x... tokens), and subaccount concepts. This requires domain-specific few-shot examples and adversarial testing that can only be developed during Phase 2 implementation.
- **Serverless function timeout limits for strategy monitoring:** Vercel functions have 30s timeouts; strategy monitoring for multi-order strategies may exceed this. Architecture research recommends a separate long-running worker for Phase 2+, but the exact threshold where this becomes necessary is unknown until usage patterns emerge.
- **User research on delegation UX:** The progressive trust building model (direct signing → delegation after N successes) is a hypothesis. The actual threshold for delegation adoption and the UX required to explain AuthZ grants to non-technical users needs validation with real users.
- **Gas estimation variability:** Injective gas costs vary significantly by operation type. Fixed gas is explicitly flagged as a technical debt shortcut to avoid. The correct approach (simulation before broadcast) needs validation for all strategy types.

## Sources

### Primary (HIGH confidence)
- [@injectivelabs/sdk-ts npm](https://www.npmjs.com/package/@injectivelabs/sdk-ts) — v1.18.3, last published March 2026
- [@injectivelabs/wallet-strategy npm](https://www.npmjs.com/package/@injectivelabs/wallet-strategy) — v1.15.5, actively maintained
- [Injective TypeScript monorepo (GitHub)](https://github.com/InjectiveLabs/injective-ts) — package structure and maintenance status
- [Injective Exchange Module Messages](https://docs.injective.network/developers/modules/injective/exchange/05_messages) — all Msg types for trading
- [Injective AuthZ Examples](https://docs.injective.network/developers-native/examples/authz) — MsgGrant/MsgExec/MsgRevoke patterns
- [Injective Exchange Examples](https://docs.injective.network/developers-native/examples/exchange) — order creation and subaccount patterns
- [Injective Trading Account Docs](https://docs.injective.network/developers/concepts/trading-account) — subaccount mechanics, default subaccount merge
- [AI SDK 6 announcement](https://vercel.com/blog/ai-sdk-6) — ToolLoopAgent, needsApproval, DevTools (Dec 2025)
- [AI SDK docs](https://ai-sdk.dev/docs/introduction) — streaming and tool calling patterns
- [Next.js 16 announcement](https://nextjs.org/blog/next-16) — Turbopack default, React 19.2, proxy.ts (Oct 2025)
- [Drizzle ORM npm](https://www.npmjs.com/package/drizzle-orm) — v0.45.1
- [shadcn/ui Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4) — compatibility confirmed
- [Cosmos SDK Sequence Issue](https://github.com/cosmos/cosmos-sdk/issues/13009) — nonce/sequence concurrency limitation
- [Injective Blog: Transactions and Accounts](https://injective.com/blog/from-wallet-to-chain-understanding-transactions-and-accounts-on-injective) — sequence number mechanics

### Secondary (MEDIUM confidence)
- [Injective MCP Server announcement](https://injective.com/blog/introducing-the-injective-mcp-server) — competitor feature analysis
- [iAgent 2.0 announcement](https://blog.injective.com/iagent-2-0-powering-the-next-generation-of-ai-agents-on-injective-2/) — Injective AI ecosystem context
- [Velvet Capital docs](https://docs.velvet.capital/) — competitor feature analysis
- [3Commas risk management guide](https://3commas.io/blog/ai-trading-bot-risk-management-guide-2025) — risk guardrail patterns
- [Injective Indexer API Concepts](https://docs.injective.network/developers/concepts/indexer-api) — streaming architecture
- [Injective DEX Example](https://docs.injective.network/developers/dapps/example-dex) — StreamManagerV2 pattern
- [Hummingbot Injective Connector](https://hummingbot.org/exchanges/injective/) — gas estimation multiplier, subaccount patterns
- [iAgent GitHub](https://github.com/InjectiveLabs/iAgent) — reference AI agent architecture (Python, rejected for this use case)
- [BizTech: LLM Hallucinations Financial Implications](https://biztechmagazine.com/article/2025/08/llm-hallucinations-what-are-implications-financial-institutions) — $250M annual hallucination loss data
- [DL News: AI agents in crypto trading](https://www.dlnews.com/articles/defi/ai-agents-are-terrible-at-trading-crypto-but-that-could-change/) — AI agent failure modes
- [Upstash Redis pricing](https://upstash.com/docs/qstash/overall/compare) — serverless Redis, free tier details

### Tertiary (LOW confidence)
- [Intent-based UX in DeFi](https://tde.fi/founder-resource/blogs/user-experience/how-intent-based-ux-can-transform-in-defi-platforms/) — industry UX patterns
- [DeFAI ecosystem overview](https://www.ledger.com/academy/topics/defi/defai-explained-how-ai-agents-are-transforming-decentralized-finance) — ecosystem context
- [TradingAgents: Multi-Agent LLM Framework](https://arxiv.org/abs/2412.20138) — AI trading agent architecture patterns (academic, not Injective-specific)
- [Bybit AI Skills launch](https://www.chainbits.com/press-releases/bybit-launches-ai-skills-powering-ai-agents-for-crypto-trading-with-zero-setup-253-api-endpoints-and-growing/) — competitor analysis (press release)

---
*Research completed: 2026-03-14*
*Ready for roadmap: yes*
