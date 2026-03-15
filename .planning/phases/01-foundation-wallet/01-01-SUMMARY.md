---
phase: 01-foundation-wallet
plan: 01
subsystem: infra
tags: [next.js, injective-sdk, wallet-strategy, tailwindcss, react-query, turbopack]

# Dependency graph
requires: []
provides:
  - "Next.js 16 app scaffold with Tailwind CSS"
  - "WalletStrategy + MsgBroadcaster lazy singletons"
  - "Network fallback utility (withFallback)"
  - "App-wide types (WalletType, ConnectionStatus, OnboardingStep, TokenBalance)"
  - "Constants (AGENT_SUBACCOUNT_NONCE, SPOT_MSG_TYPES, DISPLAY_DENOMS)"
  - "React Query + Sonner provider wrapping app"
affects: [01-foundation-wallet, 02-wallet-connect, 03-onboarding]

# Tech tracking
tech-stack:
  added: [next@16.1.6, react@19, typescript@5.9, tailwindcss, "@injectivelabs/sdk-ts", "@injectivelabs/wallet-strategy", "@injectivelabs/wallet-core", "@injectivelabs/networks", zustand, "@tanstack/react-query", sonner, "@radix-ui/react-dialog", "@radix-ui/react-slider"]
  patterns: [lazy-singleton-with-ssr-guard, proxy-based-convenience-exports, endpoint-fallback-retry]

key-files:
  created:
    - src/services/injective/client.ts
    - src/services/injective/network.ts
    - src/services/index.ts
    - src/types/index.ts
    - src/utils/constants.ts
    - src/providers/QueryProvider.tsx
    - src/app/layout.tsx
    - src/app/page.tsx
    - next.config.ts
  modified: []

key-decisions:
  - "Used Next.js 16 with Turbopack (default) instead of webpack-only config"
  - "MsgBroadcaster imported from @injectivelabs/wallet-core (not sdk-ts where it does not exist)"
  - "WalletStrategy strategies={} empty -- strategies are lazy-loaded on setWallet()"
  - "Proxy-based convenience exports for walletStrategy/msgBroadcaster to maintain singleton laziness"

patterns-established:
  - "Lazy singleton with SSR guard: typeof window check before instantiation"
  - "Network fallback: withFallback() tries endpoints sequentially, logs warnings"
  - "Provider stack: QueryClientProvider + Sonner Toaster in single QueryProvider component"

# Metrics
duration: 14min
completed: 2026-03-15
---

# Phase 1 Plan 1: Project Scaffold & Injective Client Summary

**Next.js 16 scaffold with Injective SDK (WalletStrategy + MsgBroadcaster) lazy singletons, network fallback, and React Query provider**

## Performance

- **Duration:** 14 min
- **Started:** 2026-03-15T16:27:17Z
- **Completed:** 2026-03-15T16:41:08Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- Next.js 16 app running on localhost:3000 with Tailwind CSS and TypeScript
- Injective SDK packages installed (wallet-strategy, sdk-ts, networks, wallet-core, wallet-cosmos, wallet-evm)
- WalletStrategy + MsgBroadcaster lazy singletons with SSR guard and proxy convenience exports
- Network fallback utility with sequential endpoint retry
- React Query + Sonner toast provider wrapping the app
- Constants defined: AGENT_SUBACCOUNT_NONCE=1, SPOT_MSG_TYPES (4 entries), DISPLAY_DENOMS, NETWORK

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js project with all dependencies** - `b938ae6` (feat)
2. **Task 2: Create Injective client services, network fallback, types, and constants** - `949c82a` (feat)

## Files Created/Modified
- `package.json` - Next.js 16 project with all Injective SDK and UI dependencies
- `next.config.ts` - Turbopack + webpack config for Node.js polyfill handling
- `tsconfig.json` - TypeScript config with path aliases (@/*)
- `tailwind.config.ts` - Tailwind CSS content configuration
- `postcss.config.mjs` - PostCSS with @tailwindcss/postcss plugin
- `src/app/layout.tsx` - Root layout with Inter font, metadata, QueryProvider
- `src/app/page.tsx` - Placeholder page showing "Injective Agent"
- `src/app/globals.css` - Tailwind CSS import
- `src/services/injective/client.ts` - WalletStrategy + MsgBroadcaster lazy singletons
- `src/services/injective/network.ts` - Network endpoints + withFallback utility
- `src/services/index.ts` - Barrel exports for services
- `src/types/index.ts` - WalletType, ConnectionStatus, OnboardingStep, TokenBalance
- `src/utils/constants.ts` - AGENT_SUBACCOUNT_NONCE, SPOT_MSG_TYPES, DISPLAY_DENOMS, NETWORK
- `src/providers/QueryProvider.tsx` - React Query + Sonner provider
- `src/utils/empty-module.ts` - Browser polyfill for Node.js built-ins
- `.env.local` - NEXT_PUBLIC_NETWORK=testnet
- `.env.example` - Environment variable template
- `.gitignore` - Standard Next.js gitignore

## Decisions Made
- **MsgBroadcaster location:** Imported from `@injectivelabs/wallet-core` instead of `@injectivelabs/sdk-ts`. The browser MsgBroadcaster that works with WalletStrategy lives in wallet-core; sdk-ts only exports MsgBroadcasterWithPk (private key variant for backend).
- **Next.js 16 Turbopack:** Added `turbopack: {}` config alongside webpack config since Next.js 16 defaults to Turbopack and errors when only webpack config is present.
- **WalletStrategy strategies param:** Passed `strategies: {}` (empty) since the new WalletStrategy lazy-loads strategies on `setWallet()` call. This satisfies the required TypeScript interface.
- **Proxy-based exports:** Used `Proxy` for `walletStrategy` and `msgBroadcaster` convenience exports to maintain lazy initialization while allowing direct import syntax.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Next.js 16 Turbopack config requirement**
- **Found during:** Task 1 (build verification)
- **Issue:** Next.js 16 defaults to Turbopack and errors when only `webpack` config is present without `turbopack` config
- **Fix:** Added `turbopack: { resolveAlias: {...} }` config alongside webpack config, created `src/utils/empty-module.ts` for browser polyfills
- **Files modified:** next.config.ts, src/utils/empty-module.ts
- **Verification:** Build completes successfully
- **Committed in:** b938ae6 (Task 1 commit)

**2. [Rule 3 - Blocking] MsgBroadcaster not in sdk-ts**
- **Found during:** Task 2 (client.ts creation)
- **Issue:** Plan specified importing MsgBroadcaster from `@injectivelabs/sdk-ts` but it only exports MsgBroadcasterWithPk there. Browser MsgBroadcaster is in `@injectivelabs/wallet-core`.
- **Fix:** Changed import to `@injectivelabs/wallet-core`
- **Files modified:** src/services/injective/client.ts
- **Verification:** Build passes, type checks pass
- **Committed in:** 949c82a (Task 2 commit)

**3. [Rule 3 - Blocking] WalletStrategy requires strategies parameter**
- **Found during:** Task 2 (client.ts creation)
- **Issue:** WalletStrategyArguments interface requires `strategies` property (not optional)
- **Fix:** Added `strategies: {}` to constructor args (strategies are lazy-loaded on setWallet)
- **Files modified:** src/services/injective/client.ts
- **Verification:** Build passes, WalletStrategy instantiates correctly
- **Committed in:** 949c82a (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 blocking issues)
**Impact on plan:** All fixes necessary to resolve build errors from SDK API differences and Next.js 16 changes. No scope creep.

## Issues Encountered
- create-next-app refused to run in non-empty directory (had .git/ and .planning/). Resolved by manual project initialization as specified in the plan's fallback instructions.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Foundation complete: Next.js app running, all SDK packages installed
- WalletStrategy and MsgBroadcaster ready for wallet connection implementation (Plan 02)
- Types (WalletType, ConnectionStatus) ready for wallet store (Plan 02)
- Constants (SPOT_MSG_TYPES, AGENT_SUBACCOUNT_NONCE) ready for onboarding flow (Plan 03)

## Self-Check: PASSED

All 11 key files verified present. Both task commits (b938ae6, 949c82a) verified in git log.

---
*Phase: 01-foundation-wallet*
*Completed: 2026-03-15*
