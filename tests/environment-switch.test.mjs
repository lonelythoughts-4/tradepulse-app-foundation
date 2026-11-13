import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  shouldApplyEnvironmentProjection,
  shouldClearEnvironmentProjection,
  shouldResetEnvironmentForAccess,
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

test("admin testnet selection persists across tabs while non-admin access returns to mainnet", async () => {
  assert.equal(shouldResetEnvironmentForAccess(true, "testnet"), false);
  assert.equal(shouldResetEnvironmentForAccess(true, "mainnet"), false);
  assert.equal(shouldResetEnvironmentForAccess(false, "testnet"), true);
  assert.equal(shouldResetEnvironmentForAccess(false, "mainnet"), false);

  const shell = await readFile(new URL("../components/tradepulse-shell.tsx", import.meta.url), "utf8");
  assert.match(shell, /shouldResetEnvironmentForAccess\(data\.user\.is_admin, webEnvironment\)/);
  assert.match(shell, /environment=\{\(data\.user\.is_admin \? webEnvironment : "mainnet"\)\.toUpperCase\(\)\}/);
  assert.match(shell, /headers = \(targetEnvironment = webEnvironment\)/);
  const resetEffect = shell.match(
    /if \(!data \|\| !shouldResetEnvironmentForAccess[\s\S]*?\}, \[([^\]]+)\]\);/,
  );
  assert.ok(resetEffect, "the environment access guard should remain in place");
  assert.doesNotMatch(resetEffect[1], /\btab\b/);

  const switchStart = shell.indexOf("const switchAdminEnvironment = async");
  const switchEnd = shell.indexOf("const refreshAdmin", switchStart);
  const switcher = shell.slice(switchStart, switchEnd);
  assert.ok(switcher.indexOf("setWebEnvironment(nextEnvironment)") < switcher.indexOf("await request("));
  assert.match(switcher, /environmentSwitchRevisionRef\.current/);
  assert.match(switcher, /setWebEnvironment\(priorEnvironment\)/);
});
