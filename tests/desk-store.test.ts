import assert from "node:assert/strict";
import test from "node:test";

import { createDeskStore, type DeskSnapshot } from "../lib/desk-store.ts";

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
