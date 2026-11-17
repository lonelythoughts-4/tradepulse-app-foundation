export function hasTelegramWebAppLaunchParams(search, hash) {
  const launchKeys = [
    "tgWebAppData",
    "tgWebAppVersion",
    "tgWebAppPlatform",
    "tgWebAppThemeParams",
  ];
  return [search, String(hash || "").replace(/^#/, "")].some((source) => {
    const params = new URLSearchParams(String(source || ""));
    return launchKeys.some((key) => params.has(key));
  });
}

export function isTelegramWebAppContext(userAgent, hasSignedInitData, hasLaunchParams = false) {
  return Boolean(hasSignedInitData || hasLaunchParams) || /telegram/i.test(String(userAgent || ""));
}
