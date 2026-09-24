import { query, queryOne, num } from '@/lib/db'
import { withUser, ok } from '@/lib/http'
import { getSettings, referralRates, tierConfig } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export const GET = withUser(async ({ user, environment }) => {
  const tgId = user.tgId
  const settings = await getSettings()

  const wallet = (await queryOne<{
    equity_usd: unknown
    available_usd: unknown
    locked_usd: unknown
    hwm_usd: unknown
    tank_usd: unknown
    tank_capacity_usd: unknown
    tank_autofill: unknown
  }>(
    `SELECT equity_usd, available_usd, locked_usd, hwm_usd, tank_usd, tank_capacity_usd, tank_autofill
     FROM wallets WHERE user_id = $1 AND environment = $2`,
    [tgId, environment],
  )) ?? {
    equity_usd: 0, available_usd: 0, locked_usd: 0, hwm_usd: 0,
    tank_usd: 0, tank_capacity_usd: 0, tank_autofill: 0,
  }

  const botRows = await query<{
    id: string
    name: string
    product: string
    state: string
    capital_usd: unknown
    compound_percent: unknown
    equity_usd: unknown
  }>(
    `SELECT b.id, b.name, b.product, b.state, b.capital_usd, b.compound_percent,
            COALESCE(b.equity_usd, b.capital_usd) AS equity_usd
     FROM bots b
     WHERE b.user_id = $1 AND b.environment = $2
     ORDER BY b.created_at ASC`,
    [tgId, environment],
  )
  const bots = botRows.map((b) => {
    const capital = num(b.capital_usd)
    const equity = num(b.equity_usd, capital)
    const gain = equity - capital
    return {
      id: b.id,
      name: b.name,
      product: b.product,
      state: b.state,
      capital_usd: capital,
      compound_percent: num(b.compound_percent),
      compound: num(b.compound_percent),
      allocation: capital,
      equity,
      gain,
      percent: capital > 0 ? Math.round((gain / capital) * 1000) / 10 : 0,
    }
  })

  const deposits = await query<{ id: string; asset: string; chain: string; address: string }>(
    `SELECT id, asset, chain, address FROM deposit_addresses
     WHERE user_id = $1 AND environment = $2 ORDER BY asset ASC`,
    [tgId, environment],
  )

  const withdrawals = await query<{
    id: string; asset: string; chain: string; address: string; amount_usd: unknown; status: string; created_at: unknown
  }>(
    `SELECT id, asset, chain, address, amount_usd, status, created_at FROM withdrawals
     WHERE user_id = $1 AND environment = $2 ORDER BY created_at DESC LIMIT 25`,
    [tgId, environment],
  )

  const ledger = await query<{
    kind: string; asset: string; amount_usd: unknown; status: string; created_at: unknown
  }>(
    `SELECT kind, asset, amount_usd, status, created_at FROM ledger_entries
     WHERE user_id = $1 AND environment = $2 ORDER BY created_at DESC LIMIT 50`,
    [tgId, environment],
  )

  const engine = await query<{
    id: string; event_key: string; bot_name: string; net_realized: unknown; status: string; created_at: unknown
  }>(
    `SELECT event_key AS id, event_key, bot_name, net_realized, status, created_at
     FROM trading_engine_runs
     WHERE user_id = $1 AND environment = $2 ORDER BY created_at DESC LIMIT 25`,
    [tgId, environment],
  )

  const alerts = await query<{ id: string; asset: string; operator: string; threshold: unknown }>(
    `SELECT id, asset, operator, threshold FROM price_alerts
     WHERE user_id = $1 ORDER BY created_at DESC`,
    [tgId],
  )

  const referral = (await queryOne<{ accrued_usd: unknown; count: unknown }>(
    `SELECT COALESCE(SUM(accrued_usd), 0) AS accrued_usd, COUNT(*) AS count
     FROM referrals WHERE referrer_id = $1`,
    [tgId],
  )) ?? { accrued_usd: 0, count: 0 }

  const notifRow = await queryOne<{ preferences: unknown }>(
    `SELECT preferences FROM notification_preferences WHERE user_id = $1`,
    [tgId],
  )

  const quotes = await query<{ asset: string; price: unknown; updated_at: unknown }>(
    `SELECT asset, price, updated_at FROM market_quotes WHERE environment = $1`,
    [environment],
  )
  const latestQuoteAt = quotes.reduce((max, q) => Math.max(max, num(q.updated_at)), 0)
  const quoteAge = latestQuoteAt ? Math.max(0, Math.floor(Date.now() / 1000) - latestQuoteAt) : null

  return ok({
    environment,
    user: {
      id: user.tgId,
      first_name: user.first_name,
      username: user.username,
      tier: user.tier,
      is_admin: user.is_admin,
      onboarding_complete: user.onboarding_complete,
    },
    wallet: {
      equity: num(wallet.equity_usd),
      available: num(wallet.available_usd),
      locked: num(wallet.locked_usd),
      hwm: num(wallet.hwm_usd),
      tank: num(wallet.tank_usd),
      tank_capacity: num(wallet.tank_capacity_usd),
      tank_autofill: num(wallet.tank_autofill) === 1,
    },
    bots,
    deposits,
    withdrawals: withdrawals.map((w) => ({
      id: w.id, asset: w.asset, chain: w.chain, address: w.address,
      amount_usd: num(w.amount_usd), status: w.status, created_at: num(w.created_at),
    })),
    ledger: ledger.map((e) => ({
      kind: e.kind, asset: e.asset, amount_usd: num(e.amount_usd), status: e.status, created_at: num(e.created_at),
    })),
    engine: engine.map((r) => ({
      id: r.id, event_key: r.event_key, bot_name: r.bot_name,
      net_realized: num(r.net_realized), status: r.status, created_at: num(r.created_at),
    })),
    alerts: alerts.map((a) => ({ id: a.id, asset: a.asset, operator: a.operator, threshold: num(a.threshold) })),
    notifications: (notifRow?.preferences as Record<string, boolean>) ?? {},
    referral: {
      count: num(referral.count),
      accrued_usd: num(referral.accrued_usd),
      bot_username: settings.bot_username,
    },
    referral_rates: referralRates(settings),
    tier_config: tierConfig(settings),
    community_url: settings.community_url ?? '',
    quotes: quotes.map((q) => ({ asset: q.asset, price: num(q.price), updated_at: num(q.updated_at) })),
    quote_age: quoteAge,
    quote_fresh: quoteAge !== null && quoteAge <= 60,
    popup_ttl_seconds: num(settings.popup_ttl_seconds, 8),
    notices: settings.notices ?? [],
    demo: user.tier === 'Demo' || num(settings.demo_grant_usd) > 0
      ? { grant_usd: num(settings.demo_grant_usd) }
      : null,
  })
})
