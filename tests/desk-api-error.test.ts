import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { DeskApi, DeskApiError } from "../lib/desk-api.ts";
import { localizeApiError } from "../lib/desk-i18n.ts";

test("language-save errors retain status and request reference for rollback locale", async () => {
  const error = new DeskApiError(
    "The request failed.",
    500,
    "request-17",
    "The service could not save this preference.",
  );

  assert.equal(
    localizeApiError("en", error.responseMessage, error.status, error.reference),
    "The service could not save this preference. Reference: request-17",
  );
  assert.equal(
    localizeApiError("es", error.responseMessage, error.status, error.reference),
    localizeApiError("es", "The service could not save this preference.", 500, "request-17"),
  );
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
        return true;
      },
    );
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("the language rollback notice uses the saved locale and actual API error", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );

  assert.match(shell, /throw new DeskApiError\(message, response\.status, reference, responseMessage, responseBody\)/);
  assert.match(
    shell,
    /localizeApiError\(\s*persistedLanguageRef\.current,\s*error\.responseMessage,\s*error\.status,\s*error\.reference/s,
  );
  assert.doesNotMatch(shell, /setNotice\(localizeApiError\(persistedLanguageRef\.current, "", 500\)\)/);
});

test("activation language rollback preserves the API failure in the previous locale", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    shell,
    /onLanguageChange\(next\)\.catch\(\(error\) => \{\s*setLanguage\(previousLanguage\);\s*const message = error instanceof DeskApiError\s*\?\s*localizeApiError\(previousLanguage, error\.responseMessage, error\.status, error\.reference\)/s,
  );
});
