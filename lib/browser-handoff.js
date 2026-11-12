const REFRESH_EARLY_MS = 2_500;

export function handoffRefreshDelayMs(expiresInSeconds) {
  const expiresInMs = Math.floor(Number(expiresInSeconds) * 1_000);
  return Math.max(1_000, expiresInMs - REFRESH_EARLY_MS);
}

export function telegramAppLaunchUrl(browserUrl) {
  try {
    const url = new URL(browserUrl);
    const domain = url.hostname === "t.me" || url.hostname === "www.t.me"
      ? url.pathname.split("/").filter(Boolean)[0]
      : "";
    const start = url.searchParams.get("start");
    if (!domain || !start) return browserUrl;
    return `tg://resolve?domain=${encodeURIComponent(domain)}&start=${encodeURIComponent(start)}`;
  } catch {
    return browserUrl;
  }
}

export function telegramInstallUrl(userAgent, isAppleTouchDevice = false) {
  const platform = String(userAgent || "").toLowerCase();
  if (platform.includes("android")) {
    return "https://play.google.com/store/apps/details?id=org.telegram.messenger";
  }
  if (/\b(iphone|ipad|ipod)\b/.test(platform) || isAppleTouchDevice) {
    return "https://apps.apple.com/app/telegram-messenger/id686449807";
  }
  return "https://telegram.org/apps";
}
