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
    // The browser always calls this same-origin route. Vercel forwards it to
    // the private API over HTTPS, keeping Telegram init data out of client
    // configuration and avoiding a public API origin in the UI.
    return apiOrigin ? [{ source: '/api/:path*', destination: `${apiOrigin}/:path*` }] : []
  },
}

export default nextConfig
