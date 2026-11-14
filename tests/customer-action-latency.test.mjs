import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const help = fs.readFileSync(path.join(root, "components", "workspaces", "help-workspace.tsx"), "utf8");
const desk = fs.readFileSync(path.join(root, "components", "workspaces", "desk-workspace.tsx"), "utf8");

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
