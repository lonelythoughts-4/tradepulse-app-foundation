import type { NextRequest } from 'next/server'
import { proxyPlatformRequest } from '@/lib/platform-api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return proxyPlatformRequest(request, '/v1/auth/telegram')
}
