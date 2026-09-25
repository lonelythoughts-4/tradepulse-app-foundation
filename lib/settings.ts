import { query } from './db'

export type SettingsMap = Record<string, string>

export async function loadSettings(): Promise<SettingsMap> {
  const rows = await query<{ key: string; value: string }>('SELECT key, value FROM app_settings')
  const map: SettingsMap = {}
  for (const row of rows) map[row.key] = row.value
  return map
}

export function settingNumber(settings: SettingsMap, key: string, fallback: number): number {
  const raw = settings[key]
  if (raw === undefined) return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

export function settingBool(settings: SettingsMap, key: string, fallback = false): boolean {
  const raw = settings[key]
  if (raw === undefined) return fallback
  return raw === 'true' || raw === '1'
}

export function settingJson<T>(settings: SettingsMap, key: string, fallback: T): T {
  const raw = settings[key]
  if (raw === undefined) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export type TierConfigEntry = { name: string; monthly: number; rate: number }
export type NoticeEntry = { id?: string; kind?: string; title?: string; body?: string }

export type Settings = {
  raw: SettingsMap
  bot_username: string
  community_url: string
  verified_deposit_channel: string
  popup_ttl_seconds: number
  input_ttl_seconds: number
  deposit_min_usd: number
  min_bot_investment_usd: number
  withdraw_min_usd: number
  withdraw_fee_usd: number
  withdraw_eta_minutes: number
  withdraw_daily_ceiling_usd: number
  tank_capacity_usd: number
  tank_topup_usd: number
  tank_autofill_trigger_usd: number
  paper_credit_usd: number
  demo_grant_usd: number
  demo_active_days: number
  rate_limit_per_minute: number
  sweeps_mainnet_enabled: boolean
  sweeps_testnet_enabled: boolean
  testnet_mode: boolean
  referral_rates: number[]
  tier_config: TierConfigEntry[]
  notices: NoticeEntry[]
}

/** Load app_settings and expose typed, defaulted accessors used across the API. */
export async function getSettings(): Promise<Settings> {
  const raw = await loadSettings()
  return {
    raw,
    bot_username: raw.bot_username ?? 'demo1vbot',
    community_url: raw.community_url ?? '',
    verified_deposit_channel: raw.verified_deposit_channel ?? '',
    popup_ttl_seconds: settingNumber(raw, 'popup_ttl_seconds', 8),
    input_ttl_seconds: settingNumber(raw, 'input_ttl_seconds', 300),
    deposit_min_usd: settingNumber(raw, 'deposit_min_usd', 20),
    min_bot_investment_usd: settingNumber(raw, 'min_bot_investment_usd', 20),
    withdraw_min_usd: settingNumber(raw, 'withdraw_min_usd', 10),
    withdraw_fee_usd: settingNumber(raw, 'withdraw_fee_usd', 1.2),
    withdraw_eta_minutes: settingNumber(raw, 'withdraw_eta_minutes', 6),
    withdraw_daily_ceiling_usd: settingNumber(raw, 'withdraw_daily_ceiling_usd', 100000),
    tank_capacity_usd: settingNumber(raw, 'tank_capacity_usd', 10),
    tank_topup_usd: settingNumber(raw, 'tank_topup_usd', 10),
    tank_autofill_trigger_usd: settingNumber(raw, 'tank_autofill_trigger_usd', 5),
    paper_credit_usd: settingNumber(raw, 'paper_credit_usd', 50),
    demo_grant_usd: settingNumber(raw, 'paper_credit_usd', 50),
    demo_active_days: settingNumber(raw, 'demo_active_days', 14),
    rate_limit_per_minute: settingNumber(raw, 'rate_limit_per_minute', 30),
    sweeps_mainnet_enabled: settingBool(raw, 'sweeps_mainnet_enabled', false),
    sweeps_testnet_enabled: settingBool(raw, 'sweeps_testnet_enabled', true),
    testnet_mode: settingBool(raw, 'testnet_mode', false),
    referral_rates: settingJson<number[]>(raw, 'referral_rates', [12, 4, 2]),
    tier_config: settingJson<TierConfigEntry[]>(raw, 'tier_config', []),
    notices: settingJson<NoticeEntry[]>(raw, 'notices', []),
  }
}

export function referralRates(settings: Settings): number[] {
  return settings.referral_rates
}

export function tierConfig(settings: Settings): TierConfigEntry[] {
  return settings.tier_config
}
