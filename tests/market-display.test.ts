import assert from "node:assert/strict";
import test from "node:test";

import { memecoinMarketDisplayName } from "../lib/market-display.ts";

test("unknown market identifiers use the neutral product label", () => {
  assert.equal(memecoinMarketDisplayName(undefined, undefined), "Memecoin market");
  assert.equal(memecoinMarketDisplayName("unlisted-market-id", {}), "Memecoin market");
});

test("market catalogue labels resolve case-insensitively", () => {
  assert.equal(
    memecoinMarketDisplayName("KNOWN-MARKET", { "known-market": "Known market" }),
    "Known market",
  );
});
