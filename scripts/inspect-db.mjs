import pg from 'pg'

const { Client } = pg
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

await client.connect()

const tables = await client.query(`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name
`)

console.log('=== TABLES ===')
console.log(tables.rows.map(r => r.table_name).join('\n'))

for (const { table_name } of tables.rows) {
  const cols = await client.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [table_name],
  )
  console.log(`\n=== ${table_name} ===`)
  for (const c of cols.rows) {
    console.log(`  ${c.column_name} :: ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : ''} ${c.column_default ? 'DEFAULT ' + c.column_default : ''}`.trim())
  }
  const count = await client.query(`SELECT count(*)::int AS n FROM "${table_name}"`)
  console.log(`  (rows: ${count.rows[0].n})`)
}

await client.end()
