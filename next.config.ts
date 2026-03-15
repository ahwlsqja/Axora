import type { NextConfig } from 'next'
import path from 'path'

const emptyModule = path.resolve(__dirname, 'src/utils/empty-module.ts')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      // Handle Node.js polyfill issues from Injective SDK in browser
      fs: { browser: './src/utils/empty-module.ts' },
      net: { browser: './src/utils/empty-module.ts' },
      tls: { browser: './src/utils/empty-module.ts' },
      // wallet-ledger bundles CryptoJS with AMD define() that can't resolve.
      // We don't use ledger wallets so stub the entire package.
      '@injectivelabs/wallet-ledger': './src/utils/empty-module.ts',
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      }
    }

    // wallet-ledger bundles CryptoJS with AMD define() calls
    // that webpack/turbopack parse as module dependencies.
    // We don't use ledger wallets, so alias to empty module.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@injectivelabs/wallet-ledger': emptyModule,
    }

    // Suppress AMD define parsing in wallet-ledger's CryptoJS bundle
    config.module = config.module || {}
    config.module.noParse = [
      /wallet-ledger[\\/]dist[\\/]esm[\\/]Eth-/,
    ]

    return config
  },
}

export default nextConfig
