# Feature Research

**Domain:** AI-powered intent-based crypto trading agent on Injective
**Researched:** 2026-03-14
**Confidence:** MEDIUM — based on competitor analysis, Injective docs, and DeFAI ecosystem research

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Wallet connection (Keplr/Metamask)** | Cannot trade without it. Every Injective dApp has this. Users will bounce immediately without seamless connect. | LOW | Use Injective wallet SDK. Support Keplr (primary for Cosmos users) and MetaMask (via EIP-712). Do NOT force connection before browsing — let users explore first, connect when ready to act. |
| **Goal-based entry points** | The core product promise. Without clear "what can I do?" on first screen, users have no idea how to start. Over 75% of DeFi users abandon before first tx. | MEDIUM | Pre-built intent cards: "DCA into INJ", "Set stop-loss on my position", "Scale into dip". These must be visible on landing — not buried in menus. This IS the product's front door. |
| **Natural language intent input** | Bybit, Velvet, and Injective MCP Server all ship NL interfaces in 2026. Users will expect to type what they want. Standard in DeFAI products. | MEDIUM | Free-text input alongside structured goal cards. AI parses into strategy parameters. Keep input simple — single sentence, not chat conversation. |
| **AI strategy structuring + proposal UI** | Users need to see WHAT the AI will do BEFORE execution. Without a clear proposal, no one will trust the system with their funds. | HIGH | The proposal is the trust-building moment. Show: what orders will be placed, at what prices, total capital committed, worst-case outcome. Use "toss-style" card UI — not a table of parameters. |
| **Direct signing execution** | Minimum viable execution path. User approves each transaction via wallet. Every DeFi product has this. | MEDIUM | Injective SDK MsgBatchUpdateOrders for multi-order strategies. User signs once for batched orders. Show clear "you are signing X orders worth Y INJ" confirmation. |
| **Position/strategy status display** | Users MUST be able to check what is happening after execution. "Did my orders fill? What's my P&L?" Without this, the product feels like a black box. | MEDIUM | Show: active orders, fill status, current P&L, remaining unfilled orders. Poll Injective indexer for real-time status. Keep it simple — one card per strategy, not a trading terminal. |
| **Basic risk guardrails** | 3Commas, Gainium, and every serious trading product enforces maximum loss limits. Without guardrails, one bad strategy can wipe a user. Regulatory and trust requirement. | MEDIUM | Hard cap on single-strategy capital (e.g., max 30% of available balance). Mandatory stop-loss on leveraged positions. AI should refuse to structure strategies that risk more than user-defined threshold. These are NOT optional — enforce by default. |
| **Strategy cancellation** | Users must be able to stop an active strategy. Without this, delegation feels terrifying and direct signing feels irreversible. | LOW | Cancel unfilled orders via Injective cancel order msgs. For delegated strategies, revoke subaccount permissions. Show clear "cancel all" button on every active strategy. |

### Differentiators (Competitive Advantage)

Features that set this product apart. Not expected by users, but create the "aha" moment.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Subaccount delegation mode** | THE core differentiator. No other consumer DeFi product uses Injective's subaccount system as a bounded automation layer. Users delegate limited authority (max capital, allowed markets, expiry) to an agent subaccount — the AI executes within those bounds without requiring per-tx signing. This is the "set it and monitor it" mode that turns the product from a fancy order placer into an actual agent. | HIGH | Injective subaccounts are native — no smart contract needed. Use AuthZ for delegation grants. Implement strict caveats: max capital, market whitelist, time expiry, max drawdown. This is technically feasible but UX-complex — users must understand what they are delegating without feeling overwhelmed. |
| **Execution-aware parameter recommendation** | AI doesn't just structure strategy — it checks current orderbook depth, spread, volatility, and funding rates to flag unrealistic parameters. "You want to buy 10K INJ in a $50 range but current spread is $2 — your orders may not fill efficiently." No consumer-facing DeFi product does this well. | HIGH | Requires real-time Injective market data integration (orderbook, trades, funding). LLM analyzes feasibility against market conditions. This is what separates an AI wrapper from an actual trading assistant. |
| **Composite multi-order strategies** | Single intent -> multiple coordinated orders. "DCA into INJ over 5 days" = 5 limit orders at calculated intervals. "Scale into dip" = 3-5 orders at declining price levels with increasing size. Most DeFi UIs are single-order only. | MEDIUM | Use MsgBatchUpdateOrders to place multiple orders atomically. AI determines order spacing, sizing, and price levels. Template library of strategy patterns (DCA, scale-in, bracket, TWAP-like). |
| **Progressive trust building (direct -> delegation)** | New users start with direct signing. After successful executions, the product suggests delegation mode: "You've run 5 strategies successfully. Want to let the agent handle execution automatically within your limits?" This progressive disclosure builds trust gradually — no other product does this transition well. | MEDIUM | Track user execution history. Trigger delegation suggestion after N successful strategies. Show delegation as an upgrade, not a default. Keep direct signing always available as fallback. |
| **Strategy templates with contextual suggestions** | Not just "pick a strategy" — the AI suggests which template based on user's current portfolio and market conditions. "You hold 500 INJ with no stop-loss. Consider: protect your position with a trailing stop." This proactive, contextual suggestion is the differentiator vs. static template libraries. | MEDIUM | Requires reading user's Injective portfolio (balances, positions). AI matches portfolio state to relevant strategy templates. Push-style suggestions on dashboard, not just search. |

### Anti-Features (Deliberately NOT Building)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Autonomous market prediction / alpha generation** | The AI is NOT a hedge fund. Predicting market direction is unreliable, creates false expectations, and invites regulatory scrutiny. Products that promise "AI picks winners" get destroyed when markets turn. The product's value is structuring and executing, not predicting. | AI structures strategies based on user-stated intent. Provide market context (volatility, orderbook depth) for parameter recommendation, NOT directional signals. |
| **Full autonomous trading bot** | "Set it and forget it" autonomous trading requires sophisticated risk management, backtesting infrastructure, and regulatory consideration that a 1-2 person team cannot build safely for v1. One bug in autonomous mode = user funds lost = product dead. | Bounded automation only. Subaccount delegation has hard limits (capital cap, market whitelist, time expiry). User must explicitly approve scope. No open-ended "trade for me." |
| **Real-time chat/conversation UI** | Chat UIs look cool but create terrible UX for trading. Users don't want to have a 5-message conversation to place an order. Chat history becomes noise. Latency in LLM responses frustrates users who want to act NOW. | Single-input intent -> structured proposal -> execute. Three steps max. No conversation history, no back-and-forth. If AI needs clarification, show options to tap, not questions to answer. |
| **Complex trading dashboard / charts** | Target users find trading dashboards intimidating — that's why they're using this product. Building chart views, technical indicators, and order book visualizations duplicates TradingView and existing Injective DEXes. A 1-2 person team cannot out-feature Helix. | Minimal status cards. Link out to Helix or TradingView for users who want depth. The product is about simplifying, not replicating. |
| **Social/copy trading** | Velvet Capital does social trading well with vault infrastructure. Building copy trading requires vault smart contracts, fee distribution, portfolio mirroring, and manager verification. Massive scope for v1. | Focus on single-user intent execution. If social demand emerges post-PMF, consider it for v2 with vault-based architecture. |
| **Cross-chain support** | v1 is Injective-only. Cross-chain adds bridge integration, multi-chain wallet support, and dramatically increases testing surface. Injective MCP Server supports bridging, but consumer UX for cross-chain is a separate product. | Injective-native only. Use Injective's native markets, native subaccounts, native token transfers. Cross-chain is a v2+ expansion after PMF validation. |
| **Mobile app** | Native mobile doubles engineering surface for a 1-2 person team. Mobile wallet connection UX (WalletConnect, deep links) adds significant complexity. | Responsive web app. Optimize for mobile browser. Consider PWA later if mobile usage is high. |
| **Backtesting / paper trading** | Building a backtesting engine requires historical data infrastructure, simulation engine, and result visualization. Significant engineering for uncertain user demand in a consumer product. | Show execution-aware parameter recommendations instead. "Based on recent orderbook depth, your DCA orders would have filled at X price over the last week." This gives users confidence without building full backtesting. |

## Feature Dependencies

```
Wallet Connection
    |
    +---> Goal-Based Entry Points + NL Input
    |         |
    |         +---> AI Strategy Structuring
    |                   |
    |                   +---> Strategy Proposal UI
    |                   |         |
    |                   |         +---> Direct Signing Execution
    |                   |         |         |
    |                   |         |         +---> Position/Strategy Status Display
    |                   |         |         |         |
    |                   |         |         |         +---> Strategy Cancellation
    |                   |         |         |
    |                   |         |         +---> Basic Risk Guardrails (enforced at execution)
    |                   |         |
    |                   |         +---> Subaccount Delegation Mode (alternative execution path)
    |                   |                   |
    |                   |                   +---> Position/Strategy Status Display
    |                   |                   +---> Strategy Cancellation (revoke delegation)
    |                   |
    |                   +---> Execution-Aware Parameter Recommendation (enhances structuring)
    |
    +---> Portfolio Reading (enables contextual suggestions)
              |
              +---> Strategy Templates with Contextual Suggestions
```

### Dependency Notes

- **AI Strategy Structuring requires Wallet Connection:** Must read user balances to set realistic parameters.
- **Subaccount Delegation requires Direct Signing first:** Users need to trust the system via direct signing before delegating. Also, delegation grant itself requires a signed transaction.
- **Execution-Aware Recommendation enhances AI Structuring:** Market data integration improves parameter quality but the core structuring works without it (can use simpler heuristics initially).
- **Contextual Suggestions require Portfolio Reading:** Cannot suggest relevant strategies without knowing user's current positions and balances.
- **Risk Guardrails are enforced at Proposal + Execution:** Not a standalone feature — embedded in the structuring and execution flow.

## MVP Definition

### Launch With (v1.0)

Minimum viable product — validate that users will actually execute AI-structured strategies on Injective.

- [ ] **Wallet connection (Keplr + MetaMask)** — cannot function without it
- [ ] **Goal-based entry points (5-8 preset intents)** — "DCA into INJ", "Set stop-loss", "Scale into dip", "Take partial profit", "Limit buy at discount" — covers 80% of use cases
- [ ] **Natural language intent input** — free text as alternative to preset goals
- [ ] **AI strategy structuring** — parse intent into concrete order parameters (prices, sizes, timing)
- [ ] **Strategy proposal UI** — clear, simple proposal card showing what will happen
- [ ] **Direct signing execution** — user signs batched orders via wallet
- [ ] **Basic position status** — show active orders, fill status, simple P&L
- [ ] **Basic risk guardrails** — max capital per strategy, mandatory stop-loss on leveraged positions
- [ ] **Strategy cancellation** — cancel unfilled orders

### Add After Validation (v1.x)

Features to add once core flow is working and users are executing strategies.

- [ ] **Subaccount delegation mode** — trigger: users repeatedly execute strategies and express desire for automation
- [ ] **Execution-aware parameter recommendation** — trigger: users report orders not filling or getting bad fills
- [ ] **Composite multi-order strategies** — trigger: users request more sophisticated strategy patterns beyond basic DCA/stop-loss
- [ ] **Progressive trust building flow** — trigger: delegation mode is live and needs onboarding
- [ ] **Strategy templates with contextual suggestions** — trigger: enough user data to personalize recommendations

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Cross-chain support** — defer until Injective-native PMF is proven
- [ ] **Social/copy trading with vaults** — defer until user base justifies social features
- [ ] **Advanced analytics dashboard** — defer, link to existing tools instead
- [ ] **Mobile PWA** — defer until mobile web usage data justifies investment
- [ ] **Automated rebalancing** — defer, requires autonomous execution maturity

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Wallet connection | HIGH | LOW | P1 |
| Goal-based entry points | HIGH | MEDIUM | P1 |
| Natural language input | HIGH | MEDIUM | P1 |
| AI strategy structuring | HIGH | HIGH | P1 |
| Strategy proposal UI | HIGH | MEDIUM | P1 |
| Direct signing execution | HIGH | MEDIUM | P1 |
| Basic position status | HIGH | MEDIUM | P1 |
| Basic risk guardrails | HIGH | MEDIUM | P1 |
| Strategy cancellation | MEDIUM | LOW | P1 |
| Subaccount delegation | HIGH | HIGH | P2 |
| Execution-aware recommendation | MEDIUM | HIGH | P2 |
| Composite multi-order strategies | MEDIUM | MEDIUM | P2 |
| Progressive trust building | MEDIUM | LOW | P2 |
| Contextual strategy suggestions | MEDIUM | MEDIUM | P2 |
| Cross-chain support | LOW | HIGH | P3 |
| Social/copy trading | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch — the core intent-to-execution loop
- P2: Should have, add when core is validated — delegation and intelligence layer
- P3: Nice to have, future consideration — expansion features

## Competitor Feature Analysis

| Feature | Bybit AI Skills | Velvet Capital | 3Commas | Injective MCP Server | Our Approach |
|---------|----------------|----------------|---------|----------------------|--------------|
| Natural language input | Yes (ChatGPT/Claude plugin) | Yes (Velvet Unicorn) | No | Yes (via MCP tools) | Yes — single-input intent, not chat |
| Strategy structuring | Limited (single orders) | AI-driven portfolio actions | Template-based bots | Raw tool execution | AI structures multi-order strategies from intent |
| Execution mode | CEX API | On-chain vaults | CEX API | Agent direct execution | Direct signing + subaccount delegation |
| Risk guardrails | Exchange-level limits | Vault-level limits | Stop-loss, drawdown limits | None (developer tool) | Embedded in AI structuring + hard limits |
| Portfolio monitoring | Full exchange dashboard | Vault performance tracking | Multi-exchange dashboard | No UI | Minimal status cards — not a dashboard |
| Delegation/automation | N/A (CEX) | Vault manager model | Bot automation (CEX) | AuthZ delegation | Subaccount bounded delegation — Injective native |
| Target user | Existing Bybit traders | DeFi portfolio managers | Active traders | Developers | Injective holders who find trading complex |
| UX complexity | Medium (plugin-based) | Medium (DeFi-native) | High (power user tool) | High (developer tool) | Low (toss-style simplicity) |

### Competitive Positioning

The product occupies a unique niche: **consumer-simple UX** on **Injective-native infrastructure** with **bounded AI automation**. Bybit targets CEX users, Velvet targets DeFi portfolio managers, 3Commas targets power traders, and Injective MCP Server targets developers. None of these serve the Injective holder who wants to trade smarter without learning to trade.

## KPI/Analytics Instrumentation

Instrumentation is not a user-facing feature but is critical for product decisions. Implement from day one.

| Metric | What to Track | Why It Matters | Implementation |
|--------|---------------|----------------|----------------|
| Strategy execution count | Number of strategies executed per user per week | North star metric — are users actually trading? | Event on successful tx broadcast |
| Intent-to-execution conversion | % of users who enter intent and complete execution | Measures funnel drop-off at each step | Events at: intent entered, proposal viewed, execution confirmed, tx confirmed |
| Repeat usage rate | % of users who execute 2+ strategies in 30 days | PMF signal — are users coming back? | User-level execution history |
| Average strategy value | Mean INJ committed per strategy | Revenue/TVL indicator | Sum of order values per strategy |
| Delegation adoption rate | % of active users who enable delegation mode | Trust signal — is the differentiator working? | Event on delegation grant |
| Delegated TVL | Total INJ in delegation subaccounts | Growth metric for Ninja Labs | Query subaccount balances |
| Strategy cancellation rate | % of strategies cancelled before completion | Quality signal — are AI recommendations good? | Event on cancellation |
| AI proposal acceptance rate | % of AI proposals accepted without modification | AI quality signal | Event on proposal accept/reject/modify |
| Error/revert rate | % of transactions that fail on-chain | Reliability signal | Monitor tx results |
| Time to first execution | Minutes from first visit to first completed strategy | Onboarding efficiency | Timestamp events |

## Sources

- [Bybit AI Skills launch](https://www.chainbits.com/press-releases/bybit-launches-ai-skills-powering-ai-agents-for-crypto-trading-with-zero-setup-253-api-endpoints-and-growing/) — MEDIUM confidence (press release)
- [Injective MCP Server announcement](https://injective.com/blog/introducing-the-injective-mcp-server) — HIGH confidence (official blog)
- [iAgent 2.0 announcement](https://blog.injective.com/iagent-2-0-powering-the-next-generation-of-ai-agents-on-injective-2/) — HIGH confidence (official blog)
- [Velvet Capital docs](https://docs.velvet.capital/) — MEDIUM confidence (official docs)
- [3Commas risk management guide](https://3commas.io/blog/ai-trading-bot-risk-management-guide-2025) — MEDIUM confidence (official blog)
- [Intent-based UX in DeFi](https://tde.fi/founder-resource/blogs/user-experience/how-intent-based-ux-can-transform-in-defi-platforms/) — LOW confidence (industry blog)
- [DeFi user abandonment data](https://www.purrweb.com/blog/blockchain-ux-design/) — LOW confidence (industry blog)
- [MetaMask Delegation Toolkit](https://metamask.io/developer/delegation-toolkit) — MEDIUM confidence (official docs, different chain but pattern is relevant)
- [DeFAI ecosystem overview](https://www.ledger.com/academy/topics/defi/defai-explained-how-ai-agents-are-transforming-decentralized-finance) — MEDIUM confidence (Ledger Academy)
- [Formo web3 analytics](https://formo.so/blog/top-web3-analytics-tools) — LOW confidence (vendor blog)

---
*Feature research for: AI-powered intent-based trading agent on Injective*
*Researched: 2026-03-14*
