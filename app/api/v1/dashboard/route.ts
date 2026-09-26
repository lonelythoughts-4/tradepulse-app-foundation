import type { NextRequest } from 'next/server'
import { proxyPlatformRequest } from '@/lib/platform-api'

export const dynamic = 'force-dynamic'

// The dashboard is deliberately served by the same API as the Telegram bot.
// The old local v0 route used an unrelated database and cookie format, which
// made valid bot and browser sessions look unauthenticated.
export async function GET(request: NextRequest) {
  return proxyPlatformRequest(request, '/v1/dashboard')
}
