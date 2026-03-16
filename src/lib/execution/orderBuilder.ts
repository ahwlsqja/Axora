import {
  MsgBatchUpdateOrders,
  spotPriceToChainPriceToFixed,
  spotQuantityToChainQuantityToFixed,
} from '@injectivelabs/sdk-ts'
import { getAgentSubaccountId } from '@/services/injective/subaccount'
import type { StrategyProposal } from '@/lib/ai/schemas'

/**
 * Convert a StrategyProposal to a chain-format MsgBatchUpdateOrders message.
 *
 * Uses spotPriceToChainPriceToFixed and spotQuantityToChainQuantityToFixed
 * for correct decimal conversion (not deprecated BigNumber variants).
 *
 * @returns Object with the constructed message and generated CIDs for order tracking
 */
export function buildBatchOrderMsg(
  proposal: StrategyProposal,
  injectiveAddress: string,
  baseDecimals: number,
  quoteDecimals: number
): { msg: MsgBatchUpdateOrders; cids: string[] } {
  const subaccountId = getAgentSubaccountId(injectiveAddress)
  const timestamp = Date.now()

  const cids: string[] = []

  const spotOrdersToCreate = proposal.orders.map((order, index) => {
    const cid = `axora-${timestamp}-${index}`
    cids.push(cid)

    return {
      orderType: order.side === 'buy' ? 1 : 2, // 1=BUY, 2=SELL (numeric to avoid enum import issues)
      marketId: proposal.marketId,
      feeRecipient: injectiveAddress,
      price: spotPriceToChainPriceToFixed({
        value: order.price,
        baseDecimals,
        quoteDecimals,
      }),
      quantity: spotQuantityToChainQuantityToFixed({
        value: order.quantity,
        baseDecimals,
      }),
      cid,
    }
  })

  const msg = MsgBatchUpdateOrders.fromJSON({
    subaccountId,
    injectiveAddress,
    spotOrdersToCreate,
  })

  return { msg, cids }
}

/**
 * Build a MsgBatchUpdateOrders to cancel specific orders by hash.
 */
export function buildCancelOrdersMsg(
  orderHashes: string[],
  marketId: string,
  injectiveAddress: string
): MsgBatchUpdateOrders {
  const subaccountId = getAgentSubaccountId(injectiveAddress)

  return MsgBatchUpdateOrders.fromJSON({
    subaccountId,
    injectiveAddress,
    spotOrdersToCancel: orderHashes.map((orderHash) => ({
      marketId,
      subaccountId,
      orderHash,
    })),
  })
}
