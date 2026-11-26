import assert from "node:assert/strict";
import test from "node:test";
import { formatMarketPrice, makeMarketCandles, shouldShowMarketCloseTrace } from "../lib/market-chart-series.ts";

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

test("market charts add a close trace when most candle bodies render below one pixel", () => {
  const candles = Array.from({ length: 6 }, (_, index) => ({
    open: 100 + index * 0.01,
    close: 100.005 + index * 0.01,
    high: 100.02 + index * 0.01,
    low: 99.99 + index * 0.01,
  }));
  assert.equal(shouldShowMarketCloseTrace(candles, 10, 184), true);
  assert.equal(shouldShowMarketCloseTrace(candles, 0, 184), false);
});

test("market charts keep clearly visible candle bodies without a close trace", () => {
  const candles = Array.from({ length: 6 }, (_, index) => ({
    open: 100 + index * 0.01,
    close: 100.5 + index * 0.01,
    high: 100.6 + index * 0.01,
    low: 99.9 + index * 0.01,
  }));
  assert.equal(shouldShowMarketCloseTrace(candles, 10, 184), false);
});
