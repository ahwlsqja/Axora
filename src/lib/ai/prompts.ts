import type { MarketSnapshot } from '@/lib/strategy/types'

/**
 * Preset-specific prompts that instruct the AI on the exact order structure
 * for each strategy type. Mapped by preset ID from constants/intents.ts.
 */
const PRESET_PROMPTS: Record<string, string> = {
  'dca-inj': `Generate a Dollar-Cost Averaging (DCA) strategy for buying INJ.
Distribute the total budget equally across the specified number of splits.
Place buy orders at evenly spaced price points BELOW the current market price.
Each order should have the same capital allocation (percentOfTotal should be equal across orders).
Start from just below current price and space downward.`,

  'stop-loss': `Generate a stop-loss strategy.
Place a SINGLE sell order at or below the user's stop price.
The stop price should be below the current market price (typically 5-15% below).
Set splitCount to 1 and create exactly one sell order.
The worst-case outcome should honestly state the loss if the stop triggers.`,

  'scale-in': `Generate a scale-in (buy the dip) strategy.
Place buy orders at progressively lower prices below the current market price.
IMPORTANT: Allocate MORE capital to lower price levels (pyramid buying).
Use increasing weights: the lowest price order should have the largest allocation.
For example with 4 splits: weights 1,2,3,4 (normalized) so the cheapest level gets ~40%.`,

  'take-profit': `Generate a take-profit strategy.
Place SELL orders at progressively higher prices ABOVE the current market price.
Distribute the selling quantity evenly across the price targets.
Start from just above current price and space upward.
Each order should sell an equal portion of the total position.`,

  'limit-buy': `Generate a limit buy strategy.
Place a single buy order or a small cluster of buy orders at the user's desired price.
The price should be BELOW the current market price (buying at a discount).
If the user hasn't specified a price, choose a reasonable discount (3-5% below market).
Keep splitCount low (1-3 orders).`,

  'range-accumulate': `Generate a range accumulation strategy.
Place buy orders evenly distributed across a price range below the current market price.
All orders should have EQUAL capital allocation (like DCA but within a defined range).
The range should span a meaningful price band (e.g., 5-20% below current price).
Space orders evenly between the range minimum and maximum.`,
}

/**
 * Build the system prompt with current market context.
 * Injected into every AI strategy generation call.
 */
export function buildSystemPrompt(market: MarketSnapshot): string {
  const spreadPercent = (market.spread * 100).toFixed(3)

  return `You are a trading strategy assistant for the Injective Protocol decentralized exchange.
You generate structured limit order strategies based on user intent and current market data.

CURRENT MARKET DATA:
- Mid Price: ${market.midPrice}
- Best Bid: ${market.bestBid}
- Best Ask: ${market.bestAsk}
- Spread: ${spreadPercent}%
- Orderbook Depth: ${market.orderbookDepth.bids} bids, ${market.orderbookDepth.asks} asks

RULES:
1. All prices MUST be realistic relative to current market data.
2. Buy orders MUST be priced at or below the current best ask.
3. Sell orders MUST be priced at or above the current best bid.
4. Maximum 20 orders per strategy.
5. Respect the user's budget -- totalCapitalRequired should not exceed what they can afford.
6. Be honest about worst-case outcomes. Do not sugarcoat risks.
7. Do NOT generate marketId, baseDenom, or quoteDenom values -- they will be injected by the system. Use empty strings for these fields.
8. The sum of all order percentOfTotal values should equal approximately 100.
9. totalCapitalRequired should approximately equal the sum of (price * quantity) for buy orders, or represent the value of assets being sold for sell orders.
10. priceRange.min should be the lowest order price, priceRange.max should be the highest.`
}

/**
 * Get the user-facing prompt for a given intent.
 * For presets, returns the structured prompt. For freetext, returns the user's input (truncated).
 */
export function getPromptForIntent(
  presetId: string | null,
  freeText: string,
  source: 'preset' | 'freetext'
): string {
  if (source === 'preset' && presetId && PRESET_PROMPTS[presetId]) {
    return PRESET_PROMPTS[presetId]
  }

  // Freetext: truncate to 500 chars to prevent prompt injection via excessive length
  return freeText.slice(0, 500)
}
