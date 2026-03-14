# Roadmap: Injective AI Trading Agent

## Overview

This roadmap delivers an AI-powered trading agent on Injective that converts user intent into structured, user-approved on-chain strategies. The journey moves from chain connectivity and wallet integration, through AI-powered intent parsing and direct signing execution, to subaccount delegation as the core differentiator -- ending with analytics instrumentation to measure product-market fit. Each phase delivers a complete, verifiable capability that builds on the previous one.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Wallet** - Chain connectivity, wallet lifecycle, and transaction pipeline
- [ ] **Phase 2: Intent Entry UX** - Goal-based entry points and natural language intent input
- [ ] **Phase 3: AI Strategy Engine** - Intent parsing, strategy structuring, and proposal generation
- [ ] **Phase 4: Direct Signing Execution** - Strategy execution via wallet signing with safety guardrails
- [ ] **Phase 5: Composite Strategies** - Multi-order strategy types (DCA, scale-in, bracket)
- [ ] **Phase 6: Monitoring & Status** - Strategy status tracking, fill monitoring, and P&L display
- [ ] **Phase 7: Subaccount Delegation** - Bounded automation via AuthZ delegation with progressive trust
- [ ] **Phase 8: Analytics & KPI** - Execution tracking, conversion funnels, and adoption metrics

## Phase Details

### Phase 1: Foundation & Wallet
**Goal**: Users can connect their wallet and interact with the Injective chain through the application
**Depends on**: Nothing (first phase)
**Requirements**: WALL-01, WALL-02, WALL-03, WALL-04
**Success Criteria** (what must be TRUE):
  1. User can connect Keplr wallet and see the app recognize their account
  2. User can connect MetaMask wallet via EIP-712 and see the app recognize their account
  3. User can view their INJ balance and available assets after connecting
  4. User can disconnect wallet and session state is fully cleared
  5. Application can construct and broadcast a basic transaction on Injective testnet (verified via integration test, not user-facing)
**Plans**: TBD

Plans:
- [ ] 01-01: Project scaffold, dev tooling, and Injective chain client
- [ ] 01-02: Wallet connection and account lifecycle

### Phase 2: Intent Entry UX
**Goal**: Users can discover and express trading intentions without needing to understand market mechanics
**Depends on**: Phase 1
**Requirements**: ONBR-01, ONBR-02, INTNT-01, INTNT-02
**Success Criteria** (what must be TRUE):
  1. User sees 5-8 goal-based intent cards on the landing screen without connecting a wallet
  2. User can select a preset intent card and proceed to the next step
  3. User can type a free-text natural language intent and proceed to the next step
  4. User is prompted to connect wallet only when they attempt to execute, not while browsing intents
**Plans**: TBD

Plans:
- [ ] 02-01: Landing page with goal-based intent cards
- [ ] 02-02: Natural language intent input and wallet-gated flow

### Phase 3: AI Strategy Engine
**Goal**: AI converts user intent into a clear, adjustable strategy proposal that users can understand and trust
**Depends on**: Phase 2
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05
**Success Criteria** (what must be TRUE):
  1. User's intent (preset or free-text) is parsed into structured strategy parameters (entry prices, split count, order sizes, risk limits)
  2. User sees a proposal card showing: orders to be placed, prices, total capital committed, and worst-case outcome
  3. User can adjust key parameters (price range, amount, split count) on the proposal before proceeding
  4. AI flags or prevents unrealistic parameters based on current market price, volatility, and orderbook depth
  5. AI refuses to structure strategies that exceed user-defined risk thresholds
**Plans**: TBD

Plans:
- [ ] 03-01: LLM intent parser with Zod schema validation
- [ ] 03-02: Strategy Engine validation and proposal UI

### Phase 4: Direct Signing Execution
**Goal**: Users can execute AI-structured strategies on Injective by signing transactions directly with their wallet
**Depends on**: Phase 3
**Requirements**: EXEC-01, EXEC-02, EXEC-03, EXEC-04, EXEC-05
**Success Criteria** (what must be TRUE):
  1. User can execute a strategy via a single wallet signature (batched via MsgBatchUpdateOrders)
  2. User sees a clear confirmation before signing showing number of orders, total capital, and expected behavior
  3. User can cancel unfilled orders from an active strategy
  4. System prevents strategies that exceed 30% of available balance
  5. System enforces mandatory stop-loss on leveraged positions
**Plans**: TBD

Plans:
- [ ] 04-01: Transaction construction and direct signing flow
- [ ] 04-02: Safety guardrails and order cancellation

### Phase 5: Composite Strategies
**Goal**: Users can express complex trading intentions that result in coordinated multi-order strategies
**Depends on**: Phase 4
**Requirements**: STRAT-01, STRAT-02, STRAT-03, STRAT-04
**Success Criteria** (what must be TRUE):
  1. User can execute a DCA strategy with multiple limit orders at calculated price intervals
  2. User can execute a scale-in strategy with orders at declining price levels with increasing size
  3. User can execute a bracket order with entry, take-profit, and stop-loss
  4. AI determines optimal order spacing, sizing, and price levels based on user intent and current market conditions
**Plans**: TBD

Plans:
- [ ] 05-01: DCA and scale-in strategy types
- [ ] 05-02: Bracket orders and AI-driven parameter optimization

### Phase 6: Monitoring & Status
**Goal**: Users can track the status and performance of their executed strategies at a glance
**Depends on**: Phase 4
**Requirements**: MON-01, MON-02, MON-03, MON-04
**Success Criteria** (what must be TRUE):
  1. User can view a list of active strategies with current status (pending, partially filled, complete, cancelled)
  2. User can drill into a strategy to see individual order fill status
  3. User can view basic P&L for executed strategies
  4. User can browse their strategy execution history
**Plans**: TBD

Plans:
- [ ] 06-01: Active strategy list and order fill status
- [ ] 06-02: P&L calculation and execution history

### Phase 7: Subaccount Delegation
**Goal**: Trusted users can delegate bounded execution authority to the agent, eliminating per-transaction signing
**Depends on**: Phase 4, Phase 6
**Requirements**: DELEG-01, DELEG-02, DELEG-03, DELEG-04, DELEG-05, ONBR-03
**Success Criteria** (what must be TRUE):
  1. User can create or select an Injective subaccount for agent delegation
  2. User can grant bounded permissions via AuthZ (max capital, allowed markets, time expiry)
  3. Agent executes strategies within delegated bounds without requiring per-transaction signing
  4. User can revoke delegation permissions at any time, immediately stopping agent execution
  5. User can view current delegation scope (active permissions, remaining limits, expiry)
  6. After N successful direct-signing executions, system suggests upgrading to delegation mode
**Plans**: TBD

Plans:
- [ ] 07-01: Subaccount creation and AuthZ grant setup
- [ ] 07-02: Delegated execution and grant lifecycle management
- [ ] 07-03: Progressive trust building UX

### Phase 8: Analytics & KPI
**Goal**: Product team can measure user behavior and validate product-market fit through instrumented metrics
**Depends on**: Phase 4
**Requirements**: KPI-01, KPI-02, KPI-03, KPI-04, KPI-05
**Success Criteria** (what must be TRUE):
  1. System tracks strategy execution count per user
  2. System tracks the full intent-to-execution conversion funnel (intent entered -> proposal viewed -> execution confirmed -> tx confirmed)
  3. System tracks repeat usage rate (users executing 2+ strategies in 30 days)
  4. System tracks delegation adoption rate and delegated TVL
  5. System tracks time-to-first-execution for new users
**Plans**: TBD

Plans:
- [ ] 08-01: Event tracking and conversion funnel instrumentation
- [ ] 08-02: Retention, delegation, and onboarding metrics

## Progress

**Execution Order:**
Phases execute in numeric order. Phases 5, 6, and 8 can run in parallel after Phase 4 completes.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Wallet | 0/2 | Not started | - |
| 2. Intent Entry UX | 0/2 | Not started | - |
| 3. AI Strategy Engine | 0/2 | Not started | - |
| 4. Direct Signing Execution | 0/2 | Not started | - |
| 5. Composite Strategies | 0/2 | Not started | - |
| 6. Monitoring & Status | 0/2 | Not started | - |
| 7. Subaccount Delegation | 0/3 | Not started | - |
| 8. Analytics & KPI | 0/2 | Not started | - |
