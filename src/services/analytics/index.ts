/**
 * Provider-agnostic analytics service singleton.
 *
 * Usage:
 *   import { analytics } from '@/services/analytics'
 *   analytics.track({ name: 'intent_entered', properties: { source: 'preset' } })
 *
 * The provider (e.g. PostHog) is injected once during app startup via `init()`.
 * Until a provider is set, all calls are silent no-ops.
 */

import type { AnalyticsEvent } from './events'

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

export interface AnalyticsProvider {
  track(event: AnalyticsEvent): void
  identify(userId: string, traits?: Record<string, unknown>): void
  reset(): void
}

// ---------------------------------------------------------------------------
// Service implementation
// ---------------------------------------------------------------------------

class AnalyticsService {
  private provider: AnalyticsProvider | null = null

  /** Attach the concrete provider. Called once from AnalyticsProvider.tsx. */
  init(provider: AnalyticsProvider): void {
    this.provider = provider
  }

  /** Track a typed analytics event. No-op if no provider is set. */
  track(event: AnalyticsEvent): void {
    this.provider?.track(event)
  }

  /** Identify a user (e.g. wallet address). No-op if no provider is set. */
  identify(userId: string, traits?: Record<string, unknown>): void {
    this.provider?.identify(userId, traits)
  }

  /** Reset identity (e.g. on wallet disconnect). No-op if no provider is set. */
  reset(): void {
    this.provider?.reset()
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const analytics = new AnalyticsService()

export type { AnalyticsEvent } from './events'
