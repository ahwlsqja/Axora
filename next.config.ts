import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      // Handle Node.js polyfill issues from Injective SDK in browser
      fs: { browser: './src/utils/empty-module.ts' },
      net: { browser: './src/utils/empty-module.ts' },
      tls: { browser: './src/utils/empty-module.ts' },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Handle Node.js polyfill issues from Injective SDK (webpack fallback)
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
    return config
  },
}

export default nextConfig
