import crypto from 'crypto'

export type TelegramUser = {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
}

function botToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set. Add it in Project Settings → Vars.')
  return token
}

/**
 * Validate Telegram Mini App `initData` (WebApp) payload.
 * Algorithm: secret = HMAC_SHA256("WebAppData", botToken); expected = HMAC_SHA256(secret, dataCheckString).
 */
export function verifyInitData(initData: string, maxAgeSeconds = 86_400): TelegramUser | null {
  if (!initData) return null
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null
  params.delete('hash')

  const dataCheckString = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n')

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken()).digest()
  const expected = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex')
  if (!timingSafeEqualHex(expected, hash)) return null

  const authDate = Number(params.get('auth_date') || 0)
  if (authDate && maxAgeSeconds > 0 && Date.now() / 1000 - authDate > maxAgeSeconds) return null

  const userRaw = params.get('user')
  if (!userRaw) return null
  try {
    const user = JSON.parse(userRaw) as TelegramUser
    if (!user?.id) return null
    return user
  } catch {
    return null
  }
}

/**
 * Validate Telegram Login Widget callback query params.
 * Algorithm: secret = SHA256(botToken); expected = HMAC_SHA256(secret, dataCheckString).
 */
export function verifyLoginWidget(
  fields: Record<string, string>,
  maxAgeSeconds = 86_400,
): TelegramUser | null {
  const { hash, ...rest } = fields
  if (!hash) return null

  const dataCheckString = Object.keys(rest)
    .filter((key) => rest[key] !== undefined && rest[key] !== '')
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join('\n')

  const secret = crypto.createHash('sha256').update(botToken()).digest()
  const expected = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex')
  if (!timingSafeEqualHex(expected, hash)) return null

  const authDate = Number(rest.auth_date || 0)
  if (authDate && maxAgeSeconds > 0 && Date.now() / 1000 - authDate > maxAgeSeconds) return null

  const id = Number(rest.id)
  if (!id) return null
  return {
    id,
    first_name: rest.first_name,
    last_name: rest.last_name,
    username: rest.username,
    photo_url: rest.photo_url,
  }
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex')
  const bufB = Buffer.from(b, 'hex')
  if (bufA.length !== bufB.length || bufA.length === 0) return false
  return crypto.timingSafeEqual(bufA, bufB)
}
