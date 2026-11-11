import assert from "node:assert/strict";
import test from "node:test";

import { nextDeskTheme, resolveDeskTheme } from "../lib/theme-preference.ts";

test("a saved desk theme overrides the default", () => {
  assert.equal(resolveDeskTheme("light"), "light");
  assert.equal(resolveDeskTheme("dark"), "dark");
});

test("the first visit defaults to light mode", () => {
  assert.equal(resolveDeskTheme(null), "light");
});

test("an invalid saved theme falls back to light mode", () => {
  assert.equal(resolveDeskTheme("sepia"), "light");
});

test("the theme control alternates between light and dark", () => {
  assert.equal(nextDeskTheme("dark"), "light");
  assert.equal(nextDeskTheme("light"), "dark");
});
