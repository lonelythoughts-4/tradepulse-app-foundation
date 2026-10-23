import assert from "node:assert/strict";
import test from "node:test";

import { clampLossCap, contractReasonLabel, contractTypeLabel, manualContractPreferences, validateOpenEndedTerms } from "../lib/synthetic-contract-terms.ts";

test("Manual defaults to the API's fixed-duration contract and sends no open-ended risk fields", () => {
  assert.deepEqual(manualContractPreferences("fixed", 50, 20), { contract_type: "fixed_duration" });
  assert.equal(contractTypeLabel(undefined), "Fixed duration");
});

test("open-ended Manual terms preserve valid caps and only retain a tighter stop", () => {
  assert.deepEqual(manualContractPreferences("open_ended", 50, 20), {
    contract_type: "open_ended", maximum_loss_percent: 50, manual_stop_loss_percent: 20,
  });
  assert.deepEqual(manualContractPreferences("open_ended", 15, 30), {
    contract_type: "open_ended", maximum_loss_percent: 15,
  });
  assert.equal(clampLossCap(2), 5);
  assert.equal(contractTypeLabel("open_ended"), "Open-ended");
});

test("invalid typed open-ended terms are explicit validation errors and are never clamped into a request", () => {
  assert.deepEqual(validateOpenEndedTerms(4.9, ""), { valid: false, error: "Maximum loss cap must be between 5% and 50%." });
  assert.deepEqual(validateOpenEndedTerms(50.1, ""), { valid: false, error: "Maximum loss cap must be between 5% and 50%." });
  assert.deepEqual(validateOpenEndedTerms(5, ""), { valid: true, maximumLossPercent: 5 });
  assert.throws(() => manualContractPreferences("open_ended", 80, 20), /Maximum loss cap must be between 5% and 50%/);
});

test("server contract reasons have a customer-readable fallback", () => {
  assert.equal(contractReasonLabel(""), "Confirmed at execution");
  assert.equal(contractReasonLabel("Manual terms confirmed"), "Manual terms confirmed");
});
