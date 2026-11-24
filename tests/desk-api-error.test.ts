import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { DeskApi, DeskApiError } from "../lib/desk-api.ts";

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

test("the language rollback preserves locale without exposing API error copy", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );

  assert.match(shell, /throw new DeskApiError\("", response\.status, reference, responseMessage, responseBody\)/);
  assert.match(shell, /setNotice\(""\);\s*throw error;/);
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
