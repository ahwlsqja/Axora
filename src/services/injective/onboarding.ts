import { MsgDeposit } from '@injectivelabs/sdk-ts'
import { BigNumberInBase } from '@injectivelabs/utils'
import { Wallet } from '@injectivelabs/wallet-base'
import { getMsgBroadcaster } from './client'
import { getAgentSubaccountId } from './subaccount'
import { createSpotAuthzGrants } from './authz'
import { ensureCorrectNetwork } from './wallet'

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
  depositAmountInj: number,
  walletType: Wallet = Wallet.Keplr
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

  // AuthZ grants require a different grantee address (chain rejects self-grants).
  // Grants will be added in Phase 4 when the agent service has its own address.
  // For now, only deposit to the agent subaccount.

  // Ensure the active wallet is on the correct network before broadcasting
  await ensureCorrectNetwork(walletType)

  // Broadcast deposit message
  const broadcaster = getMsgBroadcaster()
  const response = await broadcaster.broadcast({
    msgs: [depositMsg],
    injectiveAddress,
  })

  return response.txHash
}
