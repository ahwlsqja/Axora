import { Wallet } from '@injectivelabs/wallet-base'
import { getInjectiveAddress } from '@injectivelabs/sdk-ts'
import { getWalletStrategy } from './client'

const STORAGE_KEY = 'injective-agent-wallet'

/**
 * Check if a wallet extension is installed in the browser.
 */
export function isWalletInstalled(walletType: Wallet): boolean {
  if (typeof window === 'undefined') return false

  switch (walletType) {
    case Wallet.Keplr:
      return !!window.keplr
    case Wallet.Metamask:
      return !!window.ethereum
    default:
      return false
  }
}

/**
 * Get the Chrome Web Store install URL for a wallet extension.
 */
export function getInstallUrl(walletType: Wallet): string {
  switch (walletType) {
    case Wallet.Keplr:
      return 'https://chromewebstore.google.com/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap'
    case Wallet.Metamask:
      return 'https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn'
    default:
      return ''
  }
}

/**
 * Connect a wallet and return the Injective address.
 * Sets the wallet on WalletStrategy, fetches addresses,
 * and converts MetaMask ETH addresses to Injective format.
 */
export async function connectWallet(walletType: Wallet): Promise<string> {
  const strategy = getWalletStrategy()

  await strategy.setWallet(walletType)
  const addresses = await strategy.getAddresses()

  if (!addresses || addresses.length === 0) {
    throw new Error(
      `No addresses returned from ${walletType}. Please ensure the wallet is unlocked and has an account.`
    )
  }

  // MetaMask returns Ethereum addresses; convert to Injective bech32
  const address =
    walletType === Wallet.Metamask
      ? getInjectiveAddress(addresses[0])
      : addresses[0]

  // Persist wallet type for session reconnect
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ walletType }))
  } catch {
    // localStorage may be unavailable; ignore
  }

  return address
}

/**
 * Disconnect the current wallet and clear session persistence.
 */
export function disconnectWallet(): void {
  const strategy = getWalletStrategy()
  strategy.disconnect()

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

/**
 * Read the saved wallet type from localStorage for auto-reconnect.
 * Returns null if no saved session or localStorage is unavailable.
 */
export function getSavedWalletType(): Wallet | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return (parsed.walletType as Wallet) ?? null
  } catch {
    return null
  }
}
