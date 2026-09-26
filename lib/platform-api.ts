import { NextResponse, type NextRequest } from 'next/server'

/**
 * Forward a web-desk request to the single TradePulse platform API.
 *
 * The bot, Mini App and browser handoff must authenticate against the same
 * source of truth. Keeping this explicit (rather than relying on a Vercel
 * rewrite) also guarantees that Telegram's signed header and any HttpOnly
 * session cookie arrive intact.
 */
export async function proxyPlatformRequest(request: NextRequest, upstreamPath: string): Promise<NextResponse> {
  const origin = process.env.TRADEPULSE_API_ORIGIN?.replace(/\/+$/, '')
  if (!origin) return NextResponse.json({ error: 'TradePulse service is not configured.' }, { status: 503 })

  const url = new URL(upstreamPath, `${origin}/`)
  url.search = request.nextUrl.search

  const headers = new Headers()
  for (const name of ['accept', 'content-type', 'cookie', 'x-telegram-init-data', 'x-tradepulse-environment']) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }

  const hasBody = !['GET', 'HEAD'].includes(request.method)
  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: 'no-store',
      redirect: 'manual',
    })
    const response = new NextResponse(await upstream.arrayBuffer(), { status: upstream.status })
    for (const name of ['content-type', 'cache-control']) {
      const value = upstream.headers.get(name)
      if (value) response.headers.set(name, value)
    }
    // The upstream API issues the browser session. Re-emit it from this first-
    // party Vercel route so the browser reliably stores it for this web domain.
    const sessionCookie = upstream.headers.get('set-cookie')
    if (sessionCookie) response.headers.set('set-cookie', sessionCookie)
    return response
  } catch {
    return NextResponse.json({ error: 'TradePulse service is temporarily unavailable. Please retry.' }, { status: 503 })
  }
}
