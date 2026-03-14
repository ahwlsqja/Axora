# Pitfalls Research

**Domain:** AI-powered trading agent on Injective blockchain
**Researched:** 2026-03-14
**Confidence:** MEDIUM-HIGH (Injective-specific items verified against official docs; AI/LLM items verified across multiple sources; some integration specifics need validation during implementation)

## Critical Pitfalls

### Pitfall 1: LLM Hallucination Producing Invalid or Dangerous Trade Parameters

**What goes wrong:**
The LLM generates plausible-looking but incorrect trade parameters -- wrong market IDs, fabricated token pairs, decimal errors in quantities or prices, or nonsensical order configurations. In a financial context, a single hallucinated decimal point can be catastrophic. A documented real-world case: an AI bot intended to send 52,439 tokens but dispatched 52.43 million tokens due to a decimal error, losing its entire holdings.

**Why it happens:**
LLMs are text predictors, not calculators. They have no intrinsic understanding of numerical precision, market state, or valid parameter ranges. When converting natural language intent ("buy some INJ") into structured trade parameters, the model may confidently produce values that look correct syntactically but are wrong numerically or contextually. Financial losses from hallucination-related incidents exceed $250M annually across the industry.

**How to avoid:**
- Never let LLM output flow directly to transaction signing. Every LLM output must pass through a deterministic validation layer before reaching the chain.
- Define strict schemas for all trade parameter outputs (market ID must exist, quantity must be within range, price must be within N% of current market price).
- Use the LLM only for intent parsing and strategy structuring. All numerical calculations (position sizing, price computation, slippage bounds) must happen in deterministic code.
- Implement a "confirmation gate" that shows the user exactly what will execute before signing.

**Warning signs:**
- LLM producing market IDs or denominations not in your validated whitelist
- Quantities with suspicious decimal places (especially very large or very small)
- Test suite showing intermittent failures on parameter generation
- User reporting "that's not what I asked for" after seeing confirmation screen

**Phase to address:**
Phase 1 (Core Infrastructure). The validation layer between LLM output and transaction execution is foundational -- nothing ships without it. This is not a feature; it is a safety system.

---

### Pitfall 2: Account Sequence Mismatch on Concurrent Transactions

**What goes wrong:**
When broadcasting multiple transactions from the same account (common in split orders, batch operations, or rapid user interactions), the Cosmos SDK requires a monotonically increasing sequence number per account. If two transactions with sequence N and N+1 are reordered or one fails, subsequent transactions fail with "account sequence mismatch" errors. This causes partial execution of multi-step strategies -- some orders placed, others silently failing.

**Why it happens:**
Injective is built on Cosmos SDK, which uses a single sequential nonce per account. Unlike Ethereum (which also has this issue but with more tooling), the Cosmos nonce system has no native support for parallel transaction submission from a single account. Developers coming from CEX API backgrounds (where you can fire multiple orders simultaneously) get burned by this.

**How to avoid:**
- Implement a transaction sequencer/queue that serializes all outbound transactions from a single account, ensuring correct sequence numbers.
- Use `MsgBatchUpdateOrders` to combine multiple order operations into a single transaction where possible, avoiding the sequence issue entirely.
- If using subaccount delegation, consider using separate subaccounts for different strategy components to parallelize.
- Build retry logic with sequence number re-fetching on failure.
- Never fire-and-forget transactions -- always wait for confirmation before sending the next one.

**Warning signs:**
- Intermittent "account sequence mismatch" errors in logs
- Split orders where some legs execute and others do not
- Users reporting "half my order went through"
- Test failures that only appear under load or rapid successive calls

**Phase to address:**
Phase 1 (Core Infrastructure). The transaction broadcasting layer must handle sequencing correctly from day one. Retrofitting this is extremely painful because every transaction pathway is affected.

---

### Pitfall 3: Default Subaccount (Nonce 0) Gas Overhead and Fund Confusion

**What goes wrong:**
Since Injective v1.10.0, the default subaccount (nonce 0) merges with the bank module balance. Trading from the default subaccount costs roughly 15% more gas than non-default subaccounts. Additionally, developers confuse bank balance vs. subaccount deposit balance, leading to "insufficient funds" errors when the user has visible balance but it is in the wrong location (bank vs. exchange subaccount). You also cannot use `MsgExternalTransfer` from the default subaccount since that balance is now in the bank module.

**Why it happens:**
The v1.10.0 merge of bank balance and default subaccount created a special case. Most documentation and examples still reference the default subaccount, leading developers to use it by default. The gas overhead is not prominently documented, and the distinction between bank balance and exchange subaccount deposit is subtle but financially significant.

**How to avoid:**
- Use non-default subaccounts (nonce >= 1) for all automated trading operations to save ~15% on gas.
- Build an explicit fund routing layer: detect where user funds are (bank vs. subaccount) and automate `MsgDeposit` to move funds into the correct trading subaccount before order placement.
- Handle the `MsgExternalTransfer` limitation for default subaccounts explicitly -- route through non-default subaccounts.
- Display fund location clearly in the UI so users understand where their assets are.

**Warning signs:**
- Higher-than-expected gas costs on transactions
- "Insufficient funds" errors when the user clearly has balance
- Users confused about why they need to "deposit" before trading
- `MsgExternalTransfer` calls failing silently from subaccount 0

**Phase to address:**
Phase 1 (Core Infrastructure). Fund routing and subaccount management are core plumbing. Getting this wrong means every subsequent feature built on top will have subtle balance and gas issues.

---

### Pitfall 4: Over-Permissioned Key Management in Delegation Mode

**What goes wrong:**
The agent holds a private key or has authz grants that allow far more operations than necessary. If the key is compromised (server breach, log leak, dependency vulnerability), the attacker can drain funds, place arbitrary trades, or manipulate positions. In crypto, key compromise = immediate, irreversible financial loss. There is no "fraud department" to call.

**Why it happens:**
During development, it is easiest to use a single key with full permissions. Developers intend to "lock it down later" but ship with over-permissioned keys. The Injective authz module supports granular permissions (per-market, per-action) but configuring them is more complex than using a full-access key. Additionally, developers store private keys in environment variables or config files that end up in logs, error reports, or version control.

**How to avoid:**
- Design the permission model before writing any transaction code. Define exactly which messages the agent key is authorized to send (e.g., only `MsgBatchUpdateOrders` on specific market IDs).
- Use Injective's authz module for delegation: the user (granter) grants specific permissions to the agent (grantee), with expiration times and market-level scoping.
- Never store raw private keys in environment variables for production. Use encrypted keystores or HSM-backed solutions.
- Implement permission audit logging: every granted permission should be recorded and reviewable.
- Set spending limits and time-bounded authorizations.

**Warning signs:**
- Agent key has `MsgSend` or withdrawal permissions it does not need
- Private keys in `.env` files, config files, or log output
- No expiration on authz grants
- Single key used across development and production environments

**Phase to address:**
Phase 1 (Core Infrastructure) for the permission model design; Phase 2 (Delegation Mode) for full authz implementation. The permission model must be designed first even if delegation ships later.

---

### Pitfall 5: LLM Cost Explosion Under Real User Load

**What goes wrong:**
Each user interaction triggers one or more LLM API calls. With flagship models charging $2-3/M input tokens and $10-15/M output tokens, costs compound rapidly. A single complex strategy interpretation might use 2,000-4,000 tokens. At 1,000 daily active users making 5 interactions each, that is 5,000 calls/day -- potentially $50-150/day on LLM costs alone for a product that may not yet have revenue. Costs become unsustainable before the product achieves product-market fit.

**Why it happens:**
Developers prototype with powerful flagship models (GPT-4, Claude Opus) because they produce the best results. They do not monitor token usage during development because volumes are low. When real users arrive, costs scale linearly (or worse, if prompts are not optimized). Output tokens cost 3-10x more than input tokens, and most developers do not optimize for output length.

**How to avoid:**
- Start with cost monitoring from day one. Track tokens per request, cost per user session, and cost per successful trade execution.
- Use model routing: simple intent classification (e.g., "buy INJ") should use a cheap/fast model; complex strategy interpretation can use a more capable model. This can cut costs 60-90%.
- Implement semantic caching: identical or similar queries should return cached responses. Cache hits cost ~10% of standard input tokens.
- Optimize prompts aggressively: shorter system prompts, structured output formats that minimize output tokens, few-shot examples that reduce ambiguity.
- Set hard cost ceilings per user per day during beta.

**Warning signs:**
- No cost tracking dashboard or per-request cost logging
- Using the same model for all request types regardless of complexity
- Average response length growing over time (prompt drift)
- Monthly LLM bill exceeding $500 before you have 100 users

**Phase to address:**
Phase 2 (AI Integration). The intent parsing layer should be built with cost awareness from the start, but aggressive optimization can wait until usage patterns are understood. However, model routing architecture should be designed in Phase 1 so it is not a retrofit.

---

### Pitfall 6: Strategy Execution Without Rollback -- Partial State on Multi-Step Failures

**What goes wrong:**
A complex strategy (e.g., "sell half my INJ position and use the proceeds to open a leveraged long on ETH") involves multiple sequential transactions. If the first transaction succeeds but the second fails (gas spike, market moved, insufficient margin), the user is left in an unintended intermediate state: they sold INJ but never opened the ETH position. The system has no mechanism to detect or recover from this partial execution.

**Why it happens:**
On-chain transactions are atomic individually but not across multiple transactions. Developers build the "happy path" first and assume multi-step operations will always complete. Error handling for partial execution is complex and often deferred. Unlike traditional databases, there is no `ROLLBACK` for on-chain transactions.

**How to avoid:**
- Design every multi-step strategy as a state machine with explicit states: PLANNED, STEP_1_EXECUTING, STEP_1_COMPLETE, STEP_2_EXECUTING, COMPLETE, PARTIAL_FAILURE.
- On any step failure, immediately notify the user with clear information about what executed and what did not.
- Provide one-click recovery actions: "Step 2 failed. Your INJ was sold. Would you like to: (a) retry the ETH long, (b) buy back INJ, (c) keep current state?"
- Use `MsgBatchUpdateOrders` to combine operations into single transactions where possible.
- Store strategy execution state persistently (not just in memory) so it survives crashes.

**Warning signs:**
- Multi-step strategies implemented as sequential `await` calls with no intermediate state tracking
- No error handling between transaction steps
- Users discovering unexpected portfolio states
- No mechanism to resume or recover from mid-strategy failures

**Phase to address:**
Phase 2 (Strategy Execution). This must be designed into the strategy execution engine from the start, not bolted on after users experience partial failures.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoded market IDs | Faster development | Breaks when Injective adds/removes markets; requires code changes for each new market | Never in production; acceptable in first 2 weeks of prototyping only |
| Single LLM model for all requests | Simpler architecture | 5-10x cost overhead; higher latency for simple operations | MVP only; must add routing before scaling to 100+ users |
| Storing execution state in memory only | No database dependency | Strategy state lost on crash; partial executions unrecoverable | Never for multi-step strategies; acceptable for single-order flows in MVP |
| Skipping gas estimation (using fixed gas) | Avoids simulation complexity | Transactions fail during gas spikes or overpay dramatically during calm periods | Never; Injective gas varies significantly by operation type |
| No rate limiting on LLM calls | Simpler user experience | Cost explosion from runaway users; potential API key suspension | Never; implement basic rate limits from day one |
| Using default subaccount for everything | Simpler fund management | 15% gas overhead on every transaction; blocks `MsgExternalTransfer` usage | First week of prototyping only |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Injective gRPC/LCD endpoints | Using public endpoints for production; hitting rate limits under load | Use dedicated Injective node or paid endpoint service; implement retry with backoff; cache market data aggressively |
| Injective SDK (`@injectivelabs/sdk-ts`) | Not handling SDK version updates; breaking changes between minor versions are common in Cosmos SDK ecosystem | Pin exact SDK versions; test upgrades in staging; subscribe to Injective release announcements |
| LLM API (OpenAI/Anthropic) | Not handling API timeouts or rate limits; blocking user interaction while waiting for LLM response | Implement timeouts (5-10s max for trading context); show progressive UI while waiting; have fallback for API outages |
| Price feeds / Market data | Relying on a single price source; using stale cached prices for order validation | Cross-reference prices from Injective orderbook AND external oracle; set staleness thresholds (reject if data > 5s old for active trading) |
| Wallet connection (Keplr/Metamask) | Assuming wallet is always available; not handling disconnection mid-session | Implement wallet state monitoring; graceful degradation on disconnect; clear messaging about what requires wallet vs. what does not |
| Injective authz module | Granting overly broad permissions; not setting expiration; not handling grant revocation | Grant minimum necessary permissions per market; set 24-72h expiration windows; check grant validity before every delegated operation |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Polling orderbook for every user request | High latency on trade preview; excessive API calls | Use WebSocket streams for orderbook data; cache with short TTL (1-2s) | >50 concurrent users polling simultaneously |
| LLM call in the critical transaction path | 2-5 second delay between user confirming and transaction broadcasting | Pre-compute LLM interpretation during user review; only deterministic validation in the signing path | Any user volume; this is always too slow |
| Fetching all markets on every page load | Slow initial load; wasted bandwidth | Cache market list with 5-minute TTL; markets rarely change; fetch only active/relevant markets | >20 markets listed; first-load UX degrades |
| Synchronous sequence number management | Serial transaction processing; one user blocks another | Per-user transaction queues; use separate subaccounts for parallelism | >10 active users submitting orders simultaneously |
| No pagination on order history queries | Memory explosion; slow responses | Paginate from the start; limit default query to 50 orders; lazy-load more | >500 historical orders per user |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Private key stored in plaintext config/env vars | Complete fund loss if server is compromised | Use encrypted keystores; require password/HSM for key access; never log key material |
| Agent key with withdrawal permissions | Attacker can drain all funds, not just manipulate trades | Use authz grants scoped to trading operations only; no `MsgSend` or bank transfer permissions on agent key |
| No transaction amount limits | A single hallucinated LLM output or user error could place an order for entire portfolio | Implement hard-coded maximum order size as percentage of portfolio; require additional confirmation above threshold |
| Exposing raw RPC/gRPC endpoints to frontend | Attackers can bypass your validation layer and submit arbitrary transactions | All chain interactions must go through your backend validation layer; never expose node endpoints to client |
| Not validating authz grant status before delegated operations | Expired or revoked grants cause silent failures; user thinks agent is working but it is not | Check grant validity before every delegated operation; proactively notify user when grants are approaching expiration |
| Logging transaction details including signatures | Replay attacks if logs are accessed; signature reuse in some edge cases | Sanitize all logs; never log signatures, private keys, or full transaction bytes; log only transaction hashes and statuses |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing raw blockchain errors to users | Users see "account sequence mismatch: expected 47, got 46" and panic | Translate every chain error to human-readable message: "Your order could not be submitted. Please try again." with retry button |
| Requiring multiple approval steps for simple trades | Users abandon the flow; "I could just do this on Helix directly" | Minimize approval steps: one confirmation screen showing exactly what will execute, one signature request. No intermediate approvals. |
| Displaying AI confidence or probability scores | Users misinterpret confidence scores as profit predictions; creates false trust or unnecessary anxiety | Show what the AI interpreted and what it will do, not how confident it is. Binary: "Here's what I'll execute. Confirm?" |
| Hiding strategy execution status | Users do not know if their strategy is running, completed, or failed | Real-time status updates: "Step 1 of 2: Selling INJ... complete. Step 2: Opening ETH position... pending." |
| Over-promising AI capabilities in onboarding | Users expect the AI to predict markets or guarantee profits; inevitable disappointment | Frame as "AI trading assistant that executes your strategies" not "AI that trades for you." Explicit disclaimers on first use. |
| Complex settings/configuration on first screen | New users overwhelmed; high bounce rate | Default everything. First screen should show portfolio and a chat/input box. Advanced settings hidden behind progressive disclosure. |
| No clear explanation of subaccount delegation | Users do not understand what they are granting; reluctance to use delegation mode | Plain-language explanation: "You're allowing the assistant to place orders on [these markets] with a maximum of [X amount]. You can revoke this anytime." |

## "Looks Done But Isn't" Checklist

- [ ] **Order placement:** Often missing gas estimation failure handling -- verify the system retries with higher gas or notifies user when gas estimation fails
- [ ] **Strategy execution:** Often missing intermediate state persistence -- verify that a server restart mid-strategy does not leave orphaned orders
- [ ] **Delegation mode:** Often missing grant expiration monitoring -- verify the system checks grant validity and prompts renewal before expiration
- [ ] **Intent parsing:** Often missing ambiguity detection -- verify the system asks for clarification on ambiguous inputs ("buy some crypto" should prompt "which token and how much?") rather than guessing
- [ ] **Error recovery:** Often missing partial execution cleanup -- verify the system provides clear recovery paths when multi-step strategies fail midway
- [ ] **Fund management:** Often missing pre-flight balance checks across bank + subaccount locations -- verify the system checks both bank balance and subaccount deposit before order creation
- [ ] **Market data:** Often missing staleness detection -- verify the system rejects operations based on stale price data (>5-10s old)
- [ ] **Session management:** Often missing wallet disconnect handling -- verify the system gracefully handles wallet disconnection during active strategy execution

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| LLM hallucination executes bad trade | HIGH | Cancel pending orders immediately; if filled, assess damage and present user with options (hold, reverse, partial exit); implement the validation layer that was missing |
| Account sequence mismatch breaks strategy | MEDIUM | Re-fetch current sequence number; replay failed transactions in correct order; audit intermediate state for consistency |
| Key compromise | CRITICAL | Revoke all authz grants immediately; transfer remaining funds to new address; rotate all API keys; incident response and user notification |
| Partial strategy execution | MEDIUM | Present user with current state vs. intended state; offer specific recovery actions (complete remaining steps, reverse completed steps, or accept current state) |
| Cost explosion from LLM calls | LOW | Implement rate limits retroactively; switch to cheaper model for simple queries; enable caching; costs stop immediately once limits are in place |
| Default subaccount gas overhead | LOW | Migrate to non-default subaccounts; one-time fund transfer; update all transaction code to use new subaccount index |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| LLM hallucination in trade params | Phase 1: Core Infrastructure | Validation layer rejects 100% of out-of-bounds parameters in test suite; fuzz testing with adversarial LLM outputs |
| Account sequence mismatch | Phase 1: Core Infrastructure | Load test with rapid sequential transactions; zero sequence errors under concurrent usage |
| Default subaccount gas overhead | Phase 1: Core Infrastructure | All automated operations use non-default subaccounts; gas costs match expected baseline |
| Over-permissioned keys | Phase 1: Design / Phase 2: Implementation | Security audit of all authz grants; no grant exceeds minimum necessary permissions |
| LLM cost explosion | Phase 2: AI Integration | Cost monitoring dashboard live; per-request cost logging; model routing for simple vs. complex queries |
| Partial strategy execution | Phase 2: Strategy Execution | Integration test that kills process mid-strategy; verify recovery path works; state machine coverage |
| UX complexity creep | Phase 1: First screen design | User testing: new user can execute first trade within 60 seconds; zero blockchain jargon on primary screens |
| Over-promising AI capabilities | Phase 1: Messaging/Copy | Product copy reviewed for accuracy; no language implying prediction, guarantee, or autonomous profit generation |
| Wallet/connection fragility | Phase 1: Core Infrastructure | Test suite covers disconnect/reconnect scenarios; graceful degradation verified |
| Strategy state loss on crash | Phase 2: Strategy Execution | Chaos test: kill server during multi-step strategy; verify state recoverable from persistent storage |

## Small Team (1-2 Person) Specific Pitfalls

### Pitfall: Building a General-Purpose AI Trading Platform Instead of a Focused Tool

**What goes wrong:**
The team tries to support every Injective market type (spot, perpetuals, futures, options), every order type (limit, market, stop-loss, take-profit, conditional), and every strategy pattern simultaneously. The result is nothing works well, everything is half-finished, and the product never reaches "first session action" quality.

**Why it happens:**
The Injective exchange module is feature-rich. It is tempting to expose all of it through the AI layer. Each new feature seems "simple to add" in isolation but compounds testing, error handling, and UX complexity.

**How to avoid:**
- Pick ONE market type (spot) and TWO order types (market, limit) for MVP.
- Ship that, get users, then expand based on actual demand.
- Say "no" to perpetuals until spot trading works flawlessly.
- Maintain a scope decision log: every feature request gets logged with accept/defer/reject and rationale.

**Warning signs:**
- Codebase has stubs for 5+ features that none are complete
- "Just one more feature before launch" recurring for more than 2 weeks
- Unable to demo a complete user flow end-to-end

**Phase to address:**
Pre-Phase 1 (Scoping). Scope must be locked before development begins.

---

### Pitfall: Over-Engineering the AI Layer Before Validating the Core Trading Flow

**What goes wrong:**
Weeks spent on sophisticated prompt engineering, multi-turn conversation, context management, and AI personality while the basic flow of "user says buy INJ, transaction gets signed and broadcast" does not work reliably. The AI layer is impressive in demos but the plumbing underneath it fails in production.

**How to avoid:**
- Build and validate the entire transaction pipeline first WITHOUT any AI. Hardcode a test intent, validate it, sign it, broadcast it, confirm it.
- Only then layer AI on top for intent parsing.
- The AI is a UX layer, not the core product. The core product is reliable trade execution on Injective.

**Warning signs:**
- Demo works with carefully crafted prompts but fails with real user input
- More time spent on prompt engineering than on transaction error handling
- No integration tests for the transaction pipeline independent of the AI layer

**Phase to address:**
Phase 1 (Core Infrastructure). Transaction pipeline must be solid before AI layer begins.

## Sources

- [Injective Trading Account Docs](https://docs.injective.network/developers/concepts/trading-account) - Subaccount mechanics, default subaccount merge (HIGH confidence)
- [Injective Exchange Module Docs](https://docs.injective.network/developers-native/injective/exchange) - Order types, batch operations (HIGH confidence)
- [Cosmos SDK Sequence Issue](https://github.com/cosmos/cosmos-sdk/issues/13009) - Nonce/sequence concurrency limitation (HIGH confidence)
- [Hacken: Order Book Security Vulnerabilities](https://hacken.io/insights/order-book-security-vulnerabilities/) - Partial fill, batch matching, front-running risks (HIGH confidence)
- [DL News: AI agents are terrible at trading crypto](https://www.dlnews.com/articles/defi/ai-agents-are-terrible-at-trading-crypto-but-that-could-change/) - AI agent failure modes (MEDIUM confidence)
- [TheStreet: Million dollar mistakes in AI digital finance](https://www.thestreet.com/crypto/innovation/million-dollar-mistakes-loom-as-ai-agents-enter-digital-finance) - Decimal errors, lever looping, fat finger examples (MEDIUM confidence)
- [BizTech: LLM Hallucinations Financial Implications](https://biztechmagazine.com/article/2025/08/llm-hallucinations-what-are-implications-financial-institutions) - $250M annual hallucination losses (MEDIUM confidence)
- [EY: Managing Hallucination Risk](https://www.ey.com/en_gl/technical/enterprise-solution-guides-technology-leaders/managing-hallucination-risk-in-llm-deployments-at-the-ey-organization) - Multi-model consensus mitigation (MEDIUM confidence)
- [Redis: LLM Token Optimization](https://redis.io/blog/llm-token-optimization-speed-up-apps/) - Caching and cost reduction strategies (MEDIUM confidence)
- [Hummingbot Injective Connector](https://hummingbot.org/exchanges/injective/) - Gas estimation multiplier, subaccount configuration (MEDIUM confidence)
- [Injective Blog: Transactions and Accounts](https://injective.com/blog/from-wallet-to-chain-understanding-transactions-and-accounts-on-injective) - Sequence number mechanics (HIGH confidence)
- [CCN: Hidden Dangers of AI Crypto Trading](https://www.ccn.com/education/crypto/hidden-dangers-of-ai-crypto-trading/) - Market manipulation vulnerability, spoofing (MEDIUM confidence)

---
*Pitfalls research for: AI-powered trading agent on Injective blockchain*
*Researched: 2026-03-14*
