import assert from "node:assert/strict";
import test from "node:test";
import { formatSettlementExitReason } from "../lib/settlement-label.ts";

test("formats a settled bot exit reason without relying on shell-local helpers", () => {
  assert.equal(formatSettlementExitReason("user_close"), "User close");
  assert.equal(formatSettlementExitReason("fixed_expiry"), "Fixed expiry");
  assert.equal(formatSettlementExitReason("contract_expiry"), "Fixed expiry");
  assert.equal(formatSettlementExitReason("game_scheduled", 8.54), "Take profit");
  assert.equal(formatSettlementExitReason("auto_daily_loss_limit", 8.54), "Take profit");
  assert.equal(formatSettlementExitReason("game_scheduled", -2.0), "Stop loss");
  assert.equal(formatSettlementExitReason("auto_daily_goal", -2.0), "Stop loss");
  assert.equal(formatSettlementExitReason("game_scheduled"), "Stop loss");
  assert.equal(formatSettlementExitReason(), "Recorded settlement");
});
