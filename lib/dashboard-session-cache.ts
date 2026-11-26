const SESSION_CACHE_COOKIE = "tradepulse_session_cache_scope";
const DASHBOARD_SNAPSHOT_VERSION = 1;
const DASHBOARD_SNAPSHOT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1_000;

export type DashboardSnapshot = {
  user: {
    id: number;
    first_name?: string | null;
    username?: string | null;
    tier: string;
    language_code?: string | null;
    fee_credit_usd: number;
    avatar_id?: string | null;
    is_admin: boolean;
    onboarding_complete: boolean;
    onboarding?: {
      step: number;
      terms_accepted_at?: number | null;
      channel: {
        enabled: boolean;
        configured: boolean;
        url: string;
        verified: boolean;
        verified_at?: number | null;
      };
    };
  };
  environment: string;
  features?: { live_desk_enabled?: boolean };
  community_url: string;
  wallet: {
    available: number;
    locked: number;
    equity: number;
    hwm: number;
    tank?: number;
    tank_capacity?: number;
    tank_autofill?: boolean;
  };
  bots: Array<{
    id: string;
    name: string;
    product: string;
    state: string;
    capital_usd: number;
    compound_percent: number;
    demo_trial?: number;
    demo_credit_only?: boolean;
    environment?: string;
  }>;
  alerts: Array<{
    id: number;
    asset: string;
    operator: string;
    threshold: number;
  }>;
  ledger: Array<{
    id?: number;
    kind: string;
    asset: string;
    chain?: string;
    amount_usd: number;
    status: string;
    created_at: number;
  }>;
};

type DashboardSnapshotSource = DashboardSnapshot;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isDashboardSnapshot(value: unknown): value is DashboardSnapshot {
  if (!isRecord(value) || !isRecord(value.user) || !isRecord(value.wallet)) return false;
  const { user, wallet } = value;
  const optionalString = (record: Record<string, unknown>, key: string) =>
    record[key] === undefined || record[key] === null || typeof record[key] === "string";
  const optionalNumber = (record: Record<string, unknown>, key: string) =>
    record[key] === undefined || record[key] === null || isFiniteNumber(record[key]);
  const onboardingValid = user.onboarding === undefined || (
    isRecord(user.onboarding)
    && Number.isInteger(user.onboarding.step)
    && optionalNumber(user.onboarding, "terms_accepted_at")
    && isRecord(user.onboarding.channel)
    && typeof user.onboarding.channel.enabled === "boolean"
    && typeof user.onboarding.channel.configured === "boolean"
    && typeof user.onboarding.channel.url === "string"
    && typeof user.onboarding.channel.verified === "boolean"
    && optionalNumber(user.onboarding.channel, "verified_at")
  );
  const featuresValid = value.features === undefined || (
    isRecord(value.features)
    && (value.features.live_desk_enabled === undefined
      || typeof value.features.live_desk_enabled === "boolean")
  );
  return Number.isInteger(user.id)
    && optionalString(user, "first_name")
    && optionalString(user, "username")
    && optionalString(user, "language_code")
    && (user.avatar_id === undefined || user.avatar_id === null || typeof user.avatar_id === "string")
    && typeof user.tier === "string"
    && isFiniteNumber(user.fee_credit_usd)
    && typeof user.is_admin === "boolean"
    && typeof user.onboarding_complete === "boolean"
    && onboardingValid
    && typeof value.environment === "string"
    && featuresValid
    && typeof value.community_url === "string"
    && ["available", "locked", "equity", "hwm"]
      .every((key) => isFiniteNumber(wallet[key]))
    && optionalNumber(wallet, "tank")
    && optionalNumber(wallet, "tank_capacity")
    && (wallet.tank_autofill === undefined || typeof wallet.tank_autofill === "boolean")
    && Array.isArray(value.bots)
    && value.bots.every((bot) => isRecord(bot)
      && typeof bot.id === "string"
      && typeof bot.name === "string"
      && typeof bot.product === "string"
      && typeof bot.state === "string"
      && isFiniteNumber(bot.capital_usd)
      && isFiniteNumber(bot.compound_percent)
      && optionalNumber(bot, "demo_trial")
      && (bot.demo_credit_only === undefined || typeof bot.demo_credit_only === "boolean")
      && optionalString(bot, "environment"))
    && Array.isArray(value.alerts)
    && value.alerts.every((alert) => isRecord(alert)
      && Number.isInteger(alert.id)
      && typeof alert.asset === "string"
      && typeof alert.operator === "string"
      && isFiniteNumber(alert.threshold))
    && Array.isArray(value.ledger)
    && value.ledger.every((entry) => isRecord(entry)
      && (entry.id === undefined || Number.isInteger(entry.id))
      && typeof entry.kind === "string"
      && typeof entry.asset === "string"
      && optionalString(entry, "chain")
      && isFiniteNumber(entry.amount_usd)
      && typeof entry.status === "string"
      && isFiniteNumber(entry.created_at));
}

export function dashboardSnapshotStorageKey(scope: string): string {
  return `tradepulse.dashboard-snapshot:v${DASHBOARD_SNAPSHOT_VERSION}:${scope}`;
}

export function readSessionCacheScope(cookieHeader: string): string | null {
  const prefix = `${SESSION_CACHE_COOKIE}=`;
  const value = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);
  return value && /^[a-f0-9]{64}$/i.test(value) ? value.toLowerCase() : null;
}

export function readDashboardSnapshot(
  storage: StorageLike,
  scope: string,
  now = Date.now(),
): DashboardSnapshot | null {
  const raw = storage.getItem(dashboardSnapshotStorageKey(scope));
  if (!raw) return null;
  try {
    const saved = JSON.parse(raw) as unknown;
    if (!isRecord(saved)
      || saved.version !== DASHBOARD_SNAPSHOT_VERSION
      || saved.scope !== scope
      || !isFiniteNumber(saved.savedAt)
      || saved.savedAt > now
      || now - saved.savedAt > DASHBOARD_SNAPSHOT_MAX_AGE_MS
      || !isDashboardSnapshot(saved.dashboard)) {
      return null;
    }
    return saved.dashboard;
  } catch {
    return null;
  }
}

export function writeDashboardSnapshot(
  storage: StorageLike,
  scope: string,
  dashboard: DashboardSnapshotSource,
  now = Date.now(),
): void {
  const snapshot: DashboardSnapshot = {
    user: {
      id: dashboard.user.id,
      first_name: dashboard.user.first_name,
      username: dashboard.user.username,
      tier: dashboard.user.tier,
      language_code: dashboard.user.language_code,
      fee_credit_usd: dashboard.user.fee_credit_usd,
      avatar_id: dashboard.user.avatar_id,
      is_admin: dashboard.user.is_admin,
      onboarding_complete: dashboard.user.onboarding_complete,
      onboarding: dashboard.user.onboarding,
    },
    environment: dashboard.environment,
    features: dashboard.features,
    community_url: dashboard.community_url,
    wallet: {
      available: dashboard.wallet.available,
      locked: dashboard.wallet.locked,
      equity: dashboard.wallet.equity,
      hwm: dashboard.wallet.hwm,
      tank: dashboard.wallet.tank,
      tank_capacity: dashboard.wallet.tank_capacity,
      tank_autofill: dashboard.wallet.tank_autofill,
    },
    bots: dashboard.bots,
    alerts: dashboard.alerts,
    ledger: dashboard.ledger.slice(0, 10).map((entry) => ({
      id: entry.id,
      kind: entry.kind,
      asset: entry.asset,
      chain: entry.chain,
      amount_usd: entry.amount_usd,
      status: entry.status,
      created_at: entry.created_at,
    })),
  };
  storage.setItem(dashboardSnapshotStorageKey(scope), JSON.stringify({
    version: DASHBOARD_SNAPSHOT_VERSION,
    scope,
    savedAt: now,
    dashboard: snapshot,
  }));
}

export function removeDashboardSnapshot(storage: StorageLike, scope: string): void {
  storage.removeItem(dashboardSnapshotStorageKey(scope));
}
