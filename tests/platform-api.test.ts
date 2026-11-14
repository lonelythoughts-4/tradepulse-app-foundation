import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server.js";

import { proxyPlatformRequest } from "../lib/platform-api.ts";

test("forwards browser cancellation to the platform API request", async () => {
  const previousOrigin = process.env.TRADEPULSE_API_ORIGIN;
  const previousFetch = globalThis.fetch;
  let forwardedSignal: AbortSignal | null | undefined;
  let forwardedHeaders: Headers | undefined;
  process.env.TRADEPULSE_API_ORIGIN = "https://api.example.test/base";
  globalThis.fetch = async (_input, init) => {
    forwardedSignal = init?.signal;
    forwardedHeaders = new Headers(init?.headers);
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { "content-type": "application/json" },
    });
  };

  try {
    const request = new NextRequest("https://web.example.test/api/v1/dashboard", {
      headers: { "Idempotency-Key": "withdrawal:stable-retry-key" },
    });
    const response = await proxyPlatformRequest(request, "/v1/dashboard");
    assert.equal(response.status, 200);
    assert.equal(forwardedSignal, request.signal);
    assert.equal(forwardedHeaders?.get("idempotency-key"), "withdrawal:stable-retry-key");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousOrigin === undefined) {
      delete process.env.TRADEPULSE_API_ORIGIN;
    } else {
      process.env.TRADEPULSE_API_ORIGIN = previousOrigin;
    }
  }
});
