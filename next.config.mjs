/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Was disabled, which meant every photo shipped to the browser at its
    // full uploaded size — a multi-MB iPhone photo shown in a small grid
    // tile, even on mobile data. Turning this on lets Next.js actually
    // resize/compress/re-encode images to what's shown (using the `sizes`
    // hints already set on every <Image>) and cache the results.
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
