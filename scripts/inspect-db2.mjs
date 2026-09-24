import pg from 'pg'

const { Client } = pg
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
await client.connect()

const remaining = ['synthetic_engine_meta','synthetic_positions','synthetic_risk_profiles','synthetic_ticks','tank_settings','tickets','trading_engine_runs','ui_popups','users','whitelists','withdrawals']
for (const t of remaining) {
  const cols = await client.query(
    `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`, [t])
  console.log(`\n=== ${t} ===`)
  for (const c of cols.rows) console.log(`  ${c.column_name} :: ${c.data_type} ${c.is_nullable==='NO'?'NOT NULL':''} ${c.column_default?'DEFAULT '+c.column_default:''}`.trim())
}

const dump = async (label, sql) => {
  const r = await client.query(sql)
  console.log(`\n### ${label} (${r.rows.length})`)
  console.log(JSON.stringify(r.rows, null, 2))
}
await dump('app_settings', 'SELECT key, value FROM app_settings ORDER BY key')
await dump('users', 'SELECT * FROM users LIMIT 5')
await dump('admin_members', 'SELECT * FROM admin_members')
await dump('bots', 'SELECT * FROM bots LIMIT 5')
await dump('balances', 'SELECT * FROM balances LIMIT 10')
await dump('account_metrics', 'SELECT * FROM account_metrics LIMIT 10')
await dump('ui_popups', 'SELECT * FROM ui_popups LIMIT 10')
await dump('tank_settings', 'SELECT * FROM tank_settings LIMIT 5')
await dump('synthetic_risk_profiles', 'SELECT * FROM synthetic_risk_profiles LIMIT 5')

await client.end()
