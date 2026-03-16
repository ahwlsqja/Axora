export const runtime = 'nodejs'

import { generateText, Output, NoObjectGeneratedError } from 'ai'
import { NextResponse } from 'next/server'
import { getModel } from '@/lib/ai/provider'
import { strategyProposalSchema } from '@/lib/ai/schemas'
import { buildSystemPrompt, getPromptForIntent } from '@/lib/ai/prompts'
import { fetchMarketSnapshot } from '@/services/injective/spot'
import { validateProposal } from '@/lib/strategy/validator'
import type { StrategyGenerationRequest } from '@/lib/strategy/types'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StrategyGenerationRequest

    const { presetId, freeText, source, marketId } = body

    // Validate inputs
    if (source !== 'preset' && source !== 'freetext') {
      return NextResponse.json(
        { error: 'Invalid source: must be "preset" or "freetext"' },
        { status: 400 }
      )
    }

    if (!marketId || typeof marketId !== 'string') {
      return NextResponse.json(
        { error: 'marketId is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Truncate freeText to 500 chars
    const safeFreeText = typeof freeText === 'string' ? freeText.slice(0, 500) : ''

    // Fetch market snapshot for context and validation
    const market = await fetchMarketSnapshot(marketId)

    // Build prompts
    const userPrompt = getPromptForIntent(presetId ?? null, safeFreeText, source)

    // Call LLM with structured output
    const result = await generateText({
      model: getModel(source),
      system: buildSystemPrompt(market),
      prompt: userPrompt,
      output: Output.object({ schema: strategyProposalSchema }),
    })

    if (result.output === null || result.output === undefined) {
      return NextResponse.json(
        { error: 'AI could not generate a valid strategy proposal' },
        { status: 500 }
      )
    }

    const proposal = result.output

    // Inject market context that AI shouldn't generate
    proposal.marketId = marketId
    // baseDenom and quoteDenom could be set from market data if available

    // Post-validate against market reality
    const validation = validateProposal(proposal, market)

    return NextResponse.json({
      proposal,
      validation,
      market: {
        midPrice: market.midPrice,
        bestBid: market.bestBid,
        bestAsk: market.bestAsk,
      },
    })
  } catch (error: unknown) {
    if (error instanceof NoObjectGeneratedError) {
      return NextResponse.json(
        {
          error: 'AI could not generate a valid strategy',
          details: error.text,
        },
        { status: 422 }
      )
    }

    console.error('Strategy generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate strategy. Please try again.' },
      { status: 500 }
    )
  }
}
