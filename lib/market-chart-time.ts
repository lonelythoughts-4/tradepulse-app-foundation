function timestampMillis(timestamp: number | undefined) {
  if (!timestamp) return undefined;
  return timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
}

export function formatMarketChartTime(
  timestamp: number | undefined,
  index: number,
  total: number,
  firstTimestamp?: number,
  lastTimestamp?: number,
) {
  if (!timestamp) return index === total - 1 ? "NOW" : `T-${total - index - 1}`;
  const millis = timestampMillis(timestamp)!;
  const firstMillis = timestampMillis(firstTimestamp);
  const lastMillis = timestampMillis(lastTimestamp);
  const intraday = firstMillis !== undefined && lastMillis !== undefined && Math.abs(lastMillis - firstMillis) < 86_400_000;
  if (intraday) {
    return new Date(millis).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }
  return new Date(millis).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
