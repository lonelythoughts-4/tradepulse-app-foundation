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

test("a missing Telegram bridge stays in the Mini App and offers a retry", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );
  const translations = await readFile(
    new URL("../lib/desk-i18n.ts", import.meta.url),
    "utf8",
  );
  assert.match(shell, /hasTelegramWebAppLaunchParams\(\s*window\.location\.search,\s*window\.location\.hash/);
  assert.match(shell, /const telegramContext = openedInsideTelegram\(\)/);
  assert.match(shell, /telegramWebApp\(\)\?\.platform/);
  assert.match(shell, /if \(telegramContext && !telegramInitData\(\)\) \{\s*setTelegramIdentityPending\(true\);\s*return false;/);
  assert.match(shell, /if \(telegramIdentityPending\) \{\s*return \(\s*<DeskLoading/);
  assert.match(shell, /translateDesk\(uiLanguage, "telegram\.bridgeFallback"\)/);
  assert.match(shell, /status=\{translateDesk\(uiLanguage, "telegram\.bridgeFallback"\)\}\s*onRetry=\{\(\) => \{\s*setNotice\(""\);\s*void load\(\);/);
  const fallbackStart = shell.indexOf("if (telegramIdentityPending) {", shell.indexOf("if (!data) {"));
  const fallbackEnd = shell.indexOf("if (loading) {", fallbackStart);
  const telegramFallback = shell.slice(fallbackStart, fallbackEnd);
  assert.match(telegramFallback, /<DeskLoading/);
  assert.doesNotMatch(telegramFallback, /<BrowserBotHandoff/);
  assert.match(shell, /openedInsideTelegram\(\) && !telegramHandoffSessionRef\.current/);
  assert.match(shell, /if \(!telegramInitData\(\)\) return;\s*setTelegramIdentityPending\(false\);\s*void load\(\);/);
  assert.match(shell, /if \(webApp && webApp !== preparedWebApp\) \{\s*webApp\.ready\?\.\(\);\s*webApp\.expand\?\.\(\);\s*preparedWebApp = webApp;/);
  assert.match(translations, /"telegram\.bridgeFallback": "Telegram did not provide sign-in data\. Try again, or close this window and reopen the app from the TradeMemo bot\."/);
  assert.doesNotMatch(telegramFallback, /Continue with the secure link below/);
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

test("Telegram Mini Apps show an in-app retry after bridge timeout", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );
  const loader = await readFile(
    new URL("../components/desk-loading.tsx", import.meta.url),
    "utf8",
  );

  assert.match(shell, /if \(telegramLaunchContext\) \{\s*if \(telegramIdentityPending\) \{\s*return \(\s*<DeskLoading/);
  assert.match(shell, /if \(loading\) \{\s*return \(\s*<DeskLoading/);
  assert.match(shell, /status=\{notice \|\| "Telegram sign-in could not be completed\."\}[\s\S]*?onRetry=\{\(\) => \{\s*setNotice\(""\);\s*void load\(\);/);
  assert.match(loader, /onRetry && \([\s\S]*?<button[^>]*>[\s\S]*?Try again/);
  assert.match(shell, /status=\{translateDesk\(uiLanguage, "telegram\.bridgeFallback"\)\}\s*onRetry=/);
  assert.match(shell, /<BrowserBotHandoff/);
});
