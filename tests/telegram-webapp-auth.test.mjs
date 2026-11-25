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

test("a delayed Telegram bridge is detected before the desk chooses browser handoff", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );
  const translations = await readFile(
    new URL("../lib/desk-i18n.ts", import.meta.url),
    "utf8",
  );
  assert.match(shell, /hasTelegramWebAppLaunchParams\(\s*window\.location\.search,\s*window\.location\.hash/);
  assert.match(shell, /async function detectTelegramLaunch\(\)/);
  assert.match(shell, /for \(let attempt = 0; attempt < 50; attempt \+= 1\)/);
  assert.match(shell, /if \(openedInsideTelegram\(\)\) return true;/);
  assert.match(shell, /const telegramContext = !telegramHandoffSessionRef\.current && \(\s*openedInsideTelegram\(\)\s*\|\| \(checkingSession && await detectTelegramLaunch\(\)\)\s*\);/);
  assert.match(shell, /telegramWebApp\(\)\?\.platform/);
  const loadStart = shell.indexOf("const load = async");
  const dashboardRequest = shell.indexOf('request("/v1/dashboard", {}, targetEnvironment, 15_000)', loadStart);
  assert.notEqual(dashboardRequest, -1, "initial load should validate the existing browser session");
  assert.doesNotMatch(
    shell.slice(loadStart, dashboardRequest),
    /if \(telegramContext && !telegramInitData\(\)\)\s*\{/,
    "a missing fresh initData value must not skip the secure browser-session check",
  );
  assert.match(shell, /<BrowserBotHandoff onComplete=/);
  assert.match(shell, /const telegramContext = !telegramHandoffSessionRef\.current && \(/);
  assert.match(shell, /if \(!telegramInitData\(\)\) return;\s*setTelegramIdentityPending\(false\);\s*void load\(\);/);
  assert.match(shell, /if \(webApp && webApp !== preparedWebApp\) \{\s*webApp\.ready\?\.\(\);\s*webApp\.expand\?\.\(\);\s*preparedWebApp = webApp;/);
  assert.match(translations, /"telegram\.bridgeFallback"/);
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

test("Telegram Mini Apps recover to secure handoff after bridge detection or session rejection", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );
  const loader = await readFile(
    new URL("../components/desk-loading.tsx", import.meta.url),
    "utf8",
  );
  const handoffStart = shell.indexOf("function BrowserBotHandoff");
  const handoffEnd = shell.indexOf("\nfunction ", handoffStart + 1);
  const handoff = shell.slice(handoffStart, handoffEnd);
  const loadStart = shell.indexOf("const load = async");
  const loadEnd = shell.indexOf("const reloadDashboard", loadStart);
  const load = shell.slice(loadStart, loadEnd);

  assert.match(shell, /setTelegramLaunchContext\(false\);\s*setSessionHandoffRequired\(true\);\s*setSessionBootstrapComplete\(true\)/);
  assert.match(shell, /sessionHandoffRequired \? \(\s*<BrowserBotHandoff/);
  assert.match(shell, /<BrowserBotHandoff onComplete=\{async \(\) => \{[\s\S]*?telegramHandoffSessionRef\.current = true;[\s\S]*?const loaded = await load\(\);/);
  assert.doesNotMatch(handoff, /state === "error"/);
  assert.match(load, /if \(checkingSession && telegramContext && !telegramInitData\(\)\) \{\s*setTelegramIdentityPending\(false\);\s*setTelegramLaunchContext\(false\);\s*setSessionHandoffRequired\(true\);\s*setSessionBootstrapComplete\(true\);\s*return false;\s*\}/);
  assert.ok(load.indexOf("if (checkingSession && telegramContext && !telegramInitData())") < load.indexOf('request("/v1/dashboard"'));
  assert.match(loader, /onRetry && \([\s\S]*?<button[^>]*>[\s\S]*?Try again/);
});

test("an endpoint-specific 401 validates the dashboard before asking the user to sign in again", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );
  const request = shell.slice(
    shell.indexOf("const request = useCallback"),
    shell.indexOf("const noticeCenter"),
  );

  assert.match(
    request,
    /if \(response\.status === 401\) \{\s*if \(path === "\/v1\/dashboard"\) \{[\s\S]*?updateDashboard\(null\);[\s\S]*?setTelegramIdentityPending\(false\);[\s\S]*?setTelegramLaunchContext\(false\);[\s\S]*?setSessionHandoffRequired\(true\);[\s\S]*?setSessionBootstrapComplete\(true\);[\s\S]*?\} else \{[\s\S]*?sessionValidationRef\.current\?\.\(targetEnvironment\);[\s\S]*?\}\s*throw new DeskApiError/,
  );
  assert.doesNotMatch(shell, /Reconnect your TradeMemo session/);
});
