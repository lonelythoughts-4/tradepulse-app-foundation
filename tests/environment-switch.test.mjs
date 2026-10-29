import assert from "node:assert/strict";
import test from "node:test";

import {
  shouldApplyEnvironmentProjection,
  shouldClearEnvironmentProjection,
} from "../lib/environment-switch.js";

test("a late dashboard response from the previous workspace is ignored", () => {
  assert.equal(shouldApplyEnvironmentProjection("mainnet", "testnet"), false);
});

test("the currently selected workspace may update its own dashboard", () => {
  assert.equal(shouldApplyEnvironmentProjection("testnet", "testnet"), true);
});

test("clears the old projection before moving to another environment", () => {
  assert.equal(shouldClearEnvironmentProjection("mainnet", "testnet"), true);
  assert.equal(shouldClearEnvironmentProjection("testnet", "testnet"), false);
});
