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

test("the welcome page omits the repeated pulse mark and security shield", async () => {
  const source = await readFile(
    new URL("../components/auth-entry.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /PulseGlyph/);
  assert.doesNotMatch(source, /M12 3 19 6v5c0 4\.5/);
  assert.match(source, /TradePulse will never ask for your password/);
});

test("the desktop welcome sections advance horizontally from vertical scrolling", async () => {
  const [source, styles] = await Promise.all([
    readFile(new URL("../components/auth-entry.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/auth-entry.module.css", import.meta.url), "utf8"),
  ]);

  assert.match(source, /addEventListener\("wheel", handleWheel, \{ passive: false \}\)/);
  assert.doesNotMatch(source, /onWheel=\{handleWheel\}/);
  assert.match(source, /onKeyDown=\{handleStoryKeyDown\}/);
  assert.equal((source.match(/data-auth-panel(?:\s|>)/g) ?? []).length, 4);
  assert.match(styles, /\.story\s*\{\s*display: block;/s);
  assert.match(styles, /min-width: 901px\) and \(min-height: 760px\) and \(pointer: fine/);
  assert.match(styles, /scroll-snap-type: x mandatory/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});
