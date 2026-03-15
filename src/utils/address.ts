/**
 * Truncate an Injective address for display.
 * e.g., "inj1abc...xyz" format (first 8 + last 4 chars).
 */
export function truncateAddress(address: string): string {
  if (address.length <= 12) return address
  return `${address.slice(0, 8)}...${address.slice(-4)}`
}
