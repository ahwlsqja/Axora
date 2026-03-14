# Requirements: Injective AI Trading Agent

**Defined:** 2026-03-14
**Core Value:** 사용자의 의도를 Injective에서 실행 가능한 복합 온체인 액션으로 빠르고 안전하게 바꿔주는 것

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Wallet & Onboarding

- [ ] **WALL-01**: User can connect Keplr wallet to the application
- [ ] **WALL-02**: User can connect MetaMask wallet via EIP-712 signing
- [ ] **WALL-03**: User can view their INJ balance and available assets after connecting
- [ ] **WALL-04**: User can disconnect wallet and clear session
- [ ] **ONBR-01**: User sees goal-based entry points (5-8 preset intent cards) on first screen without wallet connection
- [ ] **ONBR-02**: User is prompted to connect wallet only when ready to execute, not before browsing
- [ ] **ONBR-03**: User sees progressive trust building UX — after N successful direct executions, system suggests delegation mode upgrade

### Intent & AI Layer

- [ ] **INTNT-01**: User can select a preset goal-based intent card (e.g., "DCA into INJ", "Set stop-loss", "Scale into dip", "Take partial profit", "Limit buy at discount")
- [ ] **INTNT-02**: User can type a natural language intent as free text (e.g., "INJ가 더 떨어지면 분할로 사고 싶다")
- [ ] **AI-01**: AI parses user intent into structured strategy parameters (entry prices, split count, order sizes, risk limits)
- [ ] **AI-02**: AI presents structured strategy as a clear, simple proposal card showing: orders to be placed, prices, total capital committed, worst-case outcome
- [ ] **AI-03**: User can adjust key parameters (price range, amount, split count) on the proposal before execution
- [ ] **AI-04**: AI references current market price, recent volatility, and orderbook depth to prevent unrealistic parameters
- [ ] **AI-05**: AI refuses to structure strategies that exceed user-defined risk thresholds

### Execution — Direct Signing

- [ ] **EXEC-01**: User can execute a structured strategy via direct wallet signing (one signature for batched orders via MsgBatchUpdateOrders)
- [ ] **EXEC-02**: User sees clear confirmation before signing: number of orders, total capital, expected behavior
- [ ] **EXEC-03**: User can cancel unfilled orders from an active strategy
- [ ] **EXEC-04**: System enforces maximum capital per strategy (e.g., max 30% of available balance)
- [ ] **EXEC-05**: System enforces mandatory stop-loss on leveraged positions

### Execution — Subaccount Delegation

- [ ] **DELEG-01**: User can create or select an Injective subaccount for agent delegation
- [ ] **DELEG-02**: User can grant bounded execution permissions to agent via AuthZ (max capital, allowed markets, time expiry)
- [ ] **DELEG-03**: Agent executes strategies within delegated bounds without per-transaction user signing
- [ ] **DELEG-04**: User can revoke delegation permissions at any time, immediately stopping agent execution
- [ ] **DELEG-05**: User can view current delegation scope (what permissions are active, remaining limits, expiry)

### Composite Strategies

- [ ] **STRAT-01**: System supports DCA (Dollar Cost Averaging) — multiple limit orders at calculated price intervals
- [ ] **STRAT-02**: System supports scale-in — orders at declining price levels with increasing size
- [ ] **STRAT-03**: System supports bracket orders — entry with take-profit and stop-loss
- [ ] **STRAT-04**: AI determines optimal order spacing, sizing, and price levels based on user intent and market context

### Monitoring & Status

- [ ] **MON-01**: User can view list of active strategies with current status (pending, partially filled, complete, cancelled)
- [ ] **MON-02**: User can view individual order fill status within a strategy
- [ ] **MON-03**: User can view basic P&L for executed strategies
- [ ] **MON-04**: User can view strategy execution history

### Analytics & KPI

- [ ] **KPI-01**: System tracks strategy execution count per user
- [ ] **KPI-02**: System tracks intent-to-execution conversion funnel (intent entered → proposal viewed → execution confirmed → tx confirmed)
- [ ] **KPI-03**: System tracks repeat usage rate (users executing 2+ strategies in 30 days)
- [ ] **KPI-04**: System tracks delegation adoption rate and delegated TVL
- [ ] **KPI-05**: System tracks time-to-first-execution for new users

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Intelligence Layer

- **INTEL-01**: AI suggests strategies based on user's current portfolio state and market conditions
- **INTEL-02**: System provides contextual strategy templates matched to portfolio
- **INTEL-03**: AI explains strategy outcomes post-execution with plain language summary

### Social & Discovery

- **SOCL-01**: User can view leaderboard of top-performing strategies (anonymized)
- **SOCL-02**: User can share strategy results via link
- **SOCL-03**: User can browse strategy marketplace with community-contributed templates

### Expansion

- **EXPN-01**: Cross-chain DeFi user onboarding (bridge + Injective in one flow)
- **EXPN-02**: Mobile PWA with optimized touch UX
- **EXPN-03**: Advanced analytics dashboard with historical performance

## Out of Scope

| Feature | Reason |
|---------|--------|
| Autonomous market prediction / alpha generation | AI는 intent interpreter이지 hedge fund manager가 아님. 방향성 예측은 false expectations 유발 |
| Full autonomous trading bot | 1-2인 팀이 안전하게 구현 불가. Bounded automation만 허용 |
| Real-time chat/conversation UI | 트레이딩에서 chat UI는 나쁜 UX. 단일 입력 → 제안 → 실행 3단계로 제한 |
| Complex trading dashboard / charts | 타겟 사용자가 어렵게 느끼는 것이 바로 대시보드. TradingView/Helix로 링크 |
| Social/copy trading (v1) | Vault 인프라, 수수료 분배 등 massive scope. PMF 이후 고려 |
| Cross-chain support (v1) | 브릿지 통합, 멀티체인 지갑 등 테스팅 범위 급증. Injective-native 먼저 |
| Mobile native app | 1-2인 팀 엔지니어링 서피스 2배. 반응형 웹 우선 |
| Backtesting / paper trading | 히스토리컬 데이터 인프라, 시뮬레이션 엔진 필요. Execution-aware recommendation으로 대체 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| WALL-01 | — | Pending |
| WALL-02 | — | Pending |
| WALL-03 | — | Pending |
| WALL-04 | — | Pending |
| ONBR-01 | — | Pending |
| ONBR-02 | — | Pending |
| ONBR-03 | — | Pending |
| INTNT-01 | — | Pending |
| INTNT-02 | — | Pending |
| AI-01 | — | Pending |
| AI-02 | — | Pending |
| AI-03 | — | Pending |
| AI-04 | — | Pending |
| AI-05 | — | Pending |
| EXEC-01 | — | Pending |
| EXEC-02 | — | Pending |
| EXEC-03 | — | Pending |
| EXEC-04 | — | Pending |
| EXEC-05 | — | Pending |
| DELEG-01 | — | Pending |
| DELEG-02 | — | Pending |
| DELEG-03 | — | Pending |
| DELEG-04 | — | Pending |
| DELEG-05 | — | Pending |
| STRAT-01 | — | Pending |
| STRAT-02 | — | Pending |
| STRAT-03 | — | Pending |
| STRAT-04 | — | Pending |
| MON-01 | — | Pending |
| MON-02 | — | Pending |
| MON-03 | — | Pending |
| MON-04 | — | Pending |
| KPI-01 | — | Pending |
| KPI-02 | — | Pending |
| KPI-03 | — | Pending |
| KPI-04 | — | Pending |
| KPI-05 | — | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 0
- Unmapped: 37 ⚠️

---
*Requirements defined: 2026-03-14*
*Last updated: 2026-03-14 after initial definition*
