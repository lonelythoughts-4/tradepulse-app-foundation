import assert from "node:assert/strict";
import test from "node:test";

import { getIdempotencyKeyForPayload } from "../lib/idempotency-key.ts";

test("reuses a retry key when the user restores the same action payload", () => {
  const keys = new Map<string, string>();
  const scope = "withdrawal:mainnet";
  const originalFingerprint = JSON.stringify(["mainnet", "USDT", "BASE", "0xabc", 25]);
  const editedFingerprint = JSON.stringify(["mainnet", "USDT", "BASE", "0xdef", 25]);

  const originalKey = getIdempotencyKeyForPayload(keys, scope, originalFingerprint);
  const editedKey = getIdempotencyKeyForPayload(keys, scope, editedFingerprint);
  const retryKey = getIdempotencyKeyForPayload(keys, scope, originalFingerprint);

  assert.equal(retryKey, originalKey);
  assert.notEqual(editedKey, originalKey);
});
