import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  shouldApplyEnvironmentProjection,
  shouldResetEnvironmentForAccess,
} from "../lib/environment-switch.js";

test("a late dashboard response from the previous workspace is ignored", () => {
  assert.equal(shouldApplyEnvironmentProjection("mainnet", "testnet"), false);
});

test("the currently selected workspace may update its own dashboard", () => {
  assert.equal(shouldApplyEnvironmentProjection("testnet", "testnet"), true);
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
  assert.ok(switcher.indexOf("const dashboardRequest = load(nextEnvironment)") < switcher.indexOf("const save ="));
  assert.doesNotMatch(switcher, /setWebEnvironment\(nextEnvironment\)/);
  assert.doesNotMatch(switcher, /updateDashboard\(null\)/);
  assert.match(switcher, /environmentSwitchRevisionRef\.current/);
  assert.match(switcher, /setWebEnvironment\(priorEnvironment\)/);
  assert.match(switcher, /const overviewRequest = request\("\/v1\/admin\/overview"/);
  assert.match(switcher, /const dashboardRequest = load\(nextEnvironment\)/);
  assert.match(switcher, /loadedDashboard\?\.environment !== nextEnvironment/);
  assert.match(switcher, /Promise\.all\(\[overviewRequest, dashboardRequest\]\)/);
  assert.match(switcher, /const \[overview, dashboardLoaded\] = await Promise\.all/);
  assert.match(switcher, /if \(!dashboardLoaded\)/);
  assert.match(switcher, /updateDashboard\(previousDashboard\)/);
  assert.match(switcher, /applyResource\("synthetic", previousSynthetic/);
  assert.match(switcher, /setAdmin\(previousAdmin\)/);
  assert.doesNotMatch(switcher, /setNotice\(\s*error\.message/);
  assert.match(switcher, /revision !== environmentSwitchRevisionRef\.current \|\|/);
});

test("session checks stay neutral and retryable until a secure handoff is needed", async () => {
  const shell = await readFile(new URL("../components/tradepulse-shell.tsx", import.meta.url), "utf8");
  const unauthenticatedStart = shell.indexOf("  if (!data) {");
  const authenticatedStart = shell.indexOf("  const changeLanguage", unauthenticatedStart);
  assert.notEqual(unauthenticatedStart, -1, "the unauthenticated view should be explicit");
  assert.ok(authenticatedStart > unauthenticatedStart, "the unauthenticated view should end before authenticated controls");

  const unauthenticatedView = shell.slice(unauthenticatedStart, authenticatedStart);
  assert.match(unauthenticatedView, /if \(!sessionBootstrapComplete \|\| loading\) \{\s*return <DeskLoading status="Checking your saved session/);
  assert.match(unauthenticatedView, /if \(!sessionHandoffRequired\) \{\s*return \(\s*<DeskLoading/);
  assert.match(unauthenticatedView, /<AuthEntryPage/);
  assert.match(unauthenticatedView, /Checking your saved session/);
  assert.match(unauthenticatedView, /sessionHandoffRequired \? \(\s*<BrowserBotHandoff/);
  assert.doesNotMatch(unauthenticatedView, /could not reach your desk|sign-in could not be completed/i);
});
