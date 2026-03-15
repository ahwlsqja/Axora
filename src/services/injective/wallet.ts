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
  return (window as unknown as Record<string, unknown>).keplr_wallet_provider as typeof window.keplr
    ?? window.keplr
}

/**
 * Get the real MetaMask provider, bypassing other wallet overrides.
 * When multiple wallets are installed, window.ethereum.providers has all of them.
 */
function getMetaMaskProvider(): typeof window.ethereum | undefined {
  if (typeof window === 'undefined' || !window.ethereum) return undefined

  // Check providers array (EIP-6963 / multi-wallet scenario)
  const providers = (window.ethereum as unknown as { providers?: Array<{ isMetaMask?: boolean }> }).providers
  if (providers) {
    const mm = providers.find((p) => p.isMetaMask && !(p as Record<string, unknown>).isRabby)
    if (mm) return mm as typeof window.ethereum
  }

  // Single provider — check if it's actually MetaMask
  if (window.ethereum.isMetaMask) return window.ethereum

  return undefined
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
      return !!getMetaMaskProvider()
    default:
      return false
  }
}

/**
 * Add the Injective EVM chain to MetaMask.
 * Required for testnet since MetaMask doesn't have it by default.
 */
async function addInjectiveToMetaMask(): Promise<void> {
  const provider = getMetaMaskProvider()
  if (!provider) return

  const isTestnet = NETWORK === Network.Testnet

  try {
    // First try switching to the chain (in case it's already added)
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: isTestnet ? '0xA96' : '0x1' }], // 2710 for testnet, 1 for mainnet
    })
  } catch (switchError: unknown) {
    // Chain not added yet (error code 4902) — add it
    if ((switchError as { code?: number })?.code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: isTestnet ? '0xA96' : '0x1',
            chainName: isTestnet ? 'Injective Testnet' : 'Injective',
            nativeCurrency: {
              name: 'Injective',
              symbol: 'INJ',
              decimals: 18,
            },
            rpcUrls: isTestnet
              ? ['https://testnet.sentry.evm.rpc.injective.network']
              : ['https://sentry.evm.rpc.injective.network'],
            blockExplorerUrls: isTestnet
              ? ['https://testnet.explorer.injective.network']
              : ['https://explorer.injective.network'],
          },
        ],
      })
    } else {
      throw switchError
    }
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
  // Ensure correct network before connecting
  if (walletType === Wallet.Keplr) {
    await suggestChainToKeplr()
    const chainId = NETWORK === Network.Testnet ? 'injective-888' : 'injective-1'
    const keplr = getKeplr()
    if (keplr) await keplr.enable(chainId)
  } else if (walletType === Wallet.Metamask) {
    // WalletStrategy uses window.ethereum internally.
    // If another wallet (Rainbow, OKX, etc.) overrides it, swap in real MetaMask.
    const realMM = getMetaMaskProvider()
    if (realMM && window.ethereum !== realMM) {
      (window as unknown as Record<string, unknown>).__original_ethereum = window.ethereum
      window.ethereum = realMM
    }
    await addInjectiveToMetaMask()
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
 * Ensure the active wallet is on the correct Injective network before broadcasting.
 * Only touches the wallet type that is currently connected.
 */
export async function ensureCorrectNetwork(walletType: Wallet): Promise<void> {
  if (walletType === Wallet.Keplr) {
    const keplr = getKeplr()
    if (keplr) {
      const chainId = NETWORK === Network.Testnet ? 'injective-888' : 'injective-1'
      await suggestChainToKeplr()
      await keplr.enable(chainId)
    }
  } else if (walletType === Wallet.Metamask) {
    if (getMetaMaskProvider()) {
      await addInjectiveToMetaMask()
    }
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
