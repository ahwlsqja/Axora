# Injective AI Trading Agent

## What This Is

Injective 위에서 AI agent와 consumer-friendly UX를 결합한 트레이딩 제품. 사용자가 복잡한 시장 구조를 이해하지 않아도, 자연어 입력이나 goal-based 인터페이스를 통해 전략을 탐색하고 실행할 수 있도록 돕는다. Injective의 subaccount 구조를 agent account처럼 활용하는 것이 핵심 차별점이다.

## Core Value

사용자의 의도를 Injective에서 실행 가능한 복합 온체인 액션으로 빠르고 안전하게 바꿔주는 것. 시장 예측이 아니라 전략 구조화와 실행이 핵심이다.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Goal-based entry point UX — 사용자가 첫 화면에서 "보수적으로 수익 얻기", "INJ 하락 시 분할매수" 등 목표 기반으로 진입
- [ ] 자연어 의도 입력 — 짧은 자연어로 트레이딩 의도를 입력할 수 있는 인터페이스
- [ ] AI intent interpreter — 사용자 의도를 실행 가능한 전략 파라미터(가격대, 분할 횟수, 주문 크기, 리스크 한도)로 구조화
- [ ] 전략 제안서 UI — AI가 구조화한 전략을 짧고 이해 가능한 형태로 보여주는 제안서
- [ ] Direct signing 모드 — 지갑 연결 후 사용자가 직접 서명하여 전략 실행
- [ ] Subaccount delegation 모드 — Injective subaccount에 제한된 권한 위임 (최대 금액, 허용 시장, 만료 시간 등)
- [ ] 복합 전략 실행 — 분할매수, 조건부 주문, 주문 크기 분배 등 여러 주문을 조합한 strategy execution
- [ ] Execution-aware recommendation — 현재 가격, 변동성, orderbook 유동성 등을 참고하여 비현실적 파라미터 방지
- [ ] 실행 상태/성과 대시보드 — 실행된 전략의 상태와 결과를 쉽게 다시 확인
- [ ] KPI instrumentation — 온체인 실행 수, 반복 사용률, 위임 자금 규모 측정

### Out of Scope

- Full autonomous trading bot — v1은 bounded automation, 사용자 승인 범위 내 실행만
- 시장 방향성 예측/alpha generation — AI는 intent interpreter이지 hedge fund manager가 아님
- 크립토 초보자 온보딩 — v1 타겟은 Injective 기존 유저, 지갑/자금 이해가 있는 사용자
- Real-time chat/social features — 반복 사용성에 집중, 이벤트성 기능 배제
- Cross-chain 지원 — v1은 Injective 전용
- Mobile app — 웹 우선

## Context

- **Target user (v1):** INJ를 보유하고 있거나 Injective 생태계에 관심이 있지만, 직접 트레이딩 전략을 만들고 실행하는 것은 어렵게 느끼는 사용자
- **Target user (v2):** Cross-chain DeFi 유저 중 Injective 신규 진입자
- **Target user (later):** Simplified onboarding을 통한 broader retail users
- **Product positioning:** Infra provider가 아니라, Injective infra 위에 올라가는 사용자 경험 레이어
- **AI 역할 정의:** Intent interpreter + strategy structuring layer. 시장 예측이 아닌 전략 구조화. 데이터는 execution-aware recommendation에만 사용
- **Injective 활용:** Subaccount 구조를 agent account로 활용 — 이것이 제품의 핵심 차별점
- **팀 규모:** 1~2인 팀으로 MVP 구현 가능해야 함
- **Ninja Labs 관점:** 기존 관심 유저의 온체인 실행 빈도와 product engagement 향상이 초기 목표

## Product Principles

- 첫 화면에서 이해 가능해야 한다
- 첫 세션에서 액션이 발생해야 한다
- 온체인 실행과 KPI가 직접 연결되어야 한다
- 이벤트성 기능보다 반복 사용성이 중요하다
- 정보 탐색보다 빠른 첫 실행에 집중

## Success Metrics

| 단계 | 핵심 지표 | 설명 |
|------|-----------|------|
| 초기 (v1) | 온체인 실행 수 | 실제 전략 실행을 발생시킨 활성 사용자 수 |
| PMF 검증 | 반복 사용률 | 한 번 써본 사용자의 재실행률, 주간/월간 재방문율 |
| 신뢰 확장 | 위임 자금 규모 (TVL) | Subaccount에 위임된 자금 규모 |

**v1 북극성 지표:** 실제 전략 실행을 발생시킨 활성 사용자 수

## Constraints

- **팀 규모**: 1~2인 — MVP는 소규모 팀이 구현 가능한 범위여야 함
- **Tech stack**: 아직 열려있음 — 연구 단계에서 결정
- **Execution boundary**: v1에서는 bounded automation만 — 사용자가 명시적으로 승인한 범위 내에서만 실행
- **UX 복잡도**: 토스식 단순 UX — 의도 선택/입력 → 짧은 제안 확인 → 바로 실행

## User Journey (v1)

```
의도 선택/입력 → AI 전략 구조화 → 짧은 제안 확인 → 바로 실행 → 상태/성과 확인
```

**첫 세션 플로우:**
1. 앱 진입 → "지금 바로 할 수 있는 액션" (goal-based entry points) 표시
2. 목표 선택 또는 자연어 의도 입력
3. AI가 실행 가능한 전략으로 구조화 → 짧은 제안서로 제시
4. 핵심 파라미터와 예상 동작 확인 → 실행
5. 실행 상태와 성과를 쉽게 재확인

**실행 모드 전환:**
- 신규 사용자: Direct signing (지갑 연결 → 직접 서명)
- 파워 유저: Subaccount delegation (제한된 권한 위임 → agent 대신 실행)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AI는 시장 예측이 아닌 전략 구조화 역할 | 예측 정확도보다 실행 가능한 구조화가 consumer product에 적합 | — Pending |
| Subaccount를 agent account로 활용 | Injective-native 차별점, bounded delegation model 구현 가능 | — Pending |
| v1 타겟은 Injective 기존 유저 | 온보딩 현실성, KPI 적합성, 제품 가치 전달 속도 | — Pending |
| Direct signing + delegation 두 모드 모두 v1에 포함 | 신뢰 장벽 해소와 제품 차별점을 동시에 확보 | — Pending |
| Bounded automation (완전 자율 운용 배제) | 사용자 통제 하의 실행만 허용, 신뢰와 안전성 우선 | — Pending |

---
*Last updated: 2026-03-14 after initialization*
