# Roadmap: Injective AI Trading Agent

## Overview

This roadmap delivers an AI-powered trading agent on Injective that converts user intent into structured, agent-executed on-chain strategies. The architecture is **Subaccount-first**: users onboard by creating a dedicated agent subaccount and delegating bounded capital from the first session — no per-transaction signing required. The journey moves from wallet connection and subaccount onboarding, through AI-powered intent parsing and delegated execution, to composite strategies and grant lifecycle management — ending with analytics instrumentation to measure product-market fit.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Subaccount Onboarding** - Wallet connection, subaccount creation, deposit, and AuthZ grant setup
- [ ] **Phase 2: Intent Entry UX** - Goal-based entry points and natural language intent input
- [ ] **Phase 3: AI Strategy Engine** - Intent parsing, strategy structuring, and proposal generation
- [ ] **Phase 4: Delegated Execution** - Strategy execution via subaccount with safety guardrails
- [ ] **Phase 5: Composite Strategies** - Multi-order strategy types (DCA, scale-in, bracket)
- [ ] **Phase 6: Monitoring & Status** - Strategy status tracking, fill monitoring, and P&L display
- [ ] **Phase 7: Grant Lifecycle** - Grant renewal, scope adjustment, revocation, and permission dashboard
- [ ] **Phase 8: Analytics & KPI** - Execution tracking, conversion funnels, and adoption metrics

## Phase Details

### Phase 1: Foundation & Subaccount Onboarding
**Goal**: Users can connect their wallet, create an agent subaccount, deposit funds, and grant bounded execution authority — completing the full onboarding in one session
**Depends on**: Nothing (first phase)
**Requirements**: WALL-01, WALL-02, WALL-03, WALL-04, DELEG-01, DELEG-02
**Success Criteria** (what must be TRUE):
  1. User can connect Keplr wallet and see the app recognize their account
  2. User can connect MetaMask wallet via EIP-712 and see the app recognize their account
  3. User can view their INJ balance and available assets after connecting
  4. User completes step-by-step onboarding: wallet connect → agent account explanation → amount setup → single signature
  5. Subaccount is created with deposited funds and AuthZ grant (spot markets, within deposited amount, 7-day expiry)
  6. User can disconnect wallet and session state is fully cleared
  7. Application can construct and broadcast transactions via subaccount on Injective testnet
**Plans**: 3 plans

Plans:
- [ ] 01-01: Project scaffold, dev tooling, and Injective chain client
- [ ] 01-02: Wallet connection and account lifecycle
- [ ] 01-03: Subaccount creation, deposit flow, and AuthZ grant onboarding

### Phase 2: Intent Entry UX
**Goal**: Users can discover and express trading intentions without needing to understand market mechanics
**Depends on**: Phase 1
**Requirements**: ONBR-01, ONBR-02, INTNT-01, INTNT-02
**Success Criteria** (what must be TRUE):
  1. User sees 5-8 goal-based intent cards on the landing screen without connecting a wallet
  2. User can select a preset intent card and proceed to the next step
  3. User can type a free-text natural language intent and proceed to the next step
  4. User is prompted to connect wallet only when they attempt to execute, not while browsing intents
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Intent data model, preset cards, and intent-first landing page restructure
- [ ] 02-02-PLAN.md — Free-text intent input, confirmation flow, and wallet-gated proceed

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
**Plans**: 3 plans

Plans:
- [ ] 03-01: LLM intent parser with Zod schema validation
- [ ] 03-02: Strategy Engine validation and proposal UI

### Phase 4: Delegated Execution
**Goal**: Agent executes AI-structured strategies on Injective via the user's delegated subaccount without per-transaction signing
**Depends on**: Phase 3
**Requirements**: EXEC-01, EXEC-02, EXEC-03, EXEC-04, EXEC-05
**Success Criteria** (what must be TRUE):
  1. Agent can execute a strategy via subaccount using delegated AuthZ grant (batched via MsgBatchUpdateOrders)
  2. User sees a clear confirmation before execution showing number of orders, total capital, and expected behavior
  3. User can cancel unfilled orders from an active strategy
  4. System prevents strategies that exceed deposited subaccount balance
  5. System enforces mandatory stop-loss on leveraged positions
  6. Execution respects AuthZ grant boundaries (allowed markets, max capital, expiry)
**Plans**: 3 plans

Plans:
- [ ] 04-01: Delegated transaction construction and execution flow
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
**Plans**: 3 plans

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
**Plans**: 3 plans

Plans:
- [ ] 06-01: Active strategy list and order fill status
- [ ] 06-02: P&L calculation and execution history

### Phase 7: Grant Lifecycle
**Goal**: Users can manage, renew, and adjust their delegation grants with full visibility and control
**Depends on**: Phase 4, Phase 6
**Requirements**: DELEG-03, DELEG-04, DELEG-05
**Success Criteria** (what must be TRUE):
  1. User receives notification before grant expiry and can renew with one action
  2. User can adjust grant scope (add/remove markets, change capital limit, extend expiry)
  3. User can revoke delegation at any time, immediately stopping agent execution
  4. User can view current delegation scope (active permissions, remaining limits, expiry)
  5. System gracefully handles expired grants (notify user, pause execution, prompt renewal)
**Plans**: 3 plans

Plans:
- [ ] 07-01: Grant expiry notification and renewal flow
- [ ] 07-02: Scope adjustment, revocation, and permission dashboard

### Phase 8: Analytics & KPI
**Goal**: Product team can measure user behavior and validate product-market fit through instrumented metrics
**Depends on**: Phase 4
**Requirements**: KPI-01, KPI-02, KPI-03, KPI-04, KPI-05
**Success Criteria** (what must be TRUE):
  1. System tracks strategy execution count per user
  2. System tracks the full intent-to-execution conversion funnel (intent entered -> proposal viewed -> execution confirmed -> tx confirmed)
  3. System tracks repeat usage rate (users executing 2+ strategies in 30 days)
  4. System tracks delegated TVL and grant renewal rate
  5. System tracks time-to-first-execution for new users
**Plans**: 3 plans

Plans:
- [ ] 08-01: Event tracking and conversion funnel instrumentation
- [ ] 08-02: Retention, delegation, and onboarding metrics

## Progress

**Execution Order:**
Phases execute in numeric order. Phases 5, 6, and 8 can run in parallel after Phase 4 completes.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Subaccount Onboarding | 0/3 | Not started | - |
| 2. Intent Entry UX | 0/2 | Not started | - |
| 3. AI Strategy Engine | 0/2 | Not started | - |
| 4. Delegated Execution | 0/2 | Not started | - |
| 5. Composite Strategies | 0/2 | Not started | - |
| 6. Monitoring & Status | 0/2 | Not started | - |
| 7. Grant Lifecycle | 0/2 | Not started | - |
| 8. Analytics & KPI | 0/2 | Not started | - |
