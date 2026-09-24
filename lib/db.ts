import { Pool, type QueryResultRow } from 'pg'

// CockroachDB Cloud requires TLS. We reuse a single pool across HMR reloads.
const globalForDb = globalThis as unknown as { __tradepulsePool?: Pool }

function createPool() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Add it in Project Settings → Vars.')
  }
  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  })
}

export function getPool(): Pool {
  if (!globalForDb.__tradepulsePool) {
    globalForDb.__tradepulsePool = createPool()
  }
  return globalForDb.__tradepulsePool
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const pool = getPool()
  const result = await pool.query<T>(text, params as never[])
  return result.rows
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}

/** CockroachDB returns bigint columns as strings; coerce safely to a JS number. */
export function num(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}
