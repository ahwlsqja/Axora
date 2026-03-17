/**
 * PostHog implementation of the AnalyticsProvider interface.
 *
 * Receives the already-initialized posthog-js instance so that
 * initialisation (API key, host) stays in the React provider layer.
 */

import type { PostHog } from 'posthog-js'
import type { AnalyticsProvider } from './index'
import type { AnalyticsEvent } from './events'

export class PostHogAnalyticsProvider implements AnalyticsProvider {
  constructor(private readonly posthog: PostHog) {}

  track(event: AnalyticsEvent): void {
    this.posthog.capture(event.name, event.properties)
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    this.posthog.identify(userId, traits)
  }

  reset(): void {
    this.posthog.reset()
  }
}
