import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      { pathname: '/api/media/file/**' },
      { pathname: '/images/**' },
      { pathname: '/media/**' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
}

export default withPayload(nextConfig)
