export type MarketChartPoint = {
  price: number;
  timestamp?: number;
};

export type MarketChartCandle = {
  open: number;
  close: number;
  high: number;
  low: number;
  timestamp?: number;
};

export function shouldShowMarketCloseTrace(candles: MarketChartCandle[], domain: number, plotHeight: number) {
  if (candles.length < 4 || !Number.isFinite(domain) || domain <= 0 || !Number.isFinite(plotHeight) || plotHeight <= 0) {
    return false;
  }
  const compressedBodies = candles.filter((candle) =>
    Math.abs(candle.close - candle.open) * plotHeight / domain < 0.8,
  ).length;
  return compressedBodies >= Math.ceil(candles.length * 0.6);
}

export function formatMarketPrice(value: number) {
  const absolute = Math.abs(value);
  if (absolute >= 1000) return value.toFixed(2);
  if (absolute >= 1) return value.toFixed(4);
  const decimals = absolute > 0
    ? Math.min(20, Math.max(6, Math.ceil(-Math.log10(absolute)) + 4))
    : 6;
  return value.toFixed(decimals).replace(/(?:\.0+|(\.\d*?[1-9])0+)$/, "$1");
}

export function makeMarketCandles(points: MarketChartPoint[]): MarketChartCandle[] {
  const valid = points
    .filter((point) => Number.isFinite(Number(point.price)) && Number(point.price) > 0)
    .map((point, index) => ({
      ...point,
      timestamp: point.timestamp !== undefined && Number.isFinite(Number(point.timestamp))
        ? Number(point.timestamp)
        : index,
    }))
    .sort((left, right) => Number(left.timestamp) - Number(right.timestamp));

  if (valid.length === 1) {
    const price = Number(valid[0].price);
    return [{ open: price, close: price, high: price, low: price, timestamp: valid[0].timestamp }];
  }
  if (valid.length < 1) return [];

  const uniqueByTimestamp = new Map<number, MarketChartPoint>();
  for (const point of valid) uniqueByTimestamp.set(Number(point.timestamp), point);
  const series = [...uniqueByTimestamp.values()];
  const firstTimestamp = Number(series[0]?.timestamp || 0);
  const lastTimestamp = Number(series.at(-1)?.timestamp || firstTimestamp);
  const hasClock = lastTimestamp > firstTimestamp;
  const bucketSeconds = hasClock ? Math.max(1, Math.ceil((lastTimestamp - firstTimestamp + 1) / 42)) : 1;
  const candles: MarketChartCandle[] = [];

  for (let index = 0; index < series.length;) {
    const bucketStart = hasClock ? Math.floor((Number(series[index].timestamp) - firstTimestamp) / bucketSeconds) : index;
    let end = index + 1;
    while (end < series.length && (hasClock ? Math.floor((Number(series[end].timestamp) - firstTimestamp) / bucketSeconds) : end) === bucketStart) end += 1;
    const bucket = series.slice(index, end);
    const prices = bucket.map((point) => Number(point.price));
    candles.push({
      open: prices[0],
      close: prices.at(-1) || prices[0],
      high: Math.max(...prices),
      low: Math.min(...prices),
      timestamp: bucket.at(-1)?.timestamp,
    });
    index = end;
  }
  return candles;
}
