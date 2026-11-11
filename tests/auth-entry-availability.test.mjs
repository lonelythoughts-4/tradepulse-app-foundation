import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the welcome page explains the live sign-in method and unavailable email flows", async () => {
  const source = await readFile(
    new URL("../components/auth-entry.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /\["Sign-in help", "#sign-in-help"\]/);
  assert.match(source, /id="sign-in-help"/);
  assert.match(source, /Telegram confirmation is the only sign-in method available on this page/);
  assert.match(source, /account registration, and password recovery are not connected to TradePulse/);
  assert.match(source, /prepares a fresh one automatically/);
  assert.doesNotMatch(source, /type="email"/);
  assert.doesNotMatch(source, /Create Account|Sign up with Google/);
});
