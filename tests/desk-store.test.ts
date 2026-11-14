import assert from "node:assert/strict";
import test from "node:test";

import { applyResourceIfUnchanged, createDeskStore, type DeskSnapshot } from "../lib/desk-store.ts";

function snapshot(): DeskSnapshot {
  return {
    resources: {
      wallet: { availableUsd: 100 },
      synthetic: { availableUsd: 20 },
    },
  };
}

test("does not notify a wallet selector when only Synthetic changes", () => {
  const store = createDeskStore(snapshot());
  let walletNotifications = 0;
  const unsubscribe = store.subscribeSelector(
    (state) => state.resources.wallet,
    () => {
      walletNotifications += 1;
    },
  );

  store.applyResource("synthetic", { availableUsd: 25 }, 1);

  assert.equal(walletNotifications, 0);
  unsubscribe();
});

test("keeps bot action pending state separate by exact action key", async () => {
  const store = createDeskStore(snapshot());
  let releaseFirstAction!: () => void;
  const firstAction = store.runAction("bot:42:pause", () => new Promise<void>((resolve) => {
    releaseFirstAction = resolve;
  }));

  await Promise.resolve();

  assert.equal(store.getState().actions["bot:42:pause"]?.pending, true);
  assert.equal(store.getState().actions["bot:43:pause"], undefined);

  releaseFirstAction();
  await firstAction;

  assert.equal(store.getState().actions["bot:42:pause"]?.pending, false);
  assert.equal(store.getState().actions["bot:43:pause"], undefined);
});

test("rejects an older resource response after a newer revision is applied", () => {
  const store = createDeskStore(snapshot());

  assert.equal(store.applyResource("wallet", { availableUsd: 140 }, 2), true);
  assert.equal(store.applyResource("wallet", { availableUsd: 90 }, 1), false);
  assert.deepEqual(store.getState().resources.wallet, { availableUsd: 140 });
});

test("unversioned dashboard writes share a monotonic revision with explicit writers", () => {
  const store = createDeskStore(snapshot());

  assert.equal(store.applyResource("dashboard", { source: "poll" }), true);
  assert.equal(store.applyResource("dashboard", { source: "action" }), true);
  assert.equal(store.getState().revisions.dashboard, 1);
  assert.deepEqual(store.getState().resources.dashboard, { source: "action" });
  assert.equal(store.applyResource("dashboard", { source: "stale" }, 0), false);
});

test("a dashboard poll cannot overwrite a local update made after the request began", () => {
  const store = createDeskStore(snapshot());
  const requestRevision = store.getState().revisions.dashboard ?? -1;
  store.applyResource("dashboard", { source: "action" });

  assert.equal(applyResourceIfUnchanged(store, "dashboard", { source: "stale-poll" }, requestRevision), false);
  assert.deepEqual(store.getState().resources.dashboard, { source: "action" });
});
