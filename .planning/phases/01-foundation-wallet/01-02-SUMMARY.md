---
phase: 01-foundation-wallet
plan: 02
subsystem: wallet
tags: [keplr, metamask, wallet-strategy, zustand, react-query, balance-polling]

# Dependency graph
requires:
  - "Next.js 16 app scaffold (01-01)"
  - "WalletStrategy + MsgBroadcaster singletons (01-01)"
  - "Types and constants (01-01)"
provides:
  - "Wallet connect/disconnect (Keplr + MetaMask)"
  - "Zustand wallet store with session persistence"
  - "Balance polling via React Query (10s interval)"
  - "Header with compressed address + INJ balance"
  - "Wallet selection modal (Radix Dialog)"
  - "Dashboard balance cards"
affects: [01-foundation-wallet, 03-onboarding]

# Tech tracking
tech-stack:
  added: []
  patterns: [zustand-store-with-actions, react-query-polling, localstorage-session-persistence, keplr-suggest-chain]

key-files:
  created:
    - src/services/injective/wallet.ts
    - src/services/injective/bank.ts
    - src/stores/walletStore.ts
    - src/hooks/useWallet.ts
    - src/hooks/useBalances.ts
    - src/components/layout/Header.tsx
    - src/components/wallet/ConnectButton.tsx
    - src/components/wallet/WalletModal.tsx
    - src/components/wallet/WalletInfo.tsx
    - src/components/dashboard/BalanceCard.tsx
    - src/utils/address.ts
  modified:
    - src/app/layout.tsx
    - src/app/page.tsx
    - next.config.ts

key-decisions:
  - "Keplr experimentalSuggestChain required for injective-888 testnet registration"
  - "getKeplr() helper to bypass OKX Wallet's window.keplr override"
  - "wallet-ledger CryptoJS AMD issue resolved via empty module alias in Turbopack"
  - "localStorage session persistence with silent auto-reconnect on page load"

patterns-established:
  - "Zustand store with async actions and toast error handling"
  - "React Query balance polling with DISPLAY_DENOMS filtering"
  - "Radix Dialog for accessible wallet selection modal"
  - "Keplr suggestChain + enable before WalletStrategy connection"

# Metrics
duration: ~20min
completed: 2026-03-16
---

# Phase 1 Plan 2: Wallet Connection and Account Lifecycle Summary

**Wallet connection (Keplr + MetaMask), balance display with auto-polling, and disconnect with session persistence**

## Performance

- **Tasks:** 3 (2 auto + 1 human verification checkpoint)
- **Files modified:** 14

## Accomplishments
- Wallet service: Keplr and MetaMask connection via WalletStrategy with address format conversion
- Zustand wallet store: connection status, address, wallet type with async connect/disconnect actions
- Balance polling: React Query with 10s refetchInterval, filtered by DISPLAY_DENOMS
- Header: app name left, wallet connect button/info right with compressed address + INJ balance
- Wallet modal: Radix Dialog with Keplr/MetaMask options, install detection, install link for missing wallets
- Dashboard: balance cards when connected, "Connect your wallet" prompt when disconnected
- Session persistence: localStorage auto-reconnect on page reload
- Keplr testnet support: experimentalSuggestChain for injective-888

## Task Commits

1. **Task 1: Wallet service, store, and connection hooks** - `de26ea2` (feat)
2. **Task 2: Header, wallet modal, balance cards, and dashboard UI** - `afabbb3` (feat)
3. **Task 2.5: Keplr suggestChain fix** - `6a88139` (fix)
4. **Task 3: Human verification** - approved

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] wallet-ledger CryptoJS AMD module resolution**
- `@injectivelabs/wallet-ledger` bundles CryptoJS with AMD `define()` calls that Turbopack cannot resolve
- Fixed by aliasing `@injectivelabs/wallet-ledger` to empty module in Turbopack config
- Also added `module.noParse` regex for webpack fallback

**2. [Checkpoint Fix] Keplr "no chain info for injective-888"**
- Keplr doesn't ship with Injective testnet chain info by default
- Added `suggestChainToKeplr()` with `experimentalSuggestChain` before connecting
- Added `keplr.enable(chainId)` after suggest

**3. [Checkpoint Fix] OKX Wallet overriding window.keplr**
- OKX Wallet extension injects itself as `window.keplr`
- Added `getKeplr()` helper that checks `window.keplr_wallet_provider` first

## Requirements Delivered
- WALL-01: Keplr wallet connects and app recognizes account ✓
- WALL-02: MetaMask wallet connects via EIP-712 ✓
- WALL-03: INJ balance and assets visible after connecting ✓
- WALL-04: Disconnect clears session state ✓

## Self-Check: PASSED

All key files verified present. Task commits verified in git log. Human checkpoint approved.

---
*Phase: 01-foundation-wallet*
*Completed: 2026-03-16*
