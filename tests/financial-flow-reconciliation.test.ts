import assert from "node:assert/strict";
import test from "node:test";

import {
  flashbackSettlementPresentation,
  reconcileCreatedBot,
} from "../lib/financial-flow-reconciliation.ts";

test("bot creation preserves the selected compounding value and reconciles returned wallet state", () => {
  const result = reconcileCreatedBot(
    {
      wallet: { available: 100, equity: 100 },
      bots: [{ id: "bot-1", compound_percent: 0, capital_usd: 20 }],
    },
    { id: "bot-2", compound_percent: 50, capital_usd: 40 },
    { available: 60 },
  );

  assert.deepEqual(result.wallet, { available: 60, equity: 100 });
  assert.deepEqual(result.bots, [
    { id: "bot-1", compound_percent: 0, capital_usd: 20 },
    { id: "bot-2", compound_percent: 50, capital_usd: 40 },
  ]);
});

test("a repeated bot-create result replaces the existing bot instead of duplicating capital", () => {
  const result = reconcileCreatedBot(
    { wallet: { available: 60 }, bots: [{ id: "bot-2", compound_percent: 0, capital_usd: 40 }] },
    { id: "bot-2", compound_percent: 100, capital_usd: 40 },
  );

  assert.deepEqual(result.bots, [{ id: "bot-2", compound_percent: 100, capital_usd: 40 }]);
});

test("an entropy outage is presented as a returned Flashback entry, not a gain or loss", () => {
  assert.deepEqual(
    flashbackSettlementPresentation({ product_version: "sealed-return-v2", close_reason: "entropy_unavailable_refund" }),
    {
      isEntropyRefund: true,
      outcome: "ENTRY RETURNED",
      settlement: "ENTRY RETURNED",
      explanation: "The external entropy source did not respond during the resolution window. Your full entry was returned and no random return was selected.",
    },
  );
});
