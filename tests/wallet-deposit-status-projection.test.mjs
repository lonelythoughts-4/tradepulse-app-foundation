import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("customer wallet statuses do not expose internal sweep stages", async () => {
  const wallet = await readFile(
    new URL("../components/workspaces/wallet-workspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(wallet, /sweep_confirming:\s*"Processing deposit"/);
  assert.match(wallet, /sweeping:\s*"Processing deposit"/);
  assert.match(wallet, /under_review:\s*"Under review"/);
  assert.doesNotMatch(wallet, /sweep_confirming:\s*"Confirming sweep"/);
});

test("deposit checking reports a detected below-minimum transfer instead of a generic start notice", async () => {
  const wallet = await readFile(
    new URL("../components/workspaces/wallet-workspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(wallet, /result\.status === "pending_dust"/);
  assert.match(wallet, /Deposit detected below the minimum/);
  assert.match(wallet, /Check deposit now/);
});

test("a credited one-time route no longer shows its QR or deposit controls", async () => {
  const wallet = await readFile(
    new URL("../components/workspaces/wallet-workspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(wallet, /const depositClosed = intent\?\.status\.toLowerCase\(\) === "credited_and_closed"/);
  assert.match(wallet, /!depositClosed && \(/);
});
