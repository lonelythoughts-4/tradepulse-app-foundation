import type { NextRequest } from 'next/server'
import { proxyPlatformRequest } from '@/lib/platform-api'

export const dynamic = 'force-dynamic'

// Browser sign-in begins here so Vercel forwards the request to the same
// TradePulse API used by Telegram. Without this route Next returns its HTML
// not-found document, which the desk cannot parse as a handoff response.
export async function POST(request: NextRequest) {
  return proxyPlatformRequest(request, '/v1/auth/handoff/start')
}
