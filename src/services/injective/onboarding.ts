import { MsgDeposit } from '@injectivelabs/sdk-ts'
import { BigNumberInBase } from '@injectivelabs/utils'
import { getMsgBroadcaster } from './client'
import { getAgentSubaccountId } from './subaccount'
import { createSpotAuthzGrants } from './authz'

/**
 * Execute the full onboarding transaction: deposit to agent subaccount + AuthZ grants.
 *
 * Batches into a single transaction (one user signature):
 * - 1 MsgDeposit: funds the agent subaccount (nonce 1)
 * - 4 MsgGrant: spot market trading permissions (limit, market, cancel, batch)
 *
 * Note: Granting to self as placeholder. Phase 4 will use dedicated agent address.
 *
 * @param injectiveAddress - User's Injective address
 * @param depositAmountInj - Amount of INJ to deposit (human-readable, e.g. 0.1)
 * @returns Transaction hash
 */
export async function executeOnboarding(
  injectiveAddress: string,
  depositAmountInj: number
): Promise<string> {
  const subaccountId = getAgentSubaccountId(injectiveAddress)

  // Create deposit message
  const depositMsg = MsgDeposit.fromJSON({
    amount: {
      denom: 'inj',
      amount: new BigNumberInBase(depositAmountInj).toWei().toFixed(),
    },
    subaccountId,
    injectiveAddress,
  })

  // Create AuthZ grant messages (self-grant for Phase 1 -- agent address not yet available)
  const grantMsgs = createSpotAuthzGrants(injectiveAddress, injectiveAddress)

  // Broadcast all messages in a single transaction
  const broadcaster = getMsgBroadcaster()
  const response = await broadcaster.broadcast({
    msgs: [depositMsg, ...grantMsgs],
    injectiveAddress,
  })

  return response.txHash
}
