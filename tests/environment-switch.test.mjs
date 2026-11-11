import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  shouldApplyEnvironmentProjection,
  shouldClearEnvironmentProjection,
  shouldPersistMainnetOnLeavingAdmin,
} from "../lib/environment-switch.js";

test("a late dashboard response from the previous workspace is ignored", () => {
  assert.equal(shouldApplyEnvironmentProjection("mainnet", "testnet"), false);
});

test("the currently selected workspace may update its own dashboard", () => {
  assert.equal(shouldApplyEnvironmentProjection("testnet", "testnet"), true);
});

test("clears the old projection before moving to another environment", () => {
  assert.equal(shouldClearEnvironmentProjection("mainnet", "testnet"), true);
  assert.equal(shouldClearEnvironmentProjection("testnet", "testnet"), false);
});

test("leaving the admin workspace persists mainnet for the shared bot session", async () => {
  assert.equal(shouldPersistMainnetOnLeavingAdmin("Admin", "testnet"), false);
  assert.equal(shouldPersistMainnetOnLeavingAdmin("Dashboard", "testnet"), true);
  assert.equal(shouldPersistMainnetOnLeavingAdmin("Dashboard", "mainnet"), false);

  const shell = await readFile(new URL("../components/tradepulse-shell.tsx", import.meta.url), "utf8");
  assert.match(shell, /shouldPersistMainnetOnLeavingAdmin\(tab, webEnvironment\)/);
  assert.match(shell, /request\("\/v1\/admin\/environment", \{[\s\S]*?environment: "mainnet"/);
});
