import assert from "node:assert/strict";
import test from "node:test";

import { shouldApplyEnvironmentProjection } from "../lib/environment-switch.js";

test("a late dashboard response from the previous workspace is ignored", () => {
  assert.equal(shouldApplyEnvironmentProjection("mainnet", "testnet"), false);
});

test("the currently selected workspace may update its own dashboard", () => {
  assert.equal(shouldApplyEnvironmentProjection("testnet", "testnet"), true);
});
