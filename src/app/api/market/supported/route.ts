export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getSupportedMarkets } from '@/services/injective/spot'

export async function GET() {
  try {
    const markets = await getSupportedMarkets()

    return NextResponse.json({ markets })
  } catch (error: unknown) {
    console.error('Supported markets fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supported markets' },
      { status: 500 }
    )
  }
}
