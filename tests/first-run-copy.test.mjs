import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shell = readFileSync(new URL("../components/tradepulse-shell.tsx", import.meta.url), "utf8");
const auth = readFileSync(new URL("../components/auth-entry.tsx", import.meta.url), "utf8");

test("first-run copy names the products and keeps users in control", () => {
  for (const source of [shell, auth]) {
    assert.match(source, /Memecoin/);
    assert.match(source, /Synthetic/);
  }
  assert.match(shell, /Pause, resume, or close automation at any time\./);
});

test("first-run copy does not expose implementation or roadmap notes", () => {
  for (const phrase of [
    "Full desk localization will continue to expand",
    "onboarding-channel gate is disabled",
    "This gate is not ready to enforce",
    "Channel verification is not active",
    "you will not be trapped here",
  ]) {
    assert.doesNotMatch(shell, new RegExp(phrase));
    assert.doesNotMatch(auth, new RegExp(phrase));
  }
});
