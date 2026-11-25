import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [workspace, translations, dashboardApi] = await Promise.all([
  readFile(new URL("../components/workspaces/bots-workspace.tsx", import.meta.url), "utf8"),
  readFile(new URL("../lib/desk-i18n.ts", import.meta.url), "utf8"),
  readFile(new URL("../../web_api.py", import.meta.url), "utf8"),
]);

test("product top-ups report minimum, available-balance, and success outcomes in a modal", () => {
  assert.match(workspace, /FROM AVAILABLE BALANCE/);
  assert.match(workspace, /<strong>\{money\(availableBalance\)\}<\/strong>/);
  assert.match(workspace, /Number\(data\.min_bot_investment_usd\)/);
  assert.match(workspace, /topUpAmount < minimumTopUp/);
  assert.match(workspace, /topUpAmount > availableBalance/);
  assert.match(workspace, /disabled=\{isActionPending\(`bot:\$\{selected\.id\}:topup`\)\}/);
  assert.match(workspace, /action: "topup"/);
  assert.match(workspace, /className="account-modal topup-feedback-modal"/);
  assert.match(workspace, /Minimum top-up: \{money\(topUpFeedback\.minimum\)\}/);
  assert.match(workspace, /Available balance: \{money\(topUpFeedback\.available\)\}\. Reduce the amount and try again\./);
  assert.match(workspace, /Added \{money\(topUpFeedback\.amount\)\} to \{topUpFeedback\.botName\}\./);
  assert.match(dashboardApi, /"min_bot_investment_usd": float\(configured\("min_bot_investment_usd"\)\)/);
  assert.match(translations, /"FROM AVAILABLE BALANCE": \[/);
});
