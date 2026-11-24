import assert from "node:assert/strict";
import test from "node:test";

import {
  createResourcePoller,
  isWorkspacePollingAllowed,
} from "../components/workspaces/use-resource-poller.ts";

test("starts API polling only for the active, visible workspace", () => {
  assert.equal(isWorkspacePollingAllowed("Synthetic", "Synthetic", true, true), true);
  assert.equal(isWorkspacePollingAllowed("Dashboard", "Synthetic", true, true), false);
  assert.equal(isWorkspacePollingAllowed("Synthetic", "Synthetic", false, true), false);
  assert.equal(isWorkspacePollingAllowed("Synthetic", "Synthetic", true, false), false);
});

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
  let oldSignal: AbortSignal | undefined;
  let polls = 0;
  const applied: string[] = [];
  const poller = createResourcePoller({
    isVisible: () => true,
    poll: async (_token, signal) => {
      polls += 1;
      if (polls === 1) {
        oldSignal = signal;
        await new Promise<void>((resolve) => { resolveOld = resolve; });
        return "old";
      }
      return "new";
    },
    apply: (value) => applied.push(value),
  });

  const oldRequest = poller.tick();
  await Promise.resolve();
  poller.invalidate();
  assert.equal(oldSignal?.aborted, true);
  await poller.tick();
  assert.equal(polls, 1);
  resolveOld();
  await oldRequest;
  await poller.tick();

  assert.deepEqual(applied, ["new"]);
});

test("keeps polling single-flight and reports an error before recovering", async () => {
  let polls = 0;
  const errors: unknown[] = [];
  const applied: string[] = [];
  const poller = createResourcePoller({
    isVisible: () => true,
    poll: async () => {
      polls += 1;
      if (polls === 1) throw new Error("temporary failure");
      return "recovered";
    },
    onError: (error) => errors.push(error),
    apply: (value) => applied.push(value),
  });

  await poller.tick();
  await poller.tick();

  assert.equal(errors.length, 1);
  assert.deepEqual(applied, ["recovered"]);
});

test("does not start a second request while the current poll is in flight", async () => {
  let resolvePoll!: () => void;
  let polls = 0;
  const poller = createResourcePoller({
    isVisible: () => true,
    poll: async () => {
      polls += 1;
      await new Promise<void>((resolve) => { resolvePoll = resolve; });
    },
  });

  const first = poller.tick();
  await Promise.resolve();
  await poller.tick();
  assert.equal(polls, 1);
  resolvePoll();
  await first;
});

test("aborts hidden polling and refreshes when visibility returns", async () => {
  let resolvePoll!: () => void;
  let signal: AbortSignal | undefined;
  let polls = 0;
  const poller = createResourcePoller({
    isVisible: () => true,
    poll: async (_token, currentSignal) => {
      polls += 1;
      if (polls === 1) {
        signal = currentSignal;
        await new Promise<void>((resolve) => { resolvePoll = resolve; });
      }
    },
  });

  const first = poller.tick();
  await Promise.resolve();
  await poller.setVisible(false);
  assert.equal(signal?.aborted, true);
  const visible = poller.setVisible(true);
  resolvePoll();
  await Promise.all([first, visible]);

  assert.equal(polls, 2);
});
