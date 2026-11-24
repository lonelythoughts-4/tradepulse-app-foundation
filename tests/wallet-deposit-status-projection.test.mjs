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

test("deposit checking shows a persistent result for detected deposits and monitoring failures", async () => {
  const wallet = await readFile(
    new URL("../components/workspaces/wallet-workspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(wallet, /result\.status === "pending_dust"/);
  assert.match(wallet, /Deposit found below the minimum/);
  assert.match(wallet, /The \{network\} watcher is starting for this address/);
  assert.match(wallet, /The \{network\} watcher is already active for this address/);
  assert.match(wallet, /network: depositNetworkName\(intent\.chain\)/);
  assert.match(wallet, /Could not start deposit monitoring/);
  assert.match(wallet, /The deposit route state changed/);
  assert.match(wallet, /role=\{depositActionFeedback\.kind === "error" \? "alert" : "status"\}/);
  assert.match(wallet, /onWalletUpdate\(\{\s*deposits:/);
  assert.doesNotMatch(wallet, /result\.checked_now/);
  assert.match(wallet, /Check deposit now/);
});

test("QR failures offer a retry without displaying a decorative fake code", async () => {
  const wallet = await readFile(
    new URL("../components/workspaces/wallet-workspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(wallet, /Loading deposit QR code/);
  assert.match(wallet, /QR code could not be loaded/);
  assert.match(wallet, /Retry QR code/);
  assert.match(wallet, /controller\.abort\(\)/);
  assert.doesNotMatch(wallet, /qr-grid/);
});

test("deposit address copy failures are reported instead of showing false success", async () => {
  const wallet = await readFile(
    new URL("../components/workspaces/wallet-workspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(wallet, /if \(!navigator\.clipboard\?\.writeText\)/);
  assert.match(wallet, /await navigator\.clipboard\.writeText\(intent\.address\)/);
  assert.match(wallet, /Could not copy the deposit address\. Select it to copy manually\./);
});

test("terminal routes stay visible in history but hide QR and deposit actions", async () => {
  const wallet = await readFile(
    new URL("../components/workspaces/wallet-workspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(wallet, /"under_review"/);
  assert.match(wallet, /"expired"/);
  assert.match(wallet, /"confirmed_pending_sweep"/);
  assert.match(wallet, /Your transfer was detected and is being processed/);
  assert.match(wallet, /route\.status\.toLowerCase\(\) !== "credited_and_closed"/);
  assert.match(wallet, /depositStatusTone\(route\.status\)/);
  assert.match(wallet, /const depositClosed = Boolean\(intent && !watchableDepositStatuses\.has\(depositStatus\)\)/);
  assert.match(wallet, /depositClosed && depositStatus !== "credited_and_closed"/);
  assert.match(wallet, /!depositClosed && \(/);
});
