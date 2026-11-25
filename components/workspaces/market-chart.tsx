"use client";

import { useEffect, useRef, useState } from "react";
import { formatMarketChartTime } from "../../lib/market-chart-time";
import { formatMarketPrice, makeMarketCandles, type MarketChartPoint } from "../../lib/market-chart-series";
import { DeskLocalized } from "../desk-language";
import { StateIcon } from "./shared-ui";

export type MarketPoint = MarketChartPoint;
export type MarketCandle = ReturnType<typeof makeMarketCandles>[number];

function makeCandles(points: MarketPoint[]): MarketCandle[] {
  return makeMarketCandles(points);
}

function chartCandles(points: MarketPoint[], supplied?: MarketCandle[]) {
  const candles = (supplied || []).filter((candle) =>
    [candle.open, candle.close, candle.high, candle.low].every((value) => Number.isFinite(Number(value)) && Number(value) > 0),
  );
  if (!candles.length) return makeCandles(points);
  const latest = points.at(-1);
  const latestTimestamp = Number(latest?.timestamp || 0);
  const finalTimestamp = Number(candles.at(-1)?.timestamp || 0);
  if (latest && Number.isFinite(Number(latest.price)) && Number(latest.price) > 0 && latestTimestamp > finalTimestamp) {
    candles.push({ open: Number(latest.price), close: Number(latest.price), high: Number(latest.price), low: Number(latest.price), timestamp: latestTimestamp });
  }
  return candles;
}

function rsiValues(closes: number[], period = 14) {
  if (closes.length < 2) return [] as number[];
  const values: number[] = [];
  for (let index = 0; index < closes.length; index += 1) {
    const start = Math.max(1, index - period + 1);
    const changes = closes.slice(start - 1, index + 1).map((value, changeIndex, series) =>
      changeIndex ? value - series[changeIndex - 1] : 0,
    ).slice(1);
    const gains = changes.reduce((sum, change) => sum + Math.max(change, 0), 0) / Math.max(changes.length, 1);
    const losses = changes.reduce((sum, change) => sum + Math.max(-change, 0), 0) / Math.max(changes.length, 1);
    values.push(losses === 0 ? 100 : 100 - 100 / (1 + gains / losses));
  }
  return values;
}

export { formatMarketPrice };

export function MarketChart({
  points,
  ohlcCandles,
  market,
  sourceLabel,
  emptyMessage = "Waiting for live market data",
  feedError,
  accent = "#34d399",
}: {
  points: MarketPoint[];
  ohlcCandles?: MarketCandle[];
  market: string;
  sourceLabel?: string;
  emptyMessage?: string;
  feedError?: string;
  accent?: string;
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState(0);
  const lastVerified = useRef<{ market: string; candles: MarketCandle[] } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const priceSvgRef = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStartDistance = useRef(0);
  const pinchStartZoom = useRef(1);
  const dragStart = useRef<{ pointerId: number; x: number; offset: number } | null>(null);
  const clampZoom = (value: number) => Math.max(1, Math.min(8, value));
  const clearGesture = () => {
    const captured = Array.from(pointers.current.keys());
    pointers.current.clear();
    pinchStartDistance.current = 0;
    dragStart.current = null;
    for (const pointerId of captured) {
      if (chartRef.current?.hasPointerCapture(pointerId)) chartRef.current.releasePointerCapture(pointerId);
    }
  };
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || pointers.current.size >= 2 || (event.target instanceof Element && event.target.closest("button"))) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus({ preventScroll: true });
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) {
      dragStart.current = { pointerId: event.pointerId, x: event.clientX, offset: Math.min(offset, maxOffset) };
    } else if (pointers.current.size === 2) {
      dragStart.current = null;
      const [first, second] = Array.from(pointers.current.values());
      pinchStartDistance.current = Math.hypot(first.x - second.x, first.y - second.y);
      pinchStartZoom.current = zoom;
    }
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1 && dragStart.current?.pointerId === event.pointerId) {
      const plotWidth = Math.max(1, priceSvgRef.current?.getBoundingClientRect().width || 560);
      const travelledPoints = Math.round(((dragStart.current.x - event.clientX) / plotWidth) * visibleCount);
      setOffset(Math.max(0, Math.min(maxOffset, dragStart.current.offset + travelledPoints)));
      return;
    }
    if (pointers.current.size !== 2 || !pinchStartDistance.current) return;
    const [first, second] = Array.from(pointers.current.values());
    const distance = Math.hypot(first.x - second.x, first.y - second.y);
    setZoom(clampZoom(pinchStartZoom.current * (distance / pinchStartDistance.current)));
  };
  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointers.current.has(event.pointerId)) clearGesture();
  };
  const freshCandles = chartCandles(points, ohlcCandles);
  if (freshCandles.length) lastVerified.current = { market, candles: freshCandles };
  const retainedCandles = lastVerified.current?.market === market ? lastVerified.current.candles : [];
  // A temporary polling failure must not replace received market history with
  // an empty panel. The retained series is explicitly labelled as stale below.
  const sourceCandles = freshCandles.length ? freshCandles : retainedCandles;
  const isShowingLastVerified = !freshCandles.length && retainedCandles.length > 0;
  const isWarming = freshCandles.length === 1;
  const baseVisibleCount = Math.min(24, sourceCandles.length);
  const visibleCount = Math.max(12, Math.min(sourceCandles.length, Math.round(baseVisibleCount / zoom)));
  const maxOffset = Math.max(0, sourceCandles.length - visibleCount);
  const pan = (direction: number) => setOffset((current) => Math.max(0, Math.min(maxOffset, current + direction * Math.max(1, Math.round(visibleCount / 5)))));
  const resetView = () => { setZoom(1); setOffset(0); };
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "+" || event.key === "=") setZoom((current) => clampZoom(current * 1.18));
    else if (event.key === "-") setZoom((current) => clampZoom(current * 0.85));
    else if (event.key === "ArrowLeft") pan(1);
    else if (event.key === "ArrowRight") pan(-1);
    else if (event.key === "Home") setOffset(maxOffset);
    else if (event.key === "End") setOffset(0);
    else if (event.key === "0") resetView();
    else return;
    event.preventDefault();
  };
  const cropEnd = sourceCandles.length - Math.min(offset, maxOffset);
  const candles = sourceCandles.slice(Math.max(0, cropEnd - visibleCount), cropEnd);
  const hasCandles = candles.length > 0;
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !hasCandles) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.deltaY || (event.target instanceof Element && event.target.closest("button"))) return;
      event.preventDefault();
      setZoom((current) => Math.max(1, Math.min(8, current * (event.deltaY < 0 ? 1.18 : 0.85))));
    };
    chart.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("blur", clearGesture);
    return () => {
      chart.removeEventListener("wheel", onWheel);
      window.removeEventListener("blur", clearGesture);
      clearGesture();
    };
  }, [hasCandles]);
  useEffect(() => setOffset((current) => Math.min(current, maxOffset)), [maxOffset]);
  if (!hasCandles) {
    return <DeskLocalized><div className="market-chart market-chart-empty" role="status">{emptyMessage}</div></DeskLocalized>;
  }
  const low = Math.min(...candles.map((candle) => candle.low));
  const high = Math.max(...candles.map((candle) => candle.high));
  const range = Math.max(high - low, Math.abs(high || 1) * 0.0025, 0.000001);
  const paddedLow = low - range * 0.08;
  const paddedHigh = high + range * 0.08;
  const domain = paddedHigh - paddedLow;
  const chartWidth = 560;
  const chartHeight = 204;
  const xStep = chartWidth / candles.length;
  const bodyWidth = Math.max(2, Math.min(10, xStep * 0.62));
  const y = (value: number) => 10 + ((paddedHigh - value) / domain) * (chartHeight - 20);
  const priceLabels = Array.from({ length: 5 }, (_, index) => paddedHigh - (domain * index) / 4);
  const rsi = rsiValues(candles.map((candle) => candle.close));
  const rsiPath = rsi
    .map((value, index) => `${index ? "L" : "M"} ${(index / Math.max(rsi.length - 1, 1)) * chartWidth} ${42 - (value / 100) * 34}`)
    .join(" ");
  const visibleTimes = [0, Math.floor((candles.length - 1) / 2), candles.length - 1];
  const priceLabelPositions = priceLabels.map((label, index) => ({
    label,
    top: ((10 + ((chartHeight - 20) * index) / 4) / chartHeight) * 100,
  }));
  const priceAxisWidth = Math.min(
    116,
    Math.max(48, Math.ceil(Math.max(...priceLabels.map((label) => formatMarketPrice(label).length)) * 5.2)),
  );
  return (
    <DeskLocalized>
    <div
      ref={chartRef}
      className="market-chart"
      role="group"
      tabIndex={0}
      aria-label={`${market} candlestick chart with RSI. Use plus or minus to zoom, left or right arrows to pan, Home for earliest, End for latest, and zero to reset. Mouse wheel, pinch, and drag are also available.`}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onLostPointerCapture={onPointerEnd}
      style={{ touchAction: "none" }}
    >
      <div className={`market-chart-status ${isShowingLastVerified || feedError ? "market-chart-status-stale" : ""}`} role="status">
        {feedError ? "Feed reconnecting" : isShowingLastVerified ? `Feed reconnecting · showing last received ${sourceLabel || "1-minute"} candles` : isWarming ? `First ${sourceLabel || "live"} tick received · building candle` : `Showing ${sourceLabel || "1-minute"} candles`}
      </div>
      <div className="market-chart-main" style={{ gridTemplateColumns: `minmax(0, 1fr) ${priceAxisWidth}px` }}>
        <svg ref={priceSvgRef} viewBox="0 0 560 204" preserveAspectRatio="none" role="img" aria-label={`${market} price candles. Latest visible close ${formatMarketPrice(candles[candles.length - 1].close)}, low ${formatMarketPrice(low)}, high ${formatMarketPrice(high)}.`}>
          {priceLabels.map((label, index) => {
            const lineY = 10 + ((chartHeight - 20) * index) / 4;
            return <g key={`${label}-${index}`}><path d={`M0 ${lineY}H560`} className="market-grid-line" /></g>;
          })}
          {Array.from({ length: 7 }, (_, index) => <path key={index} d={`M${(chartWidth * index) / 6} 0V204`} className="market-grid-line market-grid-vertical" />)}
          {candles.map((candle, index) => {
            const center = index * xStep + xStep / 2;
            const rising = candle.close >= candle.open;
            const color = rising ? accent : "#f87171";
            const top = Math.min(y(candle.open), y(candle.close));
            const bodyHeight = Math.abs(y(candle.open) - y(candle.close));
            return <g key={`${candle.timestamp || index}-${candle.close}`}>
              <path d={`M${center} ${y(candle.high)}V${y(candle.low)}`} stroke={color} strokeWidth="1.15" />
              {bodyHeight < 0.8
                ? <path d={`M${center - bodyWidth / 2} ${y(candle.close)}H${center + bodyWidth / 2}`} stroke={color} strokeWidth="1" />
                : <rect x={center - bodyWidth / 2} y={top} width={bodyWidth} height={bodyHeight} fill={rising ? `${color}B3` : color} stroke={color} strokeWidth="0.8" />}
            </g>;
          })}
        </svg>
        <div className="market-price-axis" aria-hidden="true">
          {priceLabelPositions.map(({ label, top }, index) => (
            <span key={`${label}-${index}`} style={{ top: `${top}%` }}>{formatMarketPrice(label)}</span>
          ))}
        </div>
      </div>
      <div className="market-rsi">
        <span>RSI (14)</span>
        <svg viewBox="0 0 560 48" preserveAspectRatio="none" role="img" aria-label={`${market} RSI indicator`}>
          <path d="M0 8H560M0 25H560M0 42H560" className="market-grid-line" />
          <path d={rsiPath} fill="none" stroke="#aeb7ff" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="market-time-axis">
        {visibleTimes.map((index) => <span key={index}>{formatMarketChartTime(candles[index]?.timestamp, index, candles.length, candles[0]?.timestamp, candles.at(-1)?.timestamp)}</span>)}
      </div>
      <div className="filter-chips" role="group" aria-label="Chart view controls">
        <button type="button" onClick={() => setZoom((current) => clampZoom(current * 1.18))} disabled={zoom >= 8} aria-label="Zoom in chart" title="Zoom in (+)"><StateIcon name="plus" size={14} /></button>
        <button type="button" onClick={() => setZoom((current) => clampZoom(current * 0.85))} disabled={zoom <= 1} aria-label="Zoom out chart" title="Zoom out (-)"><StateIcon name="minus" size={14} /></button>
        <button type="button" onClick={() => pan(1)} disabled={offset >= maxOffset} title="Earlier prices (left arrow)">Earlier</button>
        <button type="button" onClick={() => pan(-1)} disabled={offset <= 0} title="Later prices (right arrow)">Later</button>
        <button type="button" onClick={resetView} disabled={zoom === 1 && offset === 0} title="Reset chart (0)">Reset</button>
      </div>
    </div>
    </DeskLocalized>
  );
}
