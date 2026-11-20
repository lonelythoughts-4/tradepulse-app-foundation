export function memecoinMarketDisplayName(
  market: unknown,
  labels: Record<string, string> | undefined,
): string {
  if (typeof market !== "string" || !market) return "Memecoin market";
  return labels?.[market] || labels?.[market.toLowerCase()] || "Memecoin market";
}
