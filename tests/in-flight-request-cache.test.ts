import assert from "node:assert/strict";
import test from "node:test";

import { createInFlightRequestCache } from "../lib/in-flight-request-cache.ts";

test("deduplicates concurrent requests with the same key", async () => {
  const cache = createInFlightRequestCache();
  let starts = 0;
  let resolveRequest!: (value: string) => void;
  const start = () => {
    starts += 1;
    return new Promise<string>((resolve) => { resolveRequest = resolve; });
  };

  const first = cache.request("dashboard:mainnet", undefined, start);
  const second = cache.request("dashboard:mainnet", undefined, start);
  await Promise.resolve();
  assert.equal(starts, 1);

  resolveRequest("snapshot");
  assert.deepEqual(await Promise.all([first, second]), ["snapshot", "snapshot"]);
});

test("aborting one subscriber does not cancel a request another tab is using", async () => {
  const cache = createInFlightRequestCache();
  const firstController = new AbortController();
  let starts = 0;
  let resolveRequest!: (value: string) => void;
  const start = () => {
    starts += 1;
    return new Promise<string>((resolve) => { resolveRequest = resolve; });
  };

  const first = cache.request("dashboard:mainnet", firstController.signal, start);
  const second = cache.request("dashboard:mainnet", undefined, start);
  const firstRejected = assert.rejects(first, { name: "AbortError" });
  await Promise.resolve();
  firstController.abort();

  resolveRequest("snapshot");
  await firstRejected;
  assert.equal(await second, "snapshot");
  assert.equal(starts, 1);
});
