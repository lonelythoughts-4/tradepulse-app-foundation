import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  handoffRefreshDelayMs,
  telegramAppLaunchUrl,
  telegramInstallUrl,
} from "../lib/browser-handoff.js";

test("a secure Telegram link refreshes before its five-minute expiry", () => {
  assert.equal(handoffRefreshDelayMs(300), 297_500);
});

test("a Telegram app launch keeps the browser handoff start payload", () => {
  assert.equal(
    telegramAppLaunchUrl("https://t.me/demo1vbot?start=web_AbCd_123"),
    "tg://resolve?domain=demo1vbot&start=web_AbCd_123",
  );
});

test("Telegram install fallbacks match Android, Apple and desktop devices", () => {
  assert.equal(
    telegramInstallUrl("Mozilla/5.0 (Linux; Android 15)"),
    "https://play.google.com/store/apps/details?id=org.telegram.messenger",
  );
  assert.equal(
    telegramInstallUrl("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)"),
    "https://apps.apple.com/app/telegram-messenger/id686449807",
  );
  assert.equal(
    telegramInstallUrl("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"),
    "https://telegram.org/apps",
  );
  assert.equal(
    telegramInstallUrl("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", true),
    "https://apps.apple.com/app/telegram-messenger/id686449807",
  );
});

test("the browser handoff launches Telegram directly in a separate tab", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );

  assert.match(shell, /const appUrl = telegramAppLaunchUrl\(botUrl\)/);
  assert.match(shell, /window\.open\(appUrl, "_blank"\)/);
  assert.match(shell, /if \(appTab\) appTab\.opener = null/);
  assert.match(shell, /href=\{telegramAppLaunchUrl\(botUrl\)\}/);
  assert.match(shell, /document\.visibilityState === "visible" && document\.hasFocus\(\)/);
  assert.match(shell, /setTimeout\(\(\) => \{\s*if \(document\.visibilityState === "visible" && document\.hasFocus\(\)\)/);
  assert.match(shell, /appTab\.location\.replace\(installUrl\)/);
  assert.match(shell, /window\.location\.replace\("\/"\)/);
  assert.match(shell, /state === "error" \? \(\s*<button className="primary-action" type="button" onClick=\{retry\}>/);
  assert.match(shell, /The sign-in service did not respond\. Retrying once…/);
  assert.match(shell, /Reference: \$\{requestId\}/);
});
