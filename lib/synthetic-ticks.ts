export type SyntheticTick = {
  market: string;
  sequence: number;
  price: number;
  timestamp?: number;
};

export type SyntheticTickReconciliation = {
  ticks: SyntheticTick[];
  requiresResync: boolean;
};

export function reconcileSyntheticTicks(ticks: SyntheticTick[], market?: string): SyntheticTick[];
export function reconcileSyntheticTicks(ticks: SyntheticTick[], market: string | undefined, options: { withStatus: true }): SyntheticTickReconciliation;
export function reconcileSyntheticTicks(ticks: SyntheticTick[], market?: string, options?: { withStatus: true }): SyntheticTick[] | SyntheticTickReconciliation {
  const seen = new Set<string>();
  const reconciled = ticks
    .filter((tick) => (!market || tick.market === market)
      && Boolean(tick.market)
      && Number.isInteger(Number(tick.sequence))
      && Number(tick.sequence) >= 0
      && Number.isFinite(Number(tick.price))
      && Number(tick.price) > 0)
    .sort((left, right) => Number(left.sequence) - Number(right.sequence))
    .filter((tick) => {
      const identity = `${tick.market}:${tick.sequence}`;
      if (seen.has(identity)) return false;
      seen.add(identity);
      return true;
    });
  const requiresResync = reconciled.some((tick, index) => index > 0
    && tick.market === reconciled[index - 1].market
    && Number(tick.sequence) !== Number(reconciled[index - 1].sequence) + 1);
  return options?.withStatus ? { ticks: reconciled, requiresResync } : reconciled;
}

export type SyntheticCandle = {
  open: number;
  close: number;
  high: number;
  low: number;
  timestamp?: number;
};

export function makeSyntheticCandles(points: SyntheticTick[]): SyntheticCandle[] {
  const series = reconcileSyntheticTicks(points);
  if (!series.length) return [];
  const firstTimestamp = Number(series[0]?.timestamp || 0);
  const lastTimestamp = Number(series.at(-1)?.timestamp || firstTimestamp);
  const hasClock = lastTimestamp > firstTimestamp;
  const bucketSeconds = hasClock ? Math.max(1, Math.ceil((lastTimestamp - firstTimestamp + 1) / 42)) : 1;
  const candles: SyntheticCandle[] = [];
  for (let index = 0; index < series.length;) {
    const bucketStart = hasClock ? Math.floor((Number(series[index].timestamp) - firstTimestamp) / bucketSeconds) : 0;
    let end = index + 1;
    while (end < series.length && (hasClock ? Math.floor((Number(series[end].timestamp) - firstTimestamp) / bucketSeconds) : 0) === bucketStart) end += 1;
    const bucket = series.slice(index, end);
    const prices = bucket.map((point) => Number(point.price));
    candles.push({ open: prices[0], close: prices.at(-1) || prices[0], high: Math.max(...prices), low: Math.min(...prices), timestamp: bucket.at(-1)?.timestamp });
    index = end;
  }
  return candles;
}
