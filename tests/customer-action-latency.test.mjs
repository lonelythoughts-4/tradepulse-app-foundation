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

test("support ticket mutations update the visible thread before background reconciliation", () => {
  const createStart = help.indexOf('const result = await request("/v1/support/tickets"');
  const createEnd = help.indexOf("} finally {", createStart);
  const createAction = help.slice(createStart, createEnd);
  assert.ok(createStart >= 0);
  assert.match(createAction, /setActiveTicket\(ticket\)/);
  assert.match(createAction, /setTicketMessages\(\[firstMessage\]\)/);
  assert.match(help, /maxLength=\{1500\}/);
  assert.match(createAction, /void loadTickets\(\)/);
  assert.doesNotMatch(createAction, /await Promise\.all/);

  const replyStart = help.indexOf('await request(`/v1/support/tickets/${ticket.id}/messages`');
  const replyEnd = help.indexOf("} finally { endTicketReply", replyStart);
  const replyAction = help.slice(replyStart, replyEnd);
  assert.ok(replyStart >= 0);
  assert.match(replyAction, /setTicketMessages\(\(current\) => \[\.\.\.current, reply\]\)/);
  assert.match(replyAction, /void loadTickets\(\)/);
  assert.doesNotMatch(replyAction, /await Promise\.all/);
});

test("ticket opening and reply pending states are keyed to their ticket", () => {
  assert.match(help, /ticketOpeningIds\.has\(ticket\.id\)/);
  assert.match(help, /ticketReplyPendingIds\.has\(activeTicket\.id\)/);
  assert.match(help, /ticketOpeningRef\.current\.has\(ticketId\)/);
  assert.match(help, /ticketReplyPendingRef\.current\.has\(ticketId\)/);
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
