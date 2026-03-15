# Phase 2: Intent Entry UX - Research

**Researched:** 2026-03-16
**Domain:** UI/UX for goal-based intent capture, Next.js App Router, Zustand state, Tailwind CSS
**Confidence:** HIGH

## Summary

Phase 2 is a pure frontend/UX phase. It transforms the landing page from a wallet-gated dashboard into a browsable intent discovery surface. Users see 5-8 goal-based preset cards without connecting a wallet, and can type free-text natural language intents. Wallet connection is deferred to execution time. No AI parsing happens in this phase -- the captured intent is stored in local state for Phase 3 to consume.

The existing codebase (Next.js 16, Tailwind v4, Zustand, Radix UI, React 19) provides everything needed. No new libraries are required. The primary challenge is architectural: the current `page.tsx` is entirely wallet-gated (`status !== 'connected'` shows "Connect your wallet"), so it must be restructured to show intent cards by default, with wallet-dependent sections (balances, agent account) rendered conditionally after connection.

**Primary recommendation:** Restructure the landing page to show intent cards as the primary content regardless of wallet state. Create an `intentStore` in Zustand to hold the selected/typed intent. Gate wallet connection to the "proceed to execute" step, not the browsing step.

## Standard Stack

### Core (Already Installed -- No New Dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | ^16.1.6 | App Router, pages, routing | Already in project |
| React | ^19.2.4 | Component rendering | Already in project |
| Tailwind CSS | ^4.2.1 | Utility-first styling | Already in project |
| Zustand | ^5.0.11 | Client state (intent store) | Already used for wallet/onboarding stores |
| @radix-ui/react-dialog | ^1.1.15 | Modal for wallet connect prompt | Already installed |

### Supporting (Already Available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | ^2.0.7 | Toast notifications | Feedback on intent selection |
| next/link | built-in | Client-side navigation | Navigate from intent to next step |

### No New Dependencies Needed
This phase is purely UI composition using existing stack. No form libraries, animation libraries, or i18n libraries are needed for this scope.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── page.tsx                    # Restructured landing: intent cards + optional dashboard
├── components/
│   └── intent/
│       ├── IntentCard.tsx          # Single preset intent card
│       ├── IntentCardGrid.tsx      # Grid of 5-8 intent cards
│       ├── FreeTextInput.tsx       # Natural language text input
│       └── IntentSection.tsx       # Combines cards + free text input
├── stores/
│   └── intentStore.ts             # Selected intent state
├── types/
│   └── index.ts                   # Add IntentType, PresetIntent types
└── constants/
    └── intents.ts                 # Preset intent definitions (static data)
```

### Pattern 1: Intent Data Model
**What:** Static preset intent definitions as typed constants, not fetched from API.
**When to use:** Always for Phase 2. AI-generated intents come in Phase 3.
**Example:**
```typescript
// src/constants/intents.ts
export interface PresetIntent {
  id: string
  titleKo: string
  titleEn: string
  descriptionKo: string
  descriptionEn: string
  icon: string        // emoji or icon identifier
  category: 'accumulate' | 'protect' | 'profit' | 'entry'
}

export const PRESET_INTENTS: PresetIntent[] = [
  {
    id: 'dca-inj',
    titleKo: 'INJ 분할매수',
    titleEn: 'DCA into INJ',
    descriptionKo: '정해진 가격 구간에서 나눠서 매수',
    descriptionEn: 'Split buys across a price range',
    icon: 'layers',
    category: 'accumulate',
  },
  {
    id: 'stop-loss',
    titleKo: '손절 설정',
    titleEn: 'Set stop-loss',
    descriptionKo: '가격 하락 시 자동 매도',
    descriptionEn: 'Auto-sell on price drop',
    icon: 'shield',
    category: 'protect',
  },
  // ... 5-8 total
]
```

### Pattern 2: Intent Store (Zustand)
**What:** Minimal Zustand store to capture user's intent choice, matching existing store patterns.
**When to use:** When user selects a preset card or submits free text.
**Example:**
```typescript
// src/stores/intentStore.ts
import { create } from 'zustand'

type IntentSource = 'preset' | 'freetext'

interface IntentState {
  // What the user selected/typed
  selectedPresetId: string | null
  freeText: string
  source: IntentSource | null

  // Actions
  selectPreset: (presetId: string) => void
  setFreeText: (text: string) => void
  submitFreeText: () => void
  clear: () => void
}

export const useIntentStore = create<IntentState>((set, get) => ({
  selectedPresetId: null,
  freeText: '',
  source: null,

  selectPreset: (presetId) =>
    set({ selectedPresetId: presetId, freeText: '', source: 'preset' }),

  setFreeText: (text) =>
    set({ freeText: text }),

  submitFreeText: () => {
    const { freeText } = get()
    if (freeText.trim()) {
      set({ selectedPresetId: null, source: 'freetext' })
    }
  },

  clear: () =>
    set({ selectedPresetId: null, freeText: '', source: null }),
}))
```

### Pattern 3: Landing Page Restructure
**What:** The current page.tsx shows "Connect your wallet" when disconnected. It must be restructured so intent cards are always visible, and wallet-dependent sections (balances, agent account) appear below only when connected.
**When to use:** This is the core change of Phase 2.
**Layout:**
```
[Header with wallet connect button]           -- already exists
[Intent Section: cards + free text]           -- NEW, always visible
[Dashboard: balances, agent account]          -- existing, only when connected
```

### Pattern 4: Wallet Gate at Execution, Not Browsing
**What:** When user selects an intent and tries to proceed, check wallet status. If not connected, prompt wallet modal. If connected, navigate to next step.
**When to use:** On "proceed" action from intent selection.
**Example:**
```typescript
const handleProceed = () => {
  if (status !== 'connected') {
    // Open wallet modal instead of navigating
    setWalletModalOpen(true)
    return
  }
  // Navigate to next step (Phase 3 will add AI parsing)
  router.push('/strategy') // or next step route
}
```

### Anti-Patterns to Avoid
- **Wallet-gating the entire page:** The current pattern shows nothing when disconnected. Phase 2 must invert this -- intent browsing is the default, wallet is optional.
- **Over-engineering the intent model:** Phase 2 captures intent as a string/ID only. Do NOT build strategy parameter forms, price inputs, or AI parsing -- those are Phase 3.
- **Building a chat-like input:** PROJECT.md explicitly says "No chat UI." The free-text input is a single input field (like a search bar), not a conversation.
- **Premature i18n framework:** The app serves Korean + English bilingual users, but the preset cards can use dual-language labels (titleKo/titleEn) without a full i18n library. Keep it simple for now.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal dialogs | Custom modal | Radix Dialog (already installed) | Focus trapping, accessibility, escape key handling |
| Toast notifications | Custom notification system | sonner (already installed) | Already used in wallet flow |
| State management | React context + reducers | Zustand (already installed) | Consistent with existing walletStore/onboardingStore patterns |
| Form validation for free text | Complex validation logic | Simple length check + trim | Phase 2 only captures text, validation of intent semantics is Phase 3 (AI) |

**Key insight:** This phase intentionally has NO complex problems that need libraries. It is a UI composition phase. The danger is over-engineering it by pulling in libraries for problems that don't exist yet.

## Common Pitfalls

### Pitfall 1: Wallet-gating the browsing experience
**What goes wrong:** The current page.tsx renders nothing useful without wallet connection. If this pattern leaks into intent cards, it violates ONBR-01 and ONBR-02.
**Why it happens:** Copy-pasting the existing conditional rendering pattern.
**How to avoid:** Intent section renders unconditionally. Only the "execute" action checks wallet status.
**Warning signs:** Any `if (status !== 'connected') return null` around intent components.

### Pitfall 2: Building Phase 3 features into Phase 2
**What goes wrong:** Adding AI parsing, strategy parameter forms, price inputs, or market data to intent cards.
**Why it happens:** Natural instinct to make the feature "complete."
**How to avoid:** Phase 2 output is: `{ presetId: string } | { freeText: string }`. Nothing more. No parameters, no market data, no AI calls.
**Warning signs:** Any API calls, any form fields beyond the single text input, any imports from `@injectivelabs/sdk-ts` in intent components.

### Pitfall 3: Breaking the existing dashboard
**What goes wrong:** Restructuring page.tsx destroys the working balance display and agent account card.
**Why it happens:** The entire page needs to be reorganized from wallet-first to intent-first.
**How to avoid:** Extract the existing dashboard content into a `DashboardSection` component. Place intent section above it. Keep the dashboard rendering logic intact.
**Warning signs:** Losing the balance card display or agent account card after the restructure.

### Pitfall 4: Inconsistent styling with existing components
**What goes wrong:** New intent cards look visually different from existing balance cards and onboarding components.
**Why it happens:** Not referencing existing component styles.
**How to avoid:** Follow the established patterns: `rounded-2xl border border-gray-100 bg-white p-5 shadow-sm` for cards, Inter font, gray-900/gray-500 text hierarchy, blue-* accent colors.
**Warning signs:** New color palettes, different border-radius values, inconsistent spacing.

### Pitfall 5: No clear "next step" after intent selection
**What goes wrong:** User selects an intent card but nothing happens or the flow dead-ends.
**Why it happens:** Phase 3 (AI parsing) doesn't exist yet, so there's no destination.
**How to avoid:** Create a placeholder confirmation state. After selecting a preset or submitting free text, show a brief confirmation with "Continue" that either prompts wallet connection or shows a "coming soon" state. The important thing is the intent is captured in the store.
**Warning signs:** Intent selection has no visual feedback, no state change, no call to action.

## Code Examples

### Intent Card Component (following existing card patterns)
```typescript
// src/components/intent/IntentCard.tsx
'use client'

import type { PresetIntent } from '@/constants/intents'

interface IntentCardProps {
  intent: PresetIntent
  selected: boolean
  onSelect: (id: string) => void
}

export function IntentCard({ intent, selected, onSelect }: IntentCardProps) {
  return (
    <button
      onClick={() => onSelect(intent.id)}
      className={`w-full rounded-2xl border p-5 text-left transition-colors ${
        selected
          ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-200'
          : 'border-gray-100 bg-white shadow-sm hover:border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div className="text-sm font-medium text-gray-900">
        {intent.titleKo}
      </div>
      <div className="mt-0.5 text-xs text-gray-500">
        {intent.titleEn}
      </div>
      <div className="mt-2 text-xs text-gray-400">
        {intent.descriptionKo}
      </div>
    </button>
  )
}
```

### Free Text Input (search-bar style, not chat)
```typescript
// src/components/intent/FreeTextInput.tsx
'use client'

import { useState } from 'react'

interface FreeTextInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}

export function FreeTextInput({ value, onChange, onSubmit }: FreeTextInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      onSubmit()
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="무엇을 하고 싶으세요? (예: INJ가 떨어지면 분할매수)"
        className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      {value.trim() && (
        <button
          onClick={onSubmit}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          Enter
        </button>
      )}
    </div>
  )
}
```

### Restructured Landing Page (intent-first, dashboard-second)
```typescript
// src/app/page.tsx -- structural outline
'use client'

export default function Home() {
  const { status } = useWallet()

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Always visible: Intent discovery */}
      <IntentSection />

      {/* Conditionally visible: Dashboard (when wallet connected) */}
      {status === 'connected' && <DashboardSection />}
    </main>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Wallet-first UX (connect to see anything) | Browse-first UX (explore then connect) | Industry trend 2024-2025 | Users explore before committing. Reduces bounce rate. |
| Complex trading forms | Goal-based preset cards | DeFi UX evolution 2024-2025 | Lower cognitive load, faster time to action |
| English-only DeFi apps | Bilingual/localized UX | Growing trend | Korean market specifically expects Korean-first UX |

**Relevant to this phase:**
- Zustand v5 (current): No API changes from v4 that affect store patterns. The existing store pattern (`create<State>((set, get) => ({...}))`) is correct for v5.
- Tailwind v4 (current): The project uses `@import "tailwindcss"` in globals.css, which is the v4 pattern. Utility classes are the same.
- React 19 (current): No new patterns needed for this phase. Standard hooks (`useState`, `useCallback`) are sufficient.

## Open Questions

1. **Where does the user go after selecting an intent?**
   - What we know: Phase 3 will add AI parsing and strategy proposal. Phase 2 just captures the intent.
   - What's unclear: Should Phase 2 create a `/strategy` or `/intent/[id]` route as a placeholder, or just show an inline confirmation?
   - Recommendation: Create an inline confirmation state within the landing page (not a new route). When Phase 3 is built, it can introduce the route. This avoids dead-end routes.

2. **Exact list of 5-8 preset intents**
   - What we know: Requirements mention "DCA into INJ", "Set stop-loss", "Scale into dip", "Take partial profit", "Limit buy at discount"
   - What's unclear: That's 5 intents. Should there be more? What are the remaining 1-3?
   - Recommendation: Start with 6 intents. The 5 from requirements plus "Grid trading" or "Range-bound accumulation". The exact list is a product decision that can be adjusted easily since it's a constant array.

3. **Bilingual display strategy**
   - What we know: Target users are Korean + English bilingual. PROJECT.md says Korean-first.
   - What's unclear: Should cards show both languages simultaneously, or should there be a language toggle?
   - Recommendation: Show both languages on each card (Korean primary, English secondary in smaller text). No language toggle needed for v1. This is the simplest approach and matches the bilingual user profile.

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis: `src/app/page.tsx`, `src/stores/walletStore.ts`, `src/stores/onboardingStore.ts`, `src/components/` -- direct code inspection
- `package.json` -- verified all library versions
- `.planning/PROJECT.md` -- product principles, UX constraints, user journey
- `.planning/REQUIREMENTS.md` -- ONBR-01, ONBR-02, INTNT-01, INTNT-02 specifications

### Secondary (MEDIUM confidence)
- Zustand v5, Tailwind v4, React 19, Next.js 16 patterns -- based on training data, consistent with observed codebase usage

### Tertiary (LOW confidence)
- None. This phase uses no novel libraries or patterns requiring external verification.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, everything already installed and used
- Architecture: HIGH -- follows established codebase patterns (Zustand stores, component folders, Tailwind styling)
- Pitfalls: HIGH -- derived from direct analysis of current page.tsx structure and requirements

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable -- no external dependencies or fast-moving APIs)
