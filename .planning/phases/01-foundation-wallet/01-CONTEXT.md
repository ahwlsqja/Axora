# Phase 1: Foundation & Wallet - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

사용자가 지갑을 연결하고 Injective 체인과 상호작용할 수 있는 기반을 구축한다. Keplr/MetaMask 지갑 연결, 계정 인식, 잔액 조회, 세션 관리, 기본 트랜잭션 구성 및 브로드캐스트가 포함된다. 트레이딩 기능, AI 엔진, 실행 로직은 이후 페이즈에서 다룬다.

</domain>

<decisions>
## Implementation Decisions

### 프로젝트 구조
- **Next.js** 프론트엔드 프레임워크
- **마이크로서비스** 아키텍처, 각 서비스를 **개별 Git 레포**로 관리
- **TypeScript (Node.js)** 백엔드 (프론트엔드와 언어 통일, Injective TS SDK 활용)
- 초기 서비스 분리: Web(Next.js), API, AI Engine 각각 독립 레포

### 지갑 연결 UX
- **헤더 우측 상단**에 지갑 연결 버튼 배치
- **모달**로 지갑 선택 화면 표시 (Keplr / MetaMask 옵션)
- 연결 후 헤더에 **압축 주소 + INJ 잔액** 표시
- 지갑 미설치 시 **설치 페이지 링크 안내**
- **테스트넷 우선** 연결 (MVP 단계)
- 지갑에서 체인 전환 시 **자동 전환** — 앱이 지갑의 네트워크를 따라감

### 네트워크 설정
- RPC 엔드포인트 **동적 폴백** — 여러 엔드포인트를 두고 장애 시 자동 전환
- 테스트넷/메인넷 전환은 **지갑의 네트워크 설정을 자동 감지**하여 따라감 (UI에 별도 전환 버튼 없음)

### 계정 정보 표시
- **대시보드 카드** 형태로 잔액 표시
- **INJ + 주요 토큰** (USDT, ATOM 등) 표시
- **토큰 수량만** 표시 (USD 환산 없음)
- **자동 폴링**으로 잔액 새로고침
- 지갑 미연결 시 **"지갑을 연결해주세요"** 안내 메시지

### Claude's Discretion
- 세션 유지 방식 (자동 재연결 등)
- 에러 표시 방식 (토스트/모달 등)
- 체인 연결 상태 표시 수준
- Injective가 아닌 네트워크 연결 시 처리 방식

</decisions>

<specifics>
## Specific Ideas

- 초기 타겟은 **Injective 기존 유저** — DeFi에 익숙한 사용자 대상
- "토스식 단순 UX" 지향 — 복잡한 선택지를 줄이고 핵심 플로우에 집중
- MVP에서는 실시간 오더북 스트리밍 대신 **Injective 공식 API 스냅샷 데이터**로 검증 로직 단순화 가능 (Phase 3 참고)
- AI 출력은 반드시 **Zod JSON Schema로 강제 검증** — AI 원문이 아닌 파싱된 정형 데이터(숫자, 횟수, 조건)만 UI에 렌더링하여 사용자가 최종 확인 (Phase 3 참고)

</specifics>

<deferred>
## Deferred Ideas

- **Subaccount-first 아키텍처** — Direct Signing(Phase 4)을 생략하고, 첫 세션에서 Subaccount 생성 + 소액 예산 위임(Deposit & Grant) 플로우에 집중하는 방안. "토스식 단순 UX"에 더 부합할 수 있음. → 로드맵 재구성 검토 필요
- **에이전트 레이어 역할 분리** — Subaccount AI 자동화 시 트레이딩, 결제, 승인, 검증을 각각 별도 레이어 에이전트로 분리하여 안정성 확보 → Phase 7에서 다룰 것
- **Go 마이크로서비스 (데이터 레이어)** — Goroutine + Channel로 Injective gRPC 스트림을 가볍게 구독하는 별도 서비스. 실시간 오더북 뎁스, 틱 데이터 처리용 → Phase 3/4에서 검토
- **AI Hallucination 방지** — LLM이 $10.5를 $105로 파싱하는 등의 위험. Zod/Struct 태그로 출력 강제, 정형 데이터만 렌더링, 사용자 최종 확인 필수 → Phase 3에서 다룰 것

</deferred>

---

*Phase: 01-foundation-wallet*
*Context gathered: 2026-03-15*
