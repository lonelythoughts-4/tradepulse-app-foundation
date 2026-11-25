import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [workspace, translations] = await Promise.all([
  readFile(new URL("../components/workspaces/bots-workspace.tsx", import.meta.url), "utf8"),
  readFile(new URL("../lib/desk-i18n.ts", import.meta.url), "utf8"),
]);

test("product top-ups use and cannot exceed the available wallet balance", () => {
  assert.match(workspace, /FROM AVAILABLE BALANCE/);
  assert.match(workspace, /<strong>\{money\(availableBalance\)\}<\/strong>/);
  assert.match(workspace, /topUpAmount >= 20 && topUpAmount <= availableBalance/);
  assert.match(workspace, /disabled=\{!canTopUp \|\| isActionPending\(`bot:\$\{selected\.id\}:topup`\)\}/);
  assert.match(workspace, /action: "topup"/);
  assert.match(translations, /"FROM AVAILABLE BALANCE": \[/);
});
