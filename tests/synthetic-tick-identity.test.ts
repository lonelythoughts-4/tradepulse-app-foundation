import assert from "node:assert/strict";
import test from "node:test";

import { makeSyntheticCandles, reconcileSyntheticTicks } from "../lib/synthetic-ticks.ts";

test("retains same-timestamp ticks when their market and sequence differ", () => {
  const ticks = reconcileSyntheticTicks([
    { market: "SYN-25", sequence: 11, price: 101, timestamp: 1000 },
    { market: "SYN-25", sequence: 12, price: 102, timestamp: 1000 },
  ]);

  assert.deepEqual(ticks.map((tick) => tick.sequence), [11, 12]);
});

test("collapses replayed sequences, orders out-of-order arrivals, and isolates markets", () => {
  const ticks = reconcileSyntheticTicks([
    { market: "SYN-25", sequence: 3, price: 103, timestamp: 3000 },
    { market: "SYN-25", sequence: 2, price: 102, timestamp: 2000 },
    { market: "SYN-50", sequence: 2, price: 202, timestamp: 2000 },
    { market: "SYN-25", sequence: 2, price: 999, timestamp: 2000 },
  ], "SYN-25");

  assert.deepEqual(ticks.map((tick) => [tick.market, tick.sequence, tick.price]), [
    ["SYN-25", 2, 102],
    ["SYN-25", 3, 103],
  ]);
});

test("flags a missing sequence for resynchronization without dropping valid ticks", () => {
  const result = reconcileSyntheticTicks([
    { market: "SYN-75", sequence: 20, price: 120, timestamp: 1000 },
    { market: "SYN-75", sequence: 22, price: 122, timestamp: 1000 },
  ], "SYN-75", { withStatus: true });

  assert.equal(result.requiresResync, true);
  assert.deepEqual(result.ticks.map((tick) => tick.sequence), [20, 22]);
});

test("builds OHLC in sequence order even when same-second samples overlap", () => {
  const candles = makeSyntheticCandles([
    { market: "SYN-10", sequence: 3, price: 99, timestamp: 1000 },
    { market: "SYN-10", sequence: 1, price: 100, timestamp: 1000 },
    { market: "SYN-10", sequence: 2, price: 105, timestamp: 1000 },
  ]);

  assert.deepEqual(candles, [{ open: 100, high: 105, low: 99, close: 99, timestamp: 1000 }]);
});
