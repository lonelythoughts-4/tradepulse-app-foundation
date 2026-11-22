import assert from "node:assert/strict";
import test from "node:test";

import { syntheticQuoteStatus } from "../lib/synthetic-quote-status.ts";

const now = 10_000;

test("labels a quote live only when its tick is fresh", () => {
  assert.equal(syntheticQuoteStatus({
    error: false,
    market: "SYN-25",
    now,
    quote: {
      market: "SYN-25",
      latest: { timestamp: 9_999 },
      received_at: 9_900,
      server_updated_at: 10_000,
    },
  }), "live");
});

test("distinguishes a recently received but stale quote from a connection wait", () => {
  assert.equal(syntheticQuoteStatus({
    error: false,
    market: "SYN-25",
    now,
    quote: {
      market: "SYN-25",
      latest: { timestamp: 1_000 },
      received_at: 9_900,
      server_updated_at: 10_000,
    },
  }), "delayed");
});

test("reports reconnection and ignores an old quote response", () => {
  const quote = {
    market: "SYN-25",
    latest: { timestamp: 9_999 },
    received_at: 9_900,
    server_updated_at: 10_000,
  };
  assert.equal(syntheticQuoteStatus({ error: true, market: "SYN-25", now, quote }), "reconnecting");
  assert.equal(syntheticQuoteStatus({
    error: false,
    market: "SYN-25",
    now: 20_000,
    quote,
  }), "connecting");
});
