import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  hasTelegramWebAppLaunchParams,
  isTelegramWebAppContext,
} from "../lib/telegram-webapp-auth.js";

test("Telegram WebApp user agents wait for signed init data even before it arrives", () => {
  assert.equal(isTelegramWebAppContext("Telegram-Android/11.2", false), true);
  assert.equal(isTelegramWebAppContext("Telegram-iOS/11.2", false), true);
  assert.equal(isTelegramWebAppContext("TelegramDesktop/5.8", false), true);
});

test("Telegram WebApp platform identifies clients with a generic user agent", () => {
  assert.equal(isTelegramWebAppContext("Mozilla/5.0 Chrome/140", false, false, "tdesktop"), true);
  assert.equal(isTelegramWebAppContext("Mozilla/5.0 Chrome/140", false, false, "android"), true);
  assert.equal(isTelegramWebAppContext("Mozilla/5.0 Chrome/140", false, false, "unknown"), false);
});

test("ordinary browsers use the handoff unless signed Telegram data is present", () => {
  assert.equal(isTelegramWebAppContext("Mozilla/5.0 Chrome/140", false), false);
  assert.equal(isTelegramWebAppContext("Mozilla/5.0 Chrome/140", true), true);
});

test("Telegram launch parameters identify a Mini App before its signed data arrives", () => {
  const search = "";
  const hash = "#tgWebAppVersion=8.0&tgWebAppPlatform=tdesktop&tgWebAppThemeParams=%7B%7D";

  assert.equal(hasTelegramWebAppLaunchParams(search, hash), true);
  assert.equal(isTelegramWebAppContext("Mozilla/5.0 Chrome/140", false, true), true);
  assert.equal(hasTelegramWebAppLaunchParams("?campaign=summer", ""), false);
});

test("a delayed Telegram bridge stays in session-check state without starting browser handoff", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );
  assert.match(shell, /hasTelegramWebAppLaunchParams\(\s*window\.location\.search,\s*window\.location\.hash/);
  assert.match(shell, /const telegramContext = openedInsideTelegram\(\)/);
  assert.match(shell, /telegramWebApp\(\)\?\.platform/);
  assert.match(shell, /if \(telegramContext && !telegramInitData\(\)\) \{\s*setTelegramIdentityPending\(true\);\s*return;/);
  assert.match(shell, /status=\{telegramIdentityPending \? "Connecting to Telegram/);
  assert.match(shell, /sessionBootstrapComplete && !telegramLaunchContext/);
  assert.doesNotMatch(shell, /if \(telegramIdentityPending\) return <DeskLoading/);
  assert.match(shell, /if \(!telegramInitData\(\)\) return;\s*setTelegramIdentityPending\(false\);\s*void load\(\);/);
});

test("desk tab synchronization preserves Telegram launch data in the URL fragment", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );
  const expectedHashIndex = shell.indexOf("const expected = `#${tab.toLowerCase()}`;");
  const effectStart = shell.lastIndexOf("useEffect(() => {", expectedHashIndex);
  const effectEnd = shell.indexOf("}, [tab]);", expectedHashIndex);
  const routeHashEffect = shell.slice(effectStart, effectEnd);

  assert.notEqual(expectedHashIndex, -1, "desk tab hash should be generated");
  assert.ok(routeHashEffect, "desk tab hash synchronization effect should exist");
  assert.match(routeHashEffect, /if \(openedInsideTelegram\(\)\) return;/);
  assert.ok(
    routeHashEffect.indexOf("openedInsideTelegram()") < routeHashEffect.indexOf("replaceState"),
    "Telegram launch data must be preserved before route hash replacement",
  );
});

test("Telegram Mini Apps show the Pulse loader instead of browser auth and handoff", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );
  const loader = await readFile(
    new URL("../components/desk-loading.tsx", import.meta.url),
    "utf8",
  );

  assert.match(shell, /if \(telegramLaunchContext\) \{\s*if \(loading \|\| telegramIdentityPending\) \{\s*return \(\s*<DeskLoading/);
  assert.match(shell, /status=\{notice \|\| "Telegram sign-in could not be completed\."\}[\s\S]*?onRetry=\{\(\) => \{\s*setNotice\(""\);\s*void load\(\);/);
  assert.match(loader, /onRetry && \([\s\S]*?<button[^>]*>[\s\S]*?Try again/);
  assert.match(shell, /<BrowserBotHandoff/);
});
