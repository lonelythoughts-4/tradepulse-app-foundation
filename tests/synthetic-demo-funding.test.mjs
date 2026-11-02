import assert from "node:assert/strict";
import test from "node:test";

import {
  syntheticFundingCapacity,
  syntheticFundingNeedsDisclosure,
} from "../lib/synthetic-demo-funding.js";

const snapshot = {
  allocation: { available_usd: 500, manual_available_usd: 350 },
  demo: { available_usd: 1_250, credit_available_usd: 45 },
};

test("the virtual demo is usable without the live wallet-risk acknowledgement", () => {
  assert.equal(syntheticFundingNeedsDisclosure("demo"), false);
  assert.equal(syntheticFundingNeedsDisclosure("wallet"), true);
  assert.equal(syntheticFundingNeedsDisclosure("credit"), true);
});

test("the selected Synthetic source displays and validates its own capacity", () => {
  assert.equal(syntheticFundingCapacity("wallet", snapshot), 350);
  assert.equal(syntheticFundingCapacity("demo", snapshot), 1_250);
  assert.equal(syntheticFundingCapacity("credit", snapshot), 45);
});
