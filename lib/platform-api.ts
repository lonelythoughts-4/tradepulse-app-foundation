import { NextResponse, type NextRequest } from 'next/server.js'

/**
 * Forward a web-desk request to the single TradeMemo platform API.
 *
 * The bot, Mini App and browser handoff must authenticate against the same
 * source of truth. Keeping this explicit (rather than relying on a Vercel
 * rewrite) also guarantees that Telegram's signed header and any HttpOnly
 * session cookie arrive intact.
 */
export async function proxyPlatformRequest(request: NextRequest, upstreamPath: string): Promise<NextResponse> {
  const requestId = request.headers.get('x-tradepulse-request-id') || crypto.randomUUID()
  const origin = process.env.TRADEPULSE_API_ORIGIN?.trim().replace(/\/+$/, '')
  if (!origin) {
    return NextResponse.json(
      { error: 'TradeMemo service is temporarily unavailable. Please retry.' },
      { status: 503, headers: { 'x-tradepulse-request-id': requestId } },
    )
  }

  const originUrl = new URL(`${origin}/`)
  const basePath = originUrl.pathname.replace(/\/+$/, '')
  const url = new URL(`${basePath}${upstreamPath.startsWith('/') ? upstreamPath : `/${upstreamPath}`}`, originUrl.origin)
  url.search = request.nextUrl.search

  const headers = new Headers()
  for (const name of ['accept', 'content-type', 'cookie', 'idempotency-key', 'x-telegram-init-data', 'x-tradepulse-environment']) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  headers.set('x-tradepulse-request-id', requestId)

  const hasBody = !['GET', 'HEAD'].includes(request.method)
  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(upstreamPath === '/v1/admin/autousers/runs' ? 55_000 : 30_000)]),
    })
    const contentType = upstream.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const status = upstream.status >= 400 ? upstream.status : 502
      return NextResponse.json(
        {
          error: 'TradeMemo could not complete this request. The service returned an unexpected response.',
        },
        { status, headers: { 'x-tradepulse-request-id': requestId } },
      )
    }
    const response = new NextResponse(await upstream.arrayBuffer(), { status: upstream.status })
    for (const name of ['content-type', 'cache-control', 'x-tradepulse-request-id']) {
      const value = upstream.headers.get(name)
      if (value) response.headers.set(name, value)
    }
    response.headers.set('x-tradepulse-request-id', upstream.headers.get('x-tradepulse-request-id') || requestId)
    // The upstream API issues the browser session. Re-emit it from this first-
    // party Vercel route so the browser reliably stores it for this web domain.
    const sessionCookie = upstream.headers.get('set-cookie')
    if (sessionCookie) response.headers.set('set-cookie', sessionCookie)
    return response
  } catch {
    return NextResponse.json(
      { error: 'TradeMemo service is temporarily unavailable. Please retry.' },
      { status: 503, headers: { 'x-tradepulse-request-id': requestId } },
    )
  }
}
