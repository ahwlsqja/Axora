export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { fetchMarketSnapshot } from '@/services/injective/spot'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const marketId = searchParams.get('id')

    if (!marketId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: id' },
        { status: 400 }
      )
    }

    const snapshot = await fetchMarketSnapshot(marketId)

    return NextResponse.json(snapshot)
  } catch (error: unknown) {
    console.error('Market data fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    )
  }
}
