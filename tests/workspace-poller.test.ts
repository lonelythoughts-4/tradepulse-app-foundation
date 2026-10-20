import assert from "node:assert/strict";
import test from "node:test";

import { createResourcePoller } from "../components/workspaces/use-resource-poller.ts";

test("polls Synthetic only while the Synthetic workspace is active and visible", async () => {
  let polls = 0;
  const poller = createResourcePoller({
    isVisible: () => false,
    poll: async () => { polls += 1; },
  });

  await poller.tick();
  assert.equal(polls, 0);

  poller.setVisible(true);
  await poller.tick();
  assert.equal(polls, 1);
});

test("reconciles the active workspace immediately when visibility returns", async () => {
  let polls = 0;
  const poller = createResourcePoller({
    isVisible: () => false,
    poll: async () => { polls += 1; },
  });

  await poller.setVisible(true);
  assert.equal(polls, 1);
});

test("does not apply an old route response after hash navigation", async () => {
  let resolveOld!: () => void;
  const applied: string[] = [];
  const poller = createResourcePoller({
    isVisible: () => true,
    poll: async (token) => {
      if (token === 1) await new Promise<void>((resolve) => { resolveOld = resolve; });
      return token === 1 ? "old" : "new";
    },
    apply: (value) => applied.push(value),
  });

  const oldRequest = poller.tick();
  await Promise.resolve();
  poller.invalidate();
  const newRequest = poller.tick();
  resolveOld();
  await Promise.all([oldRequest, newRequest]);

  assert.deepEqual(applied, ["new"]);
});
