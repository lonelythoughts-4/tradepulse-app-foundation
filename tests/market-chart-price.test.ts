import assert from "node:assert/strict";
import test from "node:test";
import { formatMarketPrice, makeMarketCandles } from "../lib/market-chart-series.ts";

test("market prices retain enough decimals to display micro-priced assets", () => {
  assert.equal(formatMarketPrice(0.0000000123), "0.0000000123");
  assert.equal(formatMarketPrice(0.123456), "0.123456");
  assert.equal(formatMarketPrice(1234.56), "1234.56");
});

test("market chart points without synthetic market IDs still produce candles", () => {
  const candles = makeMarketCandles([
    { timestamp: 120, price: 0.0000012 },
    { timestamp: 180, price: 0.0000017 },
    { timestamp: 240, price: 0.0000011 },
  ]);

  assert.notEqual(candles.length, 0);
  assert.equal(candles[0].open, 0.0000012);
  assert.equal(candles.at(-1)?.close, 0.0000011);
  assert.equal(Math.max(...candles.map((candle) => candle.high)), 0.0000017);
});
