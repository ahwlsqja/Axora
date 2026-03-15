import { Wallet } from '@injectivelabs/wallet-base'
import { getInjectiveAddress } from '@injectivelabs/sdk-ts'
import { getWalletStrategy } from './client'
import { NETWORK } from '@/utils/constants'
import { Network } from '@injectivelabs/networks'

const STORAGE_KEY = 'injective-agent-wallet'

/**
 * Suggest the Injective chain to Keplr if not already registered.
 * Required for testnet since Keplr doesn't ship with injective-888 by default.
 */
async function suggestChainToKeplr(): Promise<void> {
  const keplr = getKeplr()
  if (!keplr) return

  const isTestnet = NETWORK === Network.Testnet

  await keplr.experimentalSuggestChain({
    chainId: isTestnet ? 'injective-888' : 'injective-1',
    chainName: isTestnet ? 'Injective Testnet' : 'Injective',
    rpc: isTestnet
      ? 'https://testnet.sentry.tm.injective.network:443'
      : 'https://sentry.tm.injective.network:443',
    rest: isTestnet
      ? 'https://testnet.sentry.lcd.injective.network:443'
      : 'https://sentry.lcd.injective.network:443',
    bip44: { coinType: 60 },
    bech32Config: {
      bech32PrefixAccAddr: 'inj',
      bech32PrefixAccPub: 'injpub',
      bech32PrefixValAddr: 'injvaloper',
      bech32PrefixValPub: 'injvaloperpub',
      bech32PrefixConsAddr: 'injvalcons',
      bech32PrefixConsPub: 'injvalconspub',
    },
    currencies: [
      { coinDenom: 'INJ', coinMinimalDenom: 'inj', coinDecimals: 18 },
    ],
    feeCurrencies: [
      {
        coinDenom: 'INJ',
        coinMinimalDenom: 'inj',
        coinDecimals: 18,
        gasPriceStep: {
          low: 500000000,
          average: 1000000000,
          high: 1500000000,
        },
      },
    ],
    stakeCurrency: {
      coinDenom: 'INJ',
      coinMinimalDenom: 'inj',
      coinDecimals: 18,
    },
  })
}

/**
 * Get the real Keplr instance, bypassing OKX Wallet's override.
 * OKX Wallet injects itself as window.keplr to intercept Keplr calls.
 */
function getKeplr(): typeof window.keplr | undefined {
  if (typeof window === 'undefined') return undefined
  // Keplr extension stores its original reference here
  return (window as unknown as Record<string, unknown>).keplr_wallet_provider as typeof window.keplr
    ?? window.keplr
}

/**
 * Check if a wallet extension is installed in the browser.
 */
export function isWalletInstalled(walletType: Wallet): boolean {
  if (typeof window === 'undefined') return false

  switch (walletType) {
    case Wallet.Keplr:
      return !!getKeplr()
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
  // Suggest Injective chain to Keplr before connecting (required for testnet)
  if (walletType === Wallet.Keplr) {
    await suggestChainToKeplr()
    // Enable the chain after suggesting it
    const chainId = NETWORK === Network.Testnet ? 'injective-888' : 'injective-1'
    const keplr = getKeplr()
    if (keplr) await keplr.enable(chainId)
  }

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
