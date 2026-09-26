import type { NextRequest } from 'next/server'
import { proxyPlatformRequest } from '@/lib/platform-api'

export const dynamic = 'force-dynamic'

// This explicit first-party route preserves the API's Set-Cookie response.
// Rewrites are fine for ordinary JSON, but the browser handoff is an auth
// boundary and must set its HttpOnly cookie on the permanent web domain.
export async function GET(request: NextRequest) {
  return proxyPlatformRequest(request, '/v1/auth/handoff/complete')
}
