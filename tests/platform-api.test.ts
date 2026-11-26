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
    assert.ok(forwardedSignal instanceof AbortSignal);
    assert.equal(forwardedSignal?.aborted, false);
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

test("forwards the platform logout cookie deletion to the browser", async () => {
  const previousOrigin = process.env.TRADEPULSE_API_ORIGIN;
  const previousFetch = globalThis.fetch;
  const clearCookie = "tradepulse_browser_session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax";
  process.env.TRADEPULSE_API_ORIGIN = "https://api.example.test";
  globalThis.fetch = async () => new Response(JSON.stringify({ ok: true }), {
    headers: {
      "content-type": "application/json",
      "set-cookie": clearCookie,
    },
  });

  try {
    const request = new NextRequest("https://web.example.test/api/v1/auth/logout", {
      method: "POST",
    });
    const response = await proxyPlatformRequest(request, "/v1/auth/logout");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("set-cookie"), clearCookie);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousOrigin === undefined) {
      delete process.env.TRADEPULSE_API_ORIGIN;
    } else {
      process.env.TRADEPULSE_API_ORIGIN = previousOrigin;
    }
  }
});

test("allows admin sweep requests to wait within the Vercel route limit", async () => {
  const previousOrigin = process.env.TRADEPULSE_API_ORIGIN;
  const previousFetch = globalThis.fetch;
  const previousTimeout = AbortSignal.timeout;
  let timeoutMs: number | undefined;
  process.env.TRADEPULSE_API_ORIGIN = "https://api.example.test";
  AbortSignal.timeout = (milliseconds: number) => {
    timeoutMs = milliseconds;
    return previousTimeout.call(AbortSignal, milliseconds);
  };
  globalThis.fetch = async () => new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });

  try {
    const request = new NextRequest("https://web.example.test/api/v1/admin/sweeps/intent-123", {
      method: "POST",
      body: JSON.stringify({ action: "retry" }),
    });
    const response = await proxyPlatformRequest(request, "/v1/admin/sweeps/intent-123");
    assert.equal(response.status, 200);
    assert.equal(timeoutMs, 55_000);
  } finally {
    AbortSignal.timeout = previousTimeout;
    globalThis.fetch = previousFetch;
    if (previousOrigin === undefined) {
      delete process.env.TRADEPULSE_API_ORIGIN;
    } else {
      process.env.TRADEPULSE_API_ORIGIN = previousOrigin;
    }
  }
});

test("forwards a Mini App session cookie from an ordinary platform response", async () => {
  const previousOrigin = process.env.TRADEPULSE_API_ORIGIN;
  const previousFetch = globalThis.fetch;
  const sessionCookie = "tradepulse_browser_session=signed-session; Max-Age=2592000; Path=/; HttpOnly; Secure; SameSite=Lax";
  process.env.TRADEPULSE_API_ORIGIN = "https://api.example.test";
  globalThis.fetch = async () => new Response(JSON.stringify({ user: { id: 42 } }), {
    headers: {
      "content-type": "application/json",
      "set-cookie": sessionCookie,
    },
  });

  try {
    const request = new NextRequest("https://web.example.test/api/v1/dashboard");
    const response = await proxyPlatformRequest(request, "/v1/dashboard");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("set-cookie"), sessionCookie);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousOrigin === undefined) {
      delete process.env.TRADEPULSE_API_ORIGIN;
    } else {
      process.env.TRADEPULSE_API_ORIGIN = previousOrigin;
    }
  }
});

test("forwards auth and non-authorizing cache-scope cookies separately", async () => {
  const previousOrigin = process.env.TRADEPULSE_API_ORIGIN;
  const previousFetch = globalThis.fetch;
  const sessionCookie = "tradepulse_browser_session=signed-session; Max-Age=2592000; Path=/; HttpOnly; Secure; SameSite=Lax";
  const scopeCookie = "tradepulse_session_cache_scope=opaque-scope; Max-Age=2592000; Path=/; Secure; SameSite=Lax";
  process.env.TRADEPULSE_API_ORIGIN = "https://api.example.test";
  globalThis.fetch = async () => {
    const headers = new Headers({ "content-type": "application/json" });
    headers.append("set-cookie", sessionCookie);
    headers.append("set-cookie", scopeCookie);
    return new Response(JSON.stringify({ user: { id: 42 } }), { headers });
  };

  try {
    const request = new NextRequest("https://web.example.test/api/v1/dashboard");
    const response = await proxyPlatformRequest(request, "/v1/dashboard");
    const responseHeaders = response.headers as Headers & { getSetCookie?: () => string[] };
    const cookies = typeof responseHeaders.getSetCookie === "function"
      ? responseHeaders.getSetCookie()
      : (response.headers.get("set-cookie") || "").split(/,\s*(?=[^;,]+=)/);
    assert.deepEqual(cookies, [sessionCookie, scopeCookie]);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousOrigin === undefined) {
      delete process.env.TRADEPULSE_API_ORIGIN;
    } else {
      process.env.TRADEPULSE_API_ORIGIN = previousOrigin;
    }
  }
});
