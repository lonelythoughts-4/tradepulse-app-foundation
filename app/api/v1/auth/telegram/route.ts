import { NextResponse, type NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { verifyLoginWidget } from '@/lib/telegram'
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * Telegram Login Widget callback (browser auth).
 * The widget redirects here with signed query params. We verify the signature,
 * upsert the user, set a signed session cookie, then bounce back to the app.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const fields: Record<string, string> = {}
  for (const [key, value] of url.searchParams.entries()) fields[key] = value

  const home = new URL('/', url.origin)

  const tg = verifyLoginWidget(fields)
  if (!tg) {
    home.searchParams.set('auth_error', '1')
    return NextResponse.redirect(home)
  }

  const now = Math.floor(Date.now() / 1000)
  await query(
    `INSERT INTO users (tg_id, username, first_name, created_at, last_seen)
     VALUES ($1, $2, $3, $4, $4)
     ON CONFLICT (tg_id) DO UPDATE SET
       last_seen = $4,
       username = COALESCE(NULLIF($2, ''), users.username),
       first_name = COALESCE(NULLIF($3, ''), users.first_name)`,
    [tg.id, tg.username ?? '', tg.first_name ?? ''],
  )

  const response = NextResponse.redirect(home)
  response.cookies.set(SESSION_COOKIE, createSessionToken(tg.id), sessionCookieOptions)
  return response
}
