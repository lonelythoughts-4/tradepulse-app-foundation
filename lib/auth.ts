import type { NextRequest } from 'next/server'
import { query, queryOne, num } from './db'
import { verifyInitData, type TelegramUser } from './telegram'
import { readSessionToken, SESSION_COOKIE } from './session'

export type AuthedUser = {
  tgId: number
  first_name: string
  username: string
  tier: string
  fee_credit_usd: number
  onboarding_complete: boolean
  is_admin: boolean
}

export type Environment = 'mainnet' | 'testnet'

export function readEnvironment(req: NextRequest): Environment {
  const raw = req.headers.get('x-tradepulse-environment')
  return raw === 'testnet' ? 'testnet' : 'mainnet'
}

/** Ensure a users row exists for this Telegram identity (web logins may predate the bot). */
async function ensureUser(tg: TelegramUser): Promise<void> {
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
}

async function loadUser(tgId: number): Promise<AuthedUser | null> {
  const row = await queryOne<{
    tg_id: string
    tier: string
    first_name: string | null
    username: string | null
    fee_credit_usd: number
    onboarding_complete: string
  }>(
    `SELECT tg_id, tier, first_name, username, fee_credit_usd, onboarding_complete
     FROM users WHERE tg_id = $1`,
    [tgId],
  )
  if (!row) return null
  const admin = await queryOne<{ user_id: string }>(
    'SELECT user_id FROM admin_members WHERE user_id = $1',
    [tgId],
  )
  return {
    tgId: num(row.tg_id),
    first_name: row.first_name ?? '',
    username: row.username ?? '',
    tier: row.tier ?? 'Explorer',
    fee_credit_usd: num(row.fee_credit_usd),
    onboarding_complete: num(row.onboarding_complete) === 1,
    is_admin: Boolean(admin),
  }
}

/**
 * Resolve the caller from either the Telegram Mini App initData header
 * or the browser session cookie set by the Login Widget callback.
 */
export async function resolveUser(req: NextRequest): Promise<AuthedUser | null> {
  const initData = req.headers.get('x-telegram-init-data')
  if (initData) {
    const tg = verifyInitData(initData)
    if (tg) {
      await ensureUser(tg)
      return loadUser(tg.id)
    }
  }

  const cookie = req.cookies.get(SESSION_COOKIE)?.value
  const tgId = readSessionToken(cookie)
  if (tgId) return loadUser(tgId)

  return null
}
