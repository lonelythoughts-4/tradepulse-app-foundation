/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const apiOrigin = process.env.TRADEPULSE_API_ORIGIN?.replace(/\/$/, '')
    // Vercel must forward same-origin browser calls to the shared TradePulse
    // API. The origin is deployment configuration, never a client-side secret.
    return apiOrigin ? [{ source: '/api/:path*', destination: `${apiOrigin}/:path*` }] : []
  },
}

export default nextConfig
