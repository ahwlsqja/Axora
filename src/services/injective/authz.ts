import { MsgGrant } from '@injectivelabs/sdk-ts'
import { SPOT_MSG_TYPES, DEFAULT_AUTHZ_EXPIRY_SECONDS } from '@/utils/constants'

/**
 * Create AuthZ grant messages for all 4 spot exchange message types.
 * Each grant authorizes the grantee to execute one specific spot message type
 * on behalf of the granter.
 *
 * Grants expire after 7 days (DEFAULT_AUTHZ_EXPIRY_SECONDS = 604800).
 * IMPORTANT: expiryInSeconds must be explicitly set -- default is 5 YEARS if omitted.
 *
 * @param granter - The address granting authority (user's address)
 * @param grantee - The address receiving authority (agent address, or self for Phase 1)
 * @returns Array of 4 MsgGrant objects
 */
export function createSpotAuthzGrants(
  granter: string,
  grantee: string
): InstanceType<typeof MsgGrant>[] {
  return SPOT_MSG_TYPES.map((messageType) =>
    MsgGrant.fromJSON({
      messageType,
      grantee,
      granter,
      expiryInSeconds: DEFAULT_AUTHZ_EXPIRY_SECONDS, // 604800 = 7 days
    })
  )
}
