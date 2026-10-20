import assert from "node:assert/strict";
import test from "node:test";

import { createActionScope } from "../lib/action-scope.ts";

test("keeps a support reply usable while a different ticket opens", () => {
  const scope = createActionScope();
  scope.begin("support:ticket-2:open");

  assert.equal(scope.pending("support:ticket-1:reply"), false);
});

test("keeps a wallet form usable while a bot action is pending", () => {
  const scope = createActionScope();
  scope.begin("bot:42:pause");

  assert.equal(scope.pending("wallet:withdrawal:submit"), false);
});

test("shows an action error only in the originating flow", () => {
  const scope = createActionScope();
  scope.fail("support:ticket-2:open", new Error("Ticket is unavailable."));

  assert.equal(scope.error("support:ticket-2:open"), "Ticket is unavailable.");
  assert.equal(scope.error("wallet:withdrawal:submit"), undefined);
});
