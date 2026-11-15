export function isTelegramWebAppContext(userAgent, hasSignedInitData) {
  return Boolean(hasSignedInitData) || /telegram/i.test(String(userAgent || ""));
}
