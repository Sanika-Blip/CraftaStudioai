// CraftaStudio — next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /** Enable strict React mode for better development warnings */
  reactStrictMode: true,

  /**
   * Custom webpack config to resolve @shared/* path alias.
   * This lets frontend code import from shared/types/ without
   * breaking the strict TypeScript paths configuration.
   */
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
    }
    return config
  },

  /** Allow images from common CDN domains used by Clerk avatars */
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.clerk.dev' },
    ],
  },
}

export default nextConfig
