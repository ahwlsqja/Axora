---
phase: 01-foundation-wallet
plan: 03
subsystem: onboarding
tags: [subaccount, authz, deposit, onboarding-ui, msg-deposit]

# Dependency graph
requires:
  - "Wallet connection + balance display (01-02)"
  - "WalletStrategy + MsgBroadcaster singletons (01-01)"
  - "Constants: AGENT_SUBACCOUNT_NONCE, SPOT_MSG_TYPES (01-01)"
provides:
  - "Subaccount ID generation (nonce 1)"
  - "AuthZ grant creation (4 spot msg types, 7-day expiry)"
  - "Batched onboarding transaction (deposit only for Phase 1)"
  - "3-step onboarding UI (connect -> explain -> deposit)"
  - "Subaccount balance display on dashboard"
affects: [04-delegated-execution]

# Tech tracking
tech-stack:
  added: []
  patterns: [batched-msg-broadcast, subaccount-nonce-generation, wei-to-human-conversion]

key-files:
  created:
    - src/services/injective/subaccount.ts
    - src/services/injective/authz.ts
    - src/services/injective/onboarding.ts
    - src/stores/onboardingStore.ts
    - src/hooks/useOnboarding.ts
    - src/hooks/useSubaccountBalance.ts
    - src/components/onboarding/OnboardingStepper.tsx
    - src/components/onboarding/StepConnect.tsx
    - src/components/onboarding/StepExplain.tsx
    - src/components/onboarding/StepDeposit.tsx
    - src/app/onboarding/page.tsx
  modified:
    - src/app/page.tsx
    - src/services/injective/wallet.ts

key-decisions:
  - "AuthZ self-grants rejected by chain (grantee==granter). Deposit only for Phase 1; grants deferred to Phase 4 when agent address exists"
  - "Subaccount nonce 1 confirmed working on testnet"
  - "Wei-to-INJ conversion needed for subaccount balance display (BigInt division by 10^18)"
  - "ensureCorrectNetwork takes walletType param to avoid triggering wrong wallet"
  - "MetaMask provider detection via providers array to bypass Rainbow Wallet override"

patterns-established:
  - "Batched MsgBroadcaster.broadcast with multiple msgs in single tx"
  - "Subaccount ID: ethAddress.toLowerCase() + '0'.repeat(23) + nonce"
  - "BigInt wei conversion for chain amounts"

# Metrics
duration: ~25min
completed: 2026-03-16
---

# Phase 1 Plan 3: Subaccount Creation, Deposit, and Onboarding Summary

**3-step onboarding flow with subaccount deposit on Injective testnet**

## Performance

- **Tasks:** 3 (2 auto + 1 human verification checkpoint)
- **Files modified:** 18

## Accomplishments
- Subaccount ID generation using nonce 1 (not 0)
- AuthZ grant service (4 spot msg types, 7-day expiry) — implemented but deferred from tx
- Onboarding transaction: MsgDeposit to agent subaccount via MsgBroadcaster
- 3-step onboarding UI: connect → agent account explanation → deposit amount + approve
- Deposit slider with Radix UI, recommended amount, manual input
- Transaction summary display
- Dashboard agent subaccount balance card with wei-to-INJ conversion
- Onboarding success redirect to dashboard

## Task Commits

1. **Task 1: Subaccount, AuthZ, and onboarding services** - `05b67a8` (feat)
2. **Task 2: Onboarding UI -- 3-step flow** - `f04f68e` (feat)
3. **Task 2.5: Checkpoint fixes** - `484e9e0` (fix)
4. **Task 3: Human verification** - approved

## Deviations from Plan

### Checkpoint-discovered Issues

**1. [Blocking] AuthZ self-grant rejected by chain**
- Chain returns "grantee and granter should be different"
- Plan intended self-grant as placeholder; chain does not allow it
- Fix: Deposit only for Phase 1. AuthZ grants deferred to Phase 4 when agent service has its own address
- authz.ts service code retained for Phase 4 use

**2. [Blocking] Subaccount balance displayed in wei**
- `availableBalance` from IndexerGrpcAccountApi returns wei (10^18 scale)
- Fix: Added BigInt wei-to-INJ conversion in dashboard

**3. [Blocking] Hydration mismatch on wallet installed check**
- `isWalletInstalled` returns different values on SSR vs client
- Fix: Deferred check to client mount via useState + useEffect

**4. [Blocking] Rainbow Wallet overriding window.ethereum**
- Rainbow intercepts MetaMask calls via window.ethereum
- Fix: Added getMetaMaskProvider() with providers array detection
- Note: Full fix deferred — Keplr used for testing

**5. [UX] Deposit slider not working with 0 balance**
- min == max == 0.01 when balance is 0
- Fix: Set max to at least 1 INJ for testnet usability

**6. [UX] INJ label overlapping input value**
- Absolute positioned "INJ" text over right-aligned number
- Fix: Changed to flex layout with separate INJ label

**7. [Blocking] ensureCorrectNetwork triggering Rainbow**
- Function was calling both Keplr and MetaMask network setup
- Fix: Accept walletType param, only touch the active wallet

## Requirements Delivered
- DELEG-01: User can create agent subaccount with deposited funds ✓
- DELEG-02: AuthZ grant code implemented but deferred from tx (chain rejects self-grants) — partial, completes in Phase 4
- SC-4: Step-by-step onboarding with single signature ✓
- SC-5: Subaccount created with deposited funds ✓ (grants deferred)
- SC-7: Application can broadcast transactions on testnet ✓

## Self-Check: PASSED

All key files verified present. Task commits verified in git log. Human checkpoint approved.

---
*Phase: 01-foundation-wallet*
*Completed: 2026-03-16*
