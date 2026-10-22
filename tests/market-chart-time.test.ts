import assert from "node:assert/strict";
import test from "node:test";

import { formatMarketChartTime } from "../lib/market-chart-time.ts";

test("formats intraday chart labels with seconds", () => {
  assert.equal(
    formatMarketChartTime(Date.UTC(2026, 9, 22, 14, 5, 9), 0, 2, Date.UTC(2026, 9, 22, 14, 0, 0), Date.UTC(2026, 9, 22, 14, 5, 9)),
    "14:05:09",
  );
});

test("keeps the existing date label for a multi-day chart", () => {
  assert.equal(
    formatMarketChartTime(Date.UTC(2026, 9, 22, 14, 5, 9), 0, 2, Date.UTC(2026, 9, 20, 14, 0, 0), Date.UTC(2026, 9, 22, 14, 5, 9)),
    "Oct 22",
  );
});
