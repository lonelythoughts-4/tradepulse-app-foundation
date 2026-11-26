import assert from "node:assert/strict";
import test from "node:test";

import {
  dashboardSnapshotStorageKey,
  readDashboardSnapshot,
  readSessionCacheScope,
  removeDashboardSnapshot,
  writeDashboardSnapshot,
  type DashboardSnapshot,
} from "../lib/dashboard-session-cache.ts";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const dashboard: DashboardSnapshot = {
  user: {
    id: 42,
    first_name: "Trader",
    tier: "member",
    fee_credit_usd: 0,
    is_admin: false,
    onboarding_complete: true,
  },
  environment: "mainnet",
  community_url: "https://t.me/example",
  wallet: {
    available: 24,
    locked: 8,
    equity: 32,
    hwm: 32,
    tank: 0,
    tank_capacity: 0,
    tank_autofill: false,
  },
  bots: [{
    id: "bot-1",
    name: "Strategy",
    product: "synthetic",
    state: "running",
    capital_usd: 32,
    compound_percent: 0,
  }],
  alerts: [{
    id: 1,
    asset: "BTC",
    operator: "above",
    threshold: 100_000,
  }],
  ledger: [{
    id: 3,
    kind: "settlement",
    asset: "USD",
    amount_usd: 4,
    status: "completed",
    created_at: 1_700_000_000,
  }],
};

test("dashboard snapshots are read only under their active session scope", () => {
  const storage = new MemoryStorage();
  const scope = "a".repeat(64);
  const otherScope = "b".repeat(64);
  writeDashboardSnapshot(storage, scope, dashboard, 10_000);

  assert.deepEqual(readDashboardSnapshot(storage, scope, 11_000), dashboard);
  assert.equal(readDashboardSnapshot(storage, otherScope, 11_000), null);
  assert.notEqual(dashboardSnapshotStorageKey(scope), dashboardSnapshotStorageKey(otherScope));
});

test("session cache scope parsing accepts only the opaque fingerprint cookie", () => {
  const scope = "c".repeat(64);
  assert.equal(readSessionCacheScope(`theme=dark; tradepulse_session_cache_scope=${scope}`), scope);
  assert.equal(readSessionCacheScope("tradepulse_session_cache_scope=not-an-auth-token"), null);
  assert.equal(readSessionCacheScope("tradepulse_browser_session=signed-token"), null);
});

test("malformed and expired dashboard snapshots are ignored and removable", () => {
  const storage = new MemoryStorage();
  const scope = "d".repeat(64);
  storage.setItem(dashboardSnapshotStorageKey(scope), "{");
  assert.equal(readDashboardSnapshot(storage, scope), null);

  writeDashboardSnapshot(storage, scope, dashboard, 1_000);
  assert.equal(readDashboardSnapshot(storage, scope, 1_000 + 31 * 24 * 60 * 60 * 1_000), null);
  removeDashboardSnapshot(storage, scope);
  assert.equal(storage.getItem(dashboardSnapshotStorageKey(scope)), null);
});
