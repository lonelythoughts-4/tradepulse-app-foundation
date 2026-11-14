import assert from "node:assert/strict";
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
    title: "Memecoin trade profit",
    summary: "WIF · LONG · Take profit",
    status: "Settled",
  });
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
