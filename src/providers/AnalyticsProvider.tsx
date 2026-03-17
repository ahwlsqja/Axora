'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'
import { analytics } from '@/services/analytics'
import { PostHogAnalyticsProvider } from '@/services/analytics/posthog'
import { initAnalyticsSubscriptions } from '@/services/analytics/subscriptions'

let initialized = false

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (
      !initialized &&
      typeof window !== 'undefined' &&
      process.env.NEXT_PUBLIC_POSTHOG_KEY
    ) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST ||
          'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
        loaded: (ph) => {
          if (process.env.NODE_ENV === 'development') {
            ph.debug()
          }
        },
      })

      analytics.init(new PostHogAnalyticsProvider(posthog))
      initAnalyticsSubscriptions()
      initialized = true
    }
  }, [])

  return <>{children}</>
}
