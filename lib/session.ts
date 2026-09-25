import crypto from 'crypto'

export const SESSION_COOKIE = 'tp_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

function secret(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set. Add it in Project Settings → Vars.')
  return token
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex')
}

/** Create a signed cookie value binding a Telegram user id to this session. */
export function createSessionToken(tgId: number): string {
  const issuedAt = Math.floor(Date.now() / 1000)
  const payload = `${tgId}.${issuedAt}`
  return `${payload}.${sign(payload)}`
}

/** Verify a signed session cookie and return the Telegram user id, or null. */
export function readSessionToken(token: string | undefined | null): number | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [tgId, issuedAt, providedSig] = parts
  const payload = `${tgId}.${issuedAt}`
  const expectedSig = sign(payload)
  const a = Buffer.from(providedSig, 'hex')
  const b = Buffer.from(expectedSig, 'hex')
  if (a.length !== b.length || a.length === 0 || !crypto.timingSafeEqual(a, b)) return null
  if (Math.floor(Date.now() / 1000) - Number(issuedAt) > MAX_AGE_SECONDS) return null
  const id = Number(tgId)
  return Number.isFinite(id) && id > 0 ? id : null
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  // The app runs inside the Telegram Mini App iframe and the v0 preview iframe,
  // so the cookie must be allowed in cross-site (embedded) contexts.
  sameSite: 'none' as const,
  path: '/',
  maxAge: MAX_AGE_SECONDS,
}
