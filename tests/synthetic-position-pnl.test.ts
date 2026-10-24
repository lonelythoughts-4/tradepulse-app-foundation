import assert from "node:assert/strict";
import test from "node:test";

import { liveNetPnlLabel } from "../lib/synthetic-position-pnl.ts";

test("open position labels show a signed net result after entry costs", () => {
  assert.equal(liveNetPnlLabel(0.102), "LIVE NET P/L +$0.10");
  assert.equal(liveNetPnlLabel(-0.058), "LIVE NET P/L −$0.06");
  assert.equal(liveNetPnlLabel(0), "LIVE NET P/L $0.00");
});
