import { IndexerGrpcSpotApi } from '@injectivelabs/sdk-ts'
import { getEndpoints } from '@/services/injective/network'
import type { MarketSnapshot } from '@/lib/strategy/types'
import type { ActiveOrder } from '@/lib/execution/types'
import type { OrderHistoryEntry } from '@/lib/monitoring/types'

/**
 * Supported spot markets for MVP.
 * Maps a readable key to on-chain denom info for matching.
 */
const SUPPORTED_MARKETS: Record<
  string,
  { name: string; baseDenom: string; quoteDenom: string }
> = {
  'INJ/USDT': {
    name: 'INJ/USDT',
    baseDenom: 'inj',
    quoteDenom: 'peggy0xdAC17F958D2ee523a2206206994597C13D831ec7',
  },
}

/** Module-level cache for resolved market IDs */
let cachedMarketMap: Record<string, string> | null = null

/** Module-level cache for market metadata (symbols derived from ticker) */
let cachedMarketMeta: Record<string, { baseSymbol: string; quoteSymbol: string }> | null = null

function getSpotApi(): IndexerGrpcSpotApi {
  return new IndexerGrpcSpotApi(getEndpoints().indexer)
}

/**
 * Fetch all spot markets from the Injective indexer.
 */
export async function fetchSpotMarkets() {
  const api = getSpotApi()
  return api.fetchMarkets()
}

/**
 * Fetch the orderbook for a specific spot market.
 */
export async function fetchOrderbookSnapshot(marketId: string) {
  const api = getSpotApi()
  return api.fetchOrderbookV2(marketId)
}

/**
 * Fetch a complete market snapshot including computed mid price and spread.
 * Used for AI prompt context and proposal validation.
 */
export async function fetchMarketSnapshot(
  marketId: string
): Promise<MarketSnapshot> {
  const api = getSpotApi()

  const [markets, orderbook] = await Promise.all([
    api.fetchMarkets(),
    api.fetchOrderbookV2(marketId),
  ])

  const market = markets.find((m) => m.marketId === marketId)
  if (!market) {
    throw new Error(`Market ${marketId} not found`)
  }

  const baseDecimals = market.baseToken?.decimals ?? 18
  const quoteDecimals = market.quoteToken?.decimals ?? 6

  // Injective orderbook prices are in raw chain format.
  // Convert to human-readable: multiply by 10^(baseDecimals - quoteDecimals)
  const priceScale = Math.pow(10, baseDecimals - quoteDecimals)

  const bestBid =
    orderbook.buys.length > 0
      ? Number(orderbook.buys[0].price) * priceScale
      : 0
  const bestAsk =
    orderbook.sells.length > 0
      ? Number(orderbook.sells[0].price) * priceScale
      : 0

  const midPrice =
    bestBid > 0 && bestAsk > 0 ? (bestBid + bestAsk) / 2 : bestBid || bestAsk

  const spread = bestAsk > 0 ? (bestAsk - bestBid) / bestAsk : 0

  return {
    marketId,
    midPrice,
    bestBid,
    bestAsk,
    spread,
    orderbookDepth: {
      bids: orderbook.buys.length,
      asks: orderbook.sells.length,
    },
    baseDecimals,
    quoteDecimals,
  }
}

/**
 * Get supported markets with their on-chain market IDs.
 * Fetches all spot markets from the indexer and filters to match
 * SUPPORTED_MARKETS entries by base/quote denom.
 * Results are cached after first call.
 */
export async function getSupportedMarkets(): Promise<
  Record<string, string>
> {
  if (cachedMarketMap) {
    return cachedMarketMap
  }

  const allMarkets = await fetchSpotMarkets()

  const result: Record<string, string> = {}

  for (const [key, config] of Object.entries(SUPPORTED_MARKETS)) {
    const match = allMarkets.find(
      (m) =>
        m.baseDenom === config.baseDenom &&
        m.quoteDenom === config.quoteDenom
    )
    if (match) {
      result[key] = match.marketId
    }
  }

  // Fallback: if no denom match found (e.g., testnet uses different denoms),
  // use the first available spot market with INJ in its ticker
  if (Object.keys(result).length === 0 && allMarkets.length > 0) {
    const injMarket = allMarkets.find(
      (m) => m.ticker?.toLowerCase().includes('inj')
    ) ?? allMarkets[0]
    const label = injMarket.ticker ?? 'INJ/USDT'
    result[label] = injMarket.marketId
  }

  // Build metadata cache from actual market data
  const meta: Record<string, { baseSymbol: string; quoteSymbol: string }> = {}
  for (const [label, marketId] of Object.entries(result)) {
    const m = allMarkets.find((am) => am.marketId === marketId)
    if (m?.ticker) {
      const parts = m.ticker.split('/')
      meta[marketId] = {
        baseSymbol: parts[0] ?? label.split('/')[0] ?? 'UNKNOWN',
        quoteSymbol: parts[1] ?? label.split('/')[1] ?? 'UNKNOWN',
      }
    } else {
      const parts = label.split('/')
      meta[marketId] = {
        baseSymbol: parts[0] ?? 'UNKNOWN',
        quoteSymbol: parts[1] ?? 'UNKNOWN',
      }
    }
  }
  cachedMarketMeta = meta

  cachedMarketMap = result
  return result
}

/**
 * Fetch active (open) orders for a subaccount on a specific market.
 * Filters to 'booked' and 'partial_filled' states only.
 *
 * @param subaccountId - Agent subaccount ID (nonce 1)
 * @param marketId - Spot market ID
 * @param baseDecimals - Base token decimals for price conversion
 * @param quoteDecimals - Quote token decimals for price conversion
 * @returns Array of active orders with human-readable prices
 */
export async function fetchActiveOrders(
  subaccountId: string,
  marketId: string,
  baseDecimals: number,
  quoteDecimals: number
): Promise<ActiveOrder[]> {
  const api = getSpotApi()
  const { orders } = await api.fetchOrders({ subaccountId, marketId })

  // Convert chain prices back to human-readable using the same scale as fetchMarketSnapshot
  const priceScale = Math.pow(10, baseDecimals - quoteDecimals)

  return orders
    .filter((o) => o.state === 'booked' || o.state === 'partial_filled')
    .map((o) => ({
      orderHash: o.orderHash,
      cid: o.cid ?? '',
      marketId: o.marketId,
      side: (o.orderSide === 'buy' ? 'buy' : 'sell') as 'buy' | 'sell',
      price: Number(o.price) * priceScale,
      quantity: Number(o.quantity),
      unfilledQuantity: Number(o.unfilledQuantity),
      state: o.state,
    }))
}

/**
 * Get the base/quote symbols for a market ID.
 * Must call getSupportedMarkets() first to populate the cache.
 */
export function getMarketSymbols(marketId: string): { baseSymbol: string; quoteSymbol: string } {
  return cachedMarketMeta?.[marketId] ?? { baseSymbol: 'UNKNOWN', quoteSymbol: 'UNKNOWN' }
}

/**
 * Fetch order history for a subaccount on a specific market.
 * Returns all orders (booked, filled, cancelled) with human-readable prices.
 *
 * @param subaccountId - Agent subaccount ID (nonce 1)
 * @param marketId - Spot market ID
 * @param baseDecimals - Base token decimals for price conversion
 * @param quoteDecimals - Quote token decimals for price conversion
 * @returns Array of order history entries with human-readable values
 */
export async function fetchOrderHistory(
  subaccountId: string,
  marketId: string,
  baseDecimals: number,
  quoteDecimals: number
): Promise<OrderHistoryEntry[]> {
  const api = getSpotApi()
  const { orderHistory } = await api.fetchOrderHistory({ subaccountId, marketId })

  const priceScale = Math.pow(10, baseDecimals - quoteDecimals)

  return orderHistory.map((o) => ({
    orderHash: o.orderHash,
    cid: o.cid ?? '',
    marketId: o.marketId,
    direction: (o.direction === 'buy' ? 'buy' : 'sell') as 'buy' | 'sell',
    price: Number(o.price) * priceScale,
    quantity: Number(o.quantity),
    filledQuantity: Number(o.filledQuantity),
    state: o.state,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  }))
}

/**
 * Fetch trades for specific CIDs on a market.
 * Returns trade fills with human-readable prices and fees.
 *
 * @param subaccountId - Agent subaccount ID (nonce 1)
 * @param marketId - Spot market ID
 * @param cids - Array of order CIDs to filter by
 * @param baseDecimals - Base token decimals for price conversion
 * @param quoteDecimals - Quote token decimals for fee conversion
 * @returns Array of converted trade data
 */
export async function fetchTradesByCid(
  subaccountId: string,
  marketId: string,
  cids: string[],
  baseDecimals: number,
  quoteDecimals: number
): Promise<Array<{
  price: number
  quantity: number
  fee: number
  tradeDirection: string
  cid: string
  executedAt: number
}>> {
  const api = getSpotApi()
  const { trades } = await api.fetchTrades({ subaccountId, marketId })

  const cidSet = new Set(cids)
  const priceScale = Math.pow(10, baseDecimals - quoteDecimals)

  return trades
    .filter((t) => cidSet.has(t.cid))
    .map((t) => ({
      price: Number(t.price) * priceScale,
      quantity: Number(t.quantity),
      fee: Number(t.fee) / Math.pow(10, quoteDecimals),
      tradeDirection: t.tradeDirection,
      cid: t.cid,
      executedAt: t.executedAt,
    }))
}
