import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { handoffRefreshDelayMs, telegramAppLaunchUrl } from "../lib/browser-handoff.js";

test("a secure Telegram link refreshes before its five-minute expiry", () => {
  assert.equal(handoffRefreshDelayMs(300), 297_500);
});

test("a Telegram app launch keeps the browser handoff start payload", () => {
  assert.equal(
    telegramAppLaunchUrl("https://t.me/demo1vbot?start=web_AbCd_123"),
    "tg://resolve?domain=demo1vbot&start=web_AbCd_123",
  );
});

test("the browser handoff tries Telegram's app before its web fallback", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );

  assert.match(shell, /const appUrl = telegramAppLaunchUrl\(botUrl\)/);
  assert.match(shell, /window\.location\.assign\(appUrl\)/);
  assert.match(shell, /document\.visibilityState === "visible" && document\.hasFocus\(\)/);
});
