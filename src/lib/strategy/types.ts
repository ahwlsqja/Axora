import type { StrategyProposal } from '@/lib/ai/schemas'

/** Real-time market data snapshot for validation and prompt context */
export interface MarketSnapshot {
  marketId: string
  midPrice: number
  bestBid: number
  bestAsk: number
  /** Spread as decimal ratio: (bestAsk - bestBid) / bestAsk */
  spread: number
  orderbookDepth: {
    bids: number
    asks: number
  }
  baseDecimals: number
  quoteDecimals: number
}

/** Result of validating an AI-generated strategy proposal */
export interface ValidationResult {
  valid: boolean
  warnings: string[]
  errors: string[]
  adjustedProposal?: StrategyProposal
}

/** Request payload for strategy generation */
export interface StrategyGenerationRequest {
  presetId: string | null
  freeText: string
  source: 'preset' | 'freetext'
  marketId: string
}

/** Response from strategy generation endpoint */
export interface StrategyGenerationResponse {
  proposal: StrategyProposal
  validation: ValidationResult
  market: MarketSnapshot
}
