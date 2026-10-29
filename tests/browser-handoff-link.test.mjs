import assert from "node:assert/strict";
import test from "node:test";
import { handoffRefreshDelayMs, telegramMobileLaunchUrl } from "../lib/browser-handoff.js";

test("a secure Telegram link refreshes before its five-minute expiry", () => {
  assert.equal(handoffRefreshDelayMs(300), 297_500);
});

test("a mobile Telegram launch keeps the browser handoff start payload", () => {
  assert.equal(
    telegramMobileLaunchUrl("https://t.me/demo1vbot?start=web_AbCd_123"),
    "tg://resolve?domain=demo1vbot&start=web_AbCd_123",
  );
});
