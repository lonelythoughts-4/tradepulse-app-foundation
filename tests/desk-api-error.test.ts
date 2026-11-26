import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  DASHBOARD_MAX_TRANSIENT_RETRIES,
  DASHBOARD_REQUEST_TIMEOUT_MS,
  DeskApi,
  DeskApiError,
  isRetryableDashboardReadError,
  logDeskFailure,
  shouldRetryDashboardRead,
} from "../lib/desk-api.ts";

test("dashboard retry classification excludes authorization and permanent server failures", () => {
  const timeout = new Error("");
  timeout.name = "TimeoutError";
  const network = new Error("");
  network.name = "NetworkError";

  assert.equal(isRetryableDashboardReadError(new DeskApiError("", 503)), true);
  assert.equal(isRetryableDashboardReadError(timeout), true);
  assert.equal(isRetryableDashboardReadError(network), true);
  assert.equal(isRetryableDashboardReadError(new DeskApiError("", 401)), false);
  assert.equal(isRetryableDashboardReadError(new DeskApiError("", 500)), false);
});

test("dashboard startup retries are bounded and requests fail promptly", () => {
  const timeout = new Error("");
  timeout.name = "TimeoutError";

  assert.equal(DASHBOARD_REQUEST_TIMEOUT_MS, 8_000);
  assert.equal(DASHBOARD_MAX_TRANSIENT_RETRIES, 1);
  assert.equal(shouldRetryDashboardRead(timeout, 0), true);
  assert.equal(shouldRetryDashboardRead(timeout, 1), false);
  assert.equal(shouldRetryDashboardRead(new DeskApiError("", 401), 0), false);
});

test("API errors retain diagnostics without exposing customer-facing error copy", async () => {
  const error = new DeskApiError(
    "The request failed.",
    500,
    "request-17",
    "The service could not save this preference.",
  );

  assert.equal(error.message, "");
  assert.equal(error.responseMessage, "The service could not save this preference.");
  assert.equal(error.reference, "request-17");
});

test("DeskApi attaches a server request reference to API errors", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    error: "The service failed.",
    request_id: "request-42",
  }), {
    status: 500,
    headers: { "content-type": "application/json" },
  });

  try {
    await assert.rejects(
      new DeskApi().mutate("/v1/account/language"),
      (error: unknown) => {
        assert.ok(error instanceof DeskApiError);
        assert.equal(error.status, 500);
        assert.equal(error.reference, "request-42");
        assert.equal(error.responseMessage, "The service failed.");
        assert.deepEqual(error.responseBody, {
          error: "The service failed.",
          request_id: "request-42",
        });
        assert.equal(error.message, "");
        return true;
      },
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("DeskApi hides transport error details from callers", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError("fetch failed: internal endpoint details");
  };

  try {
    await assert.rejects(
      new DeskApi().getResource("/v1/dashboard"),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, "");
        return true;
      },
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("DeskApi rejects malformed JSON without a success-shaped fallback", async () => {
  const previousFetch = globalThis.fetch;
  const previousError = console.error;
  globalThis.fetch = async () => new Response("{", {
    status: 200,
    headers: { "content-type": "application/json" },
  });
  console.error = () => undefined;

  try {
    await assert.rejects(
      new DeskApi().getResource("/v1/dashboard"),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal(error.message, "");
        return true;
      },
    );
  } finally {
    globalThis.fetch = previousFetch;
    console.error = previousError;
  }
});

test("operation diagnostics omit error text and retain a safe reference", () => {
  const previousError = console.error;
  const logged: unknown[][] = [];
  console.error = (...args: unknown[]) => logged.push(args);

  try {
    logDeskFailure(
      "wallet.withdrawal",
      new DeskApiError("private detail", 503, "request-21", "private response"),
    );
  } finally {
    console.error = previousError;
  }

  assert.deepEqual(logged, [[
    "TradeMemo operation failed",
    {
      operation: "wallet.withdrawal",
      status: 503,
      reference: "request-21",
      errorType: "DeskApiError",
    },
  ]]);
});

test("the language rollback preserves locale without exposing API error copy", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );

  assert.match(shell, /throw new DeskApiError\("", response\.status, reference, responseMessage, responseBody\)/);
  assert.match(shell, /setNotice\(""\);\s*throw error;/);
});

test("dashboard retries are bounded, expose manual recovery, and preserve the 401 handoff", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );
  const loading = await readFile(
    new URL("../components/desk-loading.tsx", import.meta.url),
    "utf8",
  );

  assert.match(shell, /if \(response\.status === 401\) \{/);
  assert.match(shell, /path === "\/v1\/dashboard" \|\| path === "\/v1\/auth\/miniapp\/verify"/);
  assert.match(shell, /setSessionHandoffRequired\(true\)/);
  assert.match(shell, /if \(!shouldRetryDashboardRead\(error, retryCount\)\) throw error;/);
  assert.match(shell, /DASHBOARD_REQUEST_TIMEOUT_MS/);
  assert.match(shell, /onRetry=\{notice \? \(\) => \{ void load\(\); \} : undefined\}/);
  assert.match(shell, /request\(\s*"\/v1\/auth\/miniapp\/verify"[\s\S]*?snapshot\.user\.id === verifiedUserId/);
  assert.match(loading, /Retry connection/);
});

test("saved browser dashboards hydrate before background auth and never bypass Telegram proof", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );
  const cacheHydration = shell.indexOf("const snapshot = readDashboardSnapshot(window.localStorage, scope)");
  const dashboardLoad = shell.indexOf('request("/v1/dashboard", {}, targetEnvironment, DASHBOARD_REQUEST_TIMEOUT_MS)');

  assert.ok(cacheHydration >= 0);
  assert.ok(dashboardLoad > cacheHydration);
  assert.match(shell, /openedInsideTelegram\(\)\s*\|\|\s*\/Telegram\/i\.test\(userAgent\)\s*\|\|\s*hasTelegramWebAppLaunchParams/);
  assert.match(shell, /updateDashboard\(cachedDashboard\);\s*setLoading\(false\);\s*setSessionBootstrapComplete\(true\)/);
  assert.match(shell, /if \(next && verifiedDashboardRef\.current\) persistDashboardSnapshot\(next\)/);
  assert.match(shell, /if \(response\.status === 401\) \{[\s\S]*?updateDashboard\(null\);[\s\S]*?setSessionHandoffRequired\(true\)/);
  assert.match(shell, /optimisticSnapshotHydratedRef\.current = true;\s*activeDashboardSnapshotScopeRef\.current = scope/);
  assert.match(shell, /const checkingSession = !data && !optimisticSnapshotHydratedRef\.current/);
});

test("withdrawal errors use the safe server message when available", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );

  assert.match(shell, /error instanceof DeskApiError \? error\.responseMessage\.trim\(\) : ""/);
});

test("activation language rollback does not expose API error copy", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    shell,
    /onLanguageChange\(next\)\.catch\(\(\) => \{\s*setLanguage\(previousLanguage\);\s*setLanguageError\(""\);\s*onNotice\(""\);/s,
  );
});
