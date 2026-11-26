import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const help = fs.readFileSync(path.join(root, "components", "workspaces", "help-workspace.tsx"), "utf8");
const desk = fs.readFileSync(path.join(root, "components", "workspaces", "desk-workspace.tsx"), "utf8");
const admin = fs.readFileSync(path.join(root, "components", "workspaces", "admin-workspace.tsx"), "utf8");
const wallet = fs.readFileSync(path.join(root, "components", "workspaces", "wallet-workspace.tsx"), "utf8");
const shell = fs.readFileSync(path.join(root, "components", "tradepulse-shell.tsx"), "utf8");

test("Help directs general support questions to the administrator on Telegram", () => {
  assert.match(help, /href="https:\/\/t\.me\/thetessaractadmin"/);
  assert.match(help, /target="_blank"[\s\S]*?rel="noopener noreferrer"/);
  assert.match(help, /Message @thetessaractadmin on Telegram/);
  assert.match(help, /Need a hand with your account, bots, deposits, or anything else\?/);
  assert.match(help, /Never share passwords, login codes, recovery phrases, or private keys\./);
  assert.doesNotMatch(help, /\/v1\/support\/tickets|Support request details|SUPPORT THREAD/);
});

test("Help Telegram support copy is translated in all supported app languages", () => {
  const i18n = fs.readFileSync(path.join(root, "lib", "desk-i18n.ts"), "utf8");
  assert.match(i18n, /"Need a hand with your account, bots, deposits, or anything else\? Message us directly on Telegram\.": \[[^\]]+,\s*[^\]]+,\s*[^\]]+,\s*[^\]]+,\s*[^\]]+,\s*[^\]]+,\s*[^\]]+\]/);
  assert.match(i18n, /"Message @thetessaractadmin on Telegram": \[[^\]]+,\s*[^\]]+,\s*[^\]]+,\s*[^\]]+,\s*[^\]]+,\s*[^\]]+,\s*[^\]]+\]/);
});

test("alert actions have independent pending keys and reconcile returned state", () => {
  assert.match(desk, /alertPendingRef\.current\.has\(key\)/);
  assert.doesNotMatch(desk, /if \(alertPending\) return/);
  assert.match(desk, /setAlerts\(\(current\) => \[\s*savedAlert,/);
  assert.match(desk, /setAlerts\(\(current\) => current\.filter\(\(item\) => item\.id !== alert\.id\)\)/);
});

test("admin support actions are scoped to one ticket and reconcile failures privately", () => {
  assert.doesNotMatch(admin, /adminTicketPending/);
  assert.match(admin, /const openKey = `support:\$\{ticket\.id\}:open`/);
  assert.match(admin, /disabled=\{isAdminActionPending\(openKey\)\}/);
  assert.match(admin, /const actionKey = `support:\$\{ticket\.id\}:\$\{action\}`/);
  assert.match(admin, /logDeskFailure\("admin\.support-ticket-status", error\)/);
  assert.match(admin, /scheduleReconcile\(\)/);
  assert.doesNotMatch(admin, /The admin action completed, but its overview could not refresh/);
  assert.doesNotMatch(admin, /void reload\(\)\.catch\(\(\) => undefined\)/);
});

test("admin overview outages keep a neutral retry path without exposing error detail", () => {
  const retryStart = shell.indexOf("const retryAdminOverview = async");
  const retryEnd = shell.indexOf("const walletEnvironment", retryStart);
  const retryAction = shell.slice(retryStart, retryEnd);
  assert.match(shell, /setAdminLoadError\("unavailable"\)/);
  assert.match(shell, /adminLoadError \? \([\s\S]*?Operations data could not be loaded\.[\s\S]*?Try again/);
  assert.match(retryAction, /catch \{\s*if \(shouldApplyEnvironmentProjection[\s\S]*?setAdminLoadError\("unavailable"\);/);
  assert.doesNotMatch(retryAction, /error\.message|setNotice\(/);
});

test("admin ticket status writes are serialized and ignore stale action responses", () => {
  assert.match(admin, /ticketStatusQueues\.current\.get\(ticket\.id\)/);
  assert.match(admin, /ticketStatusVersions\.current\.get\(ticket\.id\) === version/);
  assert.match(admin, /setTicketStatusOverrides\(\(current\) => \(\{ \.\.\.current, \[ticket\.id\]: status \}\)\)/);
});

test("withdrawal and admin-funding retries reuse stable idempotency keys", () => {
  assert.match(wallet, /getIdempotencyKeyForPayload\(\s*withdrawalIdempotencyKeys\.current/);
  assert.match(wallet, /"Idempotency-Key": idempotencyKey/);
  assert.match(admin, /getIdempotencyKeyForPayload\(\s*fundingIdempotencyKeys\.current/);
  assert.match(admin, /"Idempotency-Key": idempotencyKey/);
  assert.match(admin, /formRevision === fundingFormRevision\.current/);
});

test("background bot reconciliation failures are visible and support refresh stays single-flight", () => {
  const bots = fs.readFileSync(path.join(root, "components", "workspaces", "bots-workspace.tsx"), "utf8");
  assert.doesNotMatch(bots, /void reload\(\)\.catch\(\(\) => undefined\)/);
  assert.match(help, /if \(cancelled \|\| refreshInFlight\) return/);
  assert.match(help, /requestId === ticketThreadRequestRef\.current && selectedTicketIdRef\.current === ticket\.id/);
});
