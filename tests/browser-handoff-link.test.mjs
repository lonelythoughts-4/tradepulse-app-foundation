import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  handoffRefreshDelayMs,
  telegramAppLaunchUrl,
  shouldUseTelegramAppLaunch,
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

test("only mobile browsers use a Telegram app launch", () => {
  assert.equal(shouldUseTelegramAppLaunch("Mozilla/5.0 (Linux; Android 15)"), true);
  assert.equal(shouldUseTelegramAppLaunch("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)"), true);
  assert.equal(shouldUseTelegramAppLaunch("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"), false);
  assert.equal(shouldUseTelegramAppLaunch("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", true), true);
});

test("the browser handoff keeps the web link for desktop and never forces an install page", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );

  assert.match(shell, /const appUrl = telegramAppLaunchUrl\(botUrl\)/);
  assert.match(shell, /const isMobile = shouldUseTelegramAppLaunch\(/);
  assert.match(shell, /window\.open\("about:blank", "_blank"\)/);
  assert.match(shell, /appTab\.opener = null/);
  assert.match(shell, /appTab\.location\.replace\(appUrl\)/);
  assert.match(shell, /href=\{botUrl\}/);
  assert.doesNotMatch(shell, /telegramInstallUrl/);
  assert.doesNotMatch(shell, /location\.replace\(installUrl\)/);
  assert.match(shell, /window\.location\.replace\("\/"\)/);
  assert.match(shell, /state === "error" \? \(\s*<button className="primary-action" type="button" onClick=\{retry\}>/);
  assert.match(shell, /The sign-in service did not respond\. Retrying once…/);
  assert.match(shell, /Reference: \$\{requestId\}/);
});
