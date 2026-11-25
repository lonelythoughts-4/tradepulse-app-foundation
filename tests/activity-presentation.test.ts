import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { describeActivity } from "../lib/activity-presentation.ts";

test("describes a settled market outcome with the actual market and exit", () => {
  const activity = describeActivity({
    kind: "trading_profit",
    status: "settled",
    asset: "USD",
    trade_detail: {
      bot_name: "Memecoin",
      position: { symbol: "WIF", direction: "long", close_reason: "take_profit" },
    },
  });

  assert.deepEqual(activity, {
    title: "WIF",
    summary: "Take profit",
    status: "Settled",
  });
});

test("normalizes legacy game exits from the signed customer P&L", () => {
  const profit = describeActivity({
    kind: "trading_profit",
    status: "settled",
    trade_detail: {
      bot_name: "Memecoin",
      position: { symbol: "WIF", direction: "long", close_reason: "game_scheduled", realized_pnl: 8.54 },
    },
  });
  const loss = describeActivity({
    kind: "trading_loss",
    status: "settled",
    trade_detail: {
      bot_name: "Memecoin",
      position: { symbol: "WIF", direction: "long", close_reason: "auto_daily_loss_limit", realized_pnl: -1.02 },
    },
  });

  assert.equal(profit.title, "WIF");
  assert.equal(profit.summary, "Take profit");
  assert.equal(loss.title, "WIF");
  assert.equal(loss.summary, "Stop loss");
});

test("keeps other activity exit labels humanized", () => {
  const activity = describeActivity({
    kind: "trading_loss",
    status: "settled",
    trade_detail: {
      bot_name: "Synthetic",
      position: { symbol: "SYN-25", close_reason: "liquidation", realized_pnl: -1 },
    },
  });

  assert.equal(activity.title, "SYN-25");
  assert.equal(activity.summary, "Liquidation");
});

test("describes Synthetic activity with its market and settlement outcome", () => {
  const activity = describeActivity({
    kind: "synthetic_settlement",
    status: "settled",
    trade_detail: {
      bot_name: "Synthetic",
      position: { symbol: "SYN-25", direction: "long", close_reason: "game_scheduled", user_net_pnl_usd: 8.54 },
    },
  });

  assert.equal(activity.title, "SYN-25");
  assert.equal(activity.summary, "Take profit");
});

test("describes a withdrawal hold with its customer consequence", () => {
  const activity = describeActivity({
    kind: "withdraw",
    status: "reserved",
    asset: "USDC",
    chain: "BASE",
  });

  assert.deepEqual(activity, {
    title: "Withdrawal reserved",
    summary: "USDC on Base · held from your available balance until release",
    status: "Reserved",
  });
});

test("describes a protection credit without generic account wording", () => {
  const activity = describeActivity({
    kind: "strategy_protection_credit",
    status: "credited",
    asset: "USD",
  });

  assert.deepEqual(activity, {
    title: "Strategy Protection credited",
    summary: "Protection credit added to your available wallet balance",
    status: "Credited",
  });
});

test("describes a simulated testnet deposit as a testnet event", () => {
  const activity = describeActivity({
    kind: "autouser_simulated_deposit",
    status: "simulated_settled",
    asset: "USD",
  });

  assert.deepEqual(activity, {
    title: "Testnet deposit credited",
    summary: "Test funds added to your separate testnet balance",
    status: "Simulated",
  });
});

test("activity views display the API's canonical signed amount without inferring direction", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );
  const wallet = await readFile(
    new URL("../components/workspaces/wallet-workspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(shell, /const amount = entry\.amount_usd;/);
  assert.match(wallet, /const amount = entry\.amount_usd;/);
  assert.doesNotMatch(
    `${shell}\n${wallet}`,
    /signedActivityAmount|Math\.abs\(Number\(amount/,
  );
  assert.match(wallet, /data\.ledger\.length \? \(/);
  assert.match(wallet, /\[\.\.\.data\.ledger\]\s*\.sort\(/);
  assert.doesNotMatch(wallet, /\[\.\.\.data\.engine,\s*\.\.\.data\.ledger\]/);
  assert.doesNotMatch(wallet, /data\.engine\.map\(\(entry\) => \(\{/);
});

test("activity detail titles retain the market-specific presentation", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );
  const dialogStart = shell.indexOf("export function ActivityDetailDialog");
  const dialogEnd = shell.indexOf("\nfunction ", dialogStart + 1);
  const dialog = shell.slice(dialogStart, dialogEnd);

  assert.match(dialog, /<h2>\{describeActivity\(entry\)\.title\}<\/h2>/);
  assert.doesNotMatch(dialog, /activityLabel\(entry\.kind/);
});

test("keeps Memecoin P&L in its bot workspace instead of the dashboard", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );
  const bots = await readFile(
    new URL("../components/workspaces/bots-workspace.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(shell, /ProductPnlSummary product="Memecoin"/);
  assert.match(
    bots,
    /ProductPnlSummary product="Memecoin" summary=\{data\.memecoin\?\.pnl_summary\}/,
  );
});

test("withdrawal failures show the safe API reason when one is available", async () => {
  const wallet = await readFile(
    new URL("../components/workspaces/wallet-workspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(wallet, /error instanceof DeskApiError \? error\.responseMessage\.trim\(\) : ""/);
  assert.match(wallet, /responseMessage\s*\?\s*t\(responseMessage\)/);
});
