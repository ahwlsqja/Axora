export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getSupportedMarkets } from '@/services/injective/spot'

export async function GET() {
  try {
    const markets = await getSupportedMarkets()

    return NextResponse.json({ markets })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Supported markets fetch error:', message)
    return NextResponse.json(
      { error: 'Failed to fetch supported markets', detail: message },
      { status: 500 }
    )
  }
}
