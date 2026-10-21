import assert from "node:assert/strict";
import test from "node:test";
import { formatSettlementExitReason } from "../lib/settlement-label.ts";

test("formats a settled bot exit reason without relying on shell-local helpers", () => {
  assert.equal(formatSettlementExitReason("user_close"), "user close");
  assert.equal(formatSettlementExitReason(), "Recorded settlement");
});
