import assert from "node:assert/strict";
import test from "node:test";

import { fundingFeedback } from "../lib/admin-funding-feedback.ts";

test("keeps a successful funding action visibly confirmed until its form changes", () => {
  assert.deepEqual(fundingFeedback(false, false), {
    buttonLabel: "Fund user",
    status: "Funding will be recorded in the selected admin workspace.",
  });
  assert.deepEqual(fundingFeedback(false, "applied"), {
    buttonLabel: "Funding recorded",
    status: "Funding applied. Change a funding field before sending another credit.",
  });
});

test("keeps the exact funding control in a pending state without changing its success message", () => {
  assert.deepEqual(fundingFeedback(true, "applied"), {
    buttonLabel: "Funding…",
    status: "Funding applied. Change a funding field before sending another credit.",
  });
});

test("identifies an idempotent repeat without inviting another credit", () => {
  assert.deepEqual(fundingFeedback(false, "already-recorded"), {
    buttonLabel: "Already recorded",
    status: "An equivalent funding action was already recorded. Change a funding field before sending another credit.",
  });
});
