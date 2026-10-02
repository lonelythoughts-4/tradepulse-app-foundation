import type { NextRequest } from 'next/server'
import { proxyPlatformRequest } from '@/lib/platform-api'

export const dynamic = 'force-dynamic'

/**
 * Keep browser/API calls on the same origin while forwarding any platform
 * endpoint not represented by a dedicated route file. The upstream path is
 * derived from the request, so the bot and web app share one API surface.
 */
async function forward(request: NextRequest) {
  const upstreamPath = request.nextUrl.pathname.replace(/^\/api/, '') || '/'
  return proxyPlatformRequest(request, upstreamPath)
}

export const GET = forward
export const POST = forward
export const PUT = forward
export const PATCH = forward
export const DELETE = forward
