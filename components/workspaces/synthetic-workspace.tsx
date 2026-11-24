"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { AccessibleDialog } from "../accessible-dialog";
import { DeskLocalized } from "../desk-language";
import { useDeskSelector, type DeskStore } from "../../lib/desk-store";
import type { ActionKey, DeskState } from "../../lib/desk-types";
import type { LiveDashboard } from "../tradepulse-shell";
import { reconcileSyntheticTicks } from "../../lib/synthetic-ticks";
import { contractReasonLabel, contractTypeLabel, normaliseManualContractType } from "../../lib/synthetic-contract-terms";
import { liveNetPnlLabel } from "../../lib/synthetic-position-pnl";
import { syntheticQuoteStatus } from "../../lib/synthetic-quote-status";
import { logDeskFailure } from "../../lib/desk-api";
import { useResourcePoller } from "./use-resource-poller";

type Market = "SYN-10" | "SYN-25" | "SYN-50" | "SYN-75" | "SYN-100";
type Signal = { id: string; market: string; direction: string; reference_price: number; expires_at: number };
type Snapshot = { market: string; partial?: boolean; history_available?: boolean; history_stale?: boolean; positions_stale?: boolean; latest: { market?: string; price?: number; reference?: number; sequence?: number; timestamp?: number; created_at?: number }; ticks: Array<{ market?: string; sequence?: number; price?: number; reference?: number; timestamp?: number; created_at?: number }>; positions: Array<{ id: string; market: string; direction: string; margin_usd: number; status: string; clearing_type?: string; spread_charged_usd?: number; tier_fee_usd?: number; user_net_unrealized_pnl_usd?: number; signal_id?: string; contract_type?: string; contract_expires_at?: number; maximum_loss_percent?: number; manual_stop_loss_percent?: number; contract_reason?: string }>; execution?: { auto_allocation_usd?: number; auto_available_usd?: number; auto_locked_usd?: number; manual_available_usd?: number; auto_margin_usd?: number; capacity_refresh_required?: boolean; daily_outcome?: "win" | "loss" | null; daily_goal_percent?: number | null; daily_goal_usd?: number | null; daily_settled_net_pnl_usd?: number; daily_open_net_pnl_usd?: number; daily_net_pnl_usd?: number; daily_loss_target_usd?: number | null; daily_loss_target_reached?: boolean; daily_goal_reached?: boolean }; auto_activity?: Array<{ timestamp: number; event_type: string; reason?: string; market?: string }>; settings?: Record<string, string>; allocation?: { available_usd: number; manual_available_usd?: number } };
type SyntheticQuote = { market: string; latest: Snapshot["latest"]; ticks: Snapshot["ticks"]; history_available?: boolean; history_stale?: boolean; received_at: number; server_updated_at: number };
type SyntheticSnapshots = Record<string, Snapshot | undefined>;
type SyntheticQuotes = Record<string, SyntheticQuote | undefined>;
type Account = Pick<LiveDashboard, "user" | "wallet" | "bots">;
type Request = (path: string, options?: RequestInit, environment?: "mainnet" | "testnet", timeoutMs?: number) => Promise<Record<string, any>>;
export type SyntheticWorkspaceProps = { account: Account; environment: "mainnet" | "testnet"; marketChart: ComponentType<{ points: Array<{ market?: string; sequence?: number; price: number; timestamp?: number }>; market: string }>; onDashboardPatch: (patch: (current: LiveDashboard | null) => LiveDashboard | null) => void; onNotice: (message: string) => void; request: Request; store: DeskStore };
const markets: Market[] = ["SYN-10", "SYN-25", "SYN-50", "SYN-75", "SYN-100"];
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
const capacityValue = (value: number | undefined, pending: boolean, fallback?: number) => {
  if (pending) return "Checking";
  const amount = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return typeof amount === "number" && Number.isFinite(amount) ? money(amount) : "Updating";
};
const selectSnapshots = (state: DeskState) => state.resources.syntheticSnapshots as SyntheticSnapshots | null;
const selectQuotes = (state: DeskState) => state.resources.syntheticQuotes as SyntheticQuotes | null;
const syntheticResourceKey = (environment: "mainnet" | "testnet", market: string) => environment + ":" + market;

function SyntheticQuoteStatus({ environment, error, market, store }: { environment: "mainnet" | "testnet"; error: boolean; market: string; store: DeskStore }) {
  const quotes = useDeskSelector(store, selectQuotes);
  const quote = quotes?.[syntheticResourceKey(environment, market)];
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const status = syntheticQuoteStatus({ error, market, now, quote });
  const label = status === "reconnecting"
    ? "Feed reconnecting"
    : status === "live"
      ? "LIVE QUOTE · 1s"
      : status === "delayed"
        ? "Quote delayed"
        : "Connecting…";
  return <span className="live-indicator" role="status"><i />{label}</span>;
}

const MemoizedQuoteStatus = memo(SyntheticQuoteStatus);

function SyntheticMarketData({ account, environment, executionLabel, market, marketChart: MarketChart, snapshot, store }: {
  account: Account;
  environment: "mainnet" | "testnet";
  executionLabel: string;
  market: string;
  marketChart: SyntheticWorkspaceProps["marketChart"];
  snapshot: Snapshot;
  store: DeskStore;
}) {
  const quotes = useDeskSelector(store, selectQuotes);
  const quote = quotes?.[syntheticResourceKey(environment, market)];
  const currentQuote = quote?.market === market ? quote : null;
  const MarketChartView = useMemo(() => memo(MarketChart), [MarketChart]);
  const chartTicks = useMemo(() => [
    ...(snapshot.market === market ? snapshot.ticks : []),
    ...(snapshot.market === market && snapshot.latest ? [snapshot.latest] : []),
    ...(currentQuote?.ticks || []),
    ...(currentQuote?.latest ? [currentQuote.latest] : []),
  ], [currentQuote, market, snapshot]);
  const points = useMemo(() => reconcileSyntheticTicks(chartTicks.map((tick) => ({
    market: tick.market || market,
    sequence: Number(tick.sequence),
    price: Number(tick.reference ?? tick.price),
    timestamp: tick.timestamp ?? tick.created_at,
  })), market).slice(-80), [chartTicks, market]);
  const latest = currentQuote?.latest ?? (snapshot.market === market ? snapshot.latest : null);
  const lastTick = Number(latest?.reference ?? latest?.price);
  const syntheticCapital = account.bots.find((bot) => bot.product === "synthetic")?.capital_usd || 0;
  return <>
    <MarketChartView points={points} market={market} />
    <div className="wallet-stat-grid">
      <div><span className="eyebrow">LAST TICK</span><strong>{Number.isFinite(lastTick) && lastTick > 0 ? lastTick.toFixed(5) : "Connecting"}</strong></div>
      <div><span className="eyebrow">UNASSIGNED</span><strong>{money(account.wallet.available)}</strong></div>
      <div><span className="eyebrow">ALLOCATION</span><strong>{money(syntheticCapital)}</strong></div>
      <div><span className="eyebrow">EXECUTION</span><strong>{executionLabel}</strong></div>
    </div>
    {(snapshot.history_stale || currentQuote?.history_stale) ? <p role="status">Chart history is delayed. Showing the last verified ticks and current quote.</p> : (snapshot.history_available === false || currentQuote?.history_available === false) && <p role="status">Chart history is delayed. The latest available quote is shown.</p>}
  </>;
}

const MemoizedSyntheticMarketData = memo(SyntheticMarketData);

function SyntheticSignalList({ signals }: {
  signals: Signal[];
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!signals.length) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [signals.length]);
  const currentSignals = signals.filter((signal) => signal.expires_at * 1000 > now).slice(0, 3);
  return <>
    {currentSignals.map((signal) => <div className="activity-row" key={signal.id}><div className="activity-info"><strong>{signal.market} · {signal.direction} shared signal</strong><small>Auto evaluates eligible signals; no order is guaranteed. Expires in {Math.max(0, Math.ceil((signal.expires_at * 1000 - now) / 1000))}s</small></div></div>)}
    {!currentSignals.length && <p role="status">No current signals. Waiting for the next update.</p>}
  </>;
}

function SyntheticPositionList({ positions, pendingFor, onClose }: {
  positions: Snapshot["positions"];
  pendingFor: (key: string) => boolean;
  onClose: (positionId: string) => void;
}) {
  const openPositions = positions.filter((position) => position.status === "open");
  const hasExpiries = openPositions.some((position) => normaliseManualContractType(position.contract_type) === "fixed" && Number.isFinite(Number(position.contract_expires_at)));
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!hasExpiries) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [hasExpiries]);
  return <>{openPositions.map((position) => {
    const key = "synthetic-position:" + position.id + ":close";
    const expiry = Number(position.contract_expires_at);
    const secondsToExpiry = Number.isFinite(expiry) ? Math.ceil(expiry - now / 1000) : null;
    const expiryStatus = normaliseManualContractType(position.contract_type) === "fixed" && secondsToExpiry !== null ? secondsToExpiry > 0 ? " · scheduled close in " + secondsToExpiry + "s" : " · expiry reached; awaiting settlement" : "";
    return <div className="activity-row" key={position.id}><div className="activity-info"><strong>{position.market} · {position.direction}</strong><small>{liveNetPnlLabel(Number(position.user_net_unrealized_pnl_usd || 0))} · {money(position.margin_usd)} reserved · {position.clearing_type || "PRINCIPAL"}</small><small>Spread {money(position.spread_charged_usd || 0)} · tier fee {money(position.tier_fee_usd || 0)}</small><small className="synthetic-contract-record">{contractTypeLabel(position.contract_type)}{normaliseManualContractType(position.contract_type) === "open_ended" && Number.isFinite(Number(position.maximum_loss_percent)) ? " · max loss " + Number(position.maximum_loss_percent) + "%" : ""}{Number.isFinite(Number(position.manual_stop_loss_percent)) ? " · stop " + Number(position.manual_stop_loss_percent) + "%" : ""}{expiryStatus} · {contractReasonLabel(position.contract_reason)}</small></div><button className="small-action" disabled={pendingFor(key)} onClick={() => onClose(position.id)}>{pendingFor(key) ? "Closing…" : "Close"}</button></div>;
  })}</>;
}

export function SyntheticWorkspace({ account, environment, marketChart: MarketChart, onDashboardPatch, onNotice, request, store }: SyntheticWorkspaceProps) {
  const [market, setMarket] = useState<Market>("SYN-25");
  const marketRef = useRef(market);
  const resourceKey = syntheticResourceKey(environment, market);
  const snapshots = useDeskSelector(store, selectSnapshots);
  const storedSnapshot = snapshots?.[resourceKey] ?? null;
  const fallbackSnapshot = useMemo<Snapshot>(() => ({ market, partial: true, latest: { market }, ticks: [], positions: [], settings: {} }), [market]);
  const snapshot = storedSnapshot?.market === market ? storedSnapshot : fallbackSnapshot;
  const [snapshotCheckedKey, setSnapshotCheckedKey] = useState<string | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [quoteError, setQuoteError] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const pending = useDeskSelector(store, (state) => state.actions);
  const pendingFor = (key: string) => Boolean(pending[key as ActionKey]?.pending);
  const update = useCallback((next: Snapshot | null | ((current: Snapshot | null) => Snapshot | null)) => {
    const storedSnapshots = store.getState().resources.syntheticSnapshots as SyntheticSnapshots | null;
    const allSnapshots = storedSnapshots || {};
    const current = allSnapshots[resourceKey] ?? null;
    const value = typeof next === "function" ? (next as (current: Snapshot | null) => Snapshot | null)(current ?? fallbackSnapshot) : next;
    const updatedSnapshots = { ...allSnapshots };
    if (value) updatedSnapshots[resourceKey] = value;
    else delete updatedSnapshots[resourceKey];
    store.applyResource("syntheticSnapshots", updatedSnapshots);
  }, [fallbackSnapshot, resourceKey, store]);
  useEffect(() => { setQuoteError(false); }, [environment, market]);
  useResourcePoller<Snapshot>(async (_token, signal) => {
    try {
      return await request("/v1/synthetic/" + market + "?view=trading", { signal }, environment) as Snapshot;
    }
    catch (error) {
      if (signal.aborted) throw error;
      logDeskFailure("synthetic.snapshot", error);
      if (marketRef.current === market) {
        setSnapshotCheckedKey(resourceKey);
      }
      return undefined;
    }
  }, (next) => {
    if (next.market !== marketRef.current) return;
    setSnapshotCheckedKey(resourceKey);
    update(next);
  }, 5000, true, `synthetic:${environment}:${market}`, (error) => logDeskFailure("synthetic.snapshot", error), "Synthetic");
  useResourcePoller<Signal[]>(async (_token, signal) => {
    const result = await request("/v1/synthetic/signals?market=" + market + "&limit=10", { signal });
    return (result.signals || []) as Signal[];
  }, (next) => {
    if (market !== marketRef.current) return;
    setSignals((current) => current.length === next.length && current.every((signal, index) => {
      const updated = next[index];
      return signal.id === updated.id && signal.market === updated.market && signal.direction === updated.direction
        && signal.reference_price === updated.reference_price && signal.expires_at === updated.expires_at;
    }) ? current : next);
  }, 2000, true, `synthetic-signals:${environment}:${market}`, (error) => logDeskFailure("synthetic.signals", error), "Synthetic");
  useResourcePoller<Record<string, unknown>>(async (_token, signal) => {
    return await request("/v1/synthetic/stream?market=" + market + "&include_history=1", { signal }, environment);
  }, (stream) => {
    if (market !== marketRef.current) return;
    const latest = stream.latest as Snapshot["latest"];
    const price = Number(latest?.reference ?? latest?.price);
    if ((latest?.market && latest.market !== market) || !Number.isFinite(price) || price <= 0 || !Number.isInteger(Number(latest?.sequence))) {
      setQuoteError(true);
      return;
    }
    setQuoteError(false);
    const storedQuotes = store.getState().resources.syntheticQuotes as SyntheticQuotes | null;
    store.applyResource("syntheticQuotes", {
      ...(storedQuotes || {}),
      [resourceKey]: {
        market,
        latest,
        ticks: Array.isArray(stream.ticks) ? stream.ticks : [],
        history_available: typeof stream.history_available === "boolean" ? stream.history_available : undefined,
        history_stale: stream.history_stale === true,
        received_at: Date.now(),
        server_updated_at: Number(stream.updated_at),
      } satisfies SyntheticQuote,
    });
  }, 1000, true, `synthetic-quotes:${environment}:${market}`, (error) => {
    logDeskFailure("synthetic.quotes", error);
    setQuoteError(true);
  }, "Synthetic");
  const actionKey = (path: string, payload: Record<string, unknown>) => {
    const position = path.match(/^\/v1\/synthetic\/positions\/([^/]+)\/close$/); const bot = path.match(/^\/v1\/bots\/(\d+)\/actions$/);
    if (path === "/v1/synthetic/actions") return ("synthetic-testnet:" + String(payload.action || "action")) as ActionKey;
    if (position) return ("synthetic-position:" + position[1] + ":close") as ActionKey;
    if (bot) return ("bot:" + bot[1] + ":" + String(payload.action || "action")) as ActionKey;
    return (path + ":action") as ActionKey;
  };
  const act = async (path: string, payload: Record<string, unknown>) => {
    const key = actionKey(path, payload); if (pendingFor(key)) return false;
    // These actions are attached to the engine's durable 30-second execution
    // window. Keep the browser attached long enough to receive that outcome
    // instead of aborting at the generic 15-second desk timeout.
    const durableAction = /^\/v1\/synthetic\/positions\/[^/]+\/close$/.test(path);
    const actionLabel = durableAction ? "Submitting close request…" : null;
    if (actionLabel) onNotice(actionLabel);
    try {
      const response = await store.runAction(key, () => request(path, { method: "POST", body: JSON.stringify(payload) }, environment, durableAction ? 40_000 : undefined));
      if (response.position) update((current) => current ? { ...current, positions: [response.position, ...current.positions.filter((item) => item.id !== response.position.id)] } : current);
      const bot = path.match(/^\/v1\/bots\/(\d+)\/actions$/);
      if (bot && payload.action === "topup") onDashboardPatch((current) => current ? { ...current, wallet: response.wallet ? { ...current.wallet, ...response.wallet } : current.wallet, bots: current.bots.map((item) => item.id === bot[1] ? { ...item, ...(response.bot || {}) } : item) } : current);
      onNotice(response.message || "Your changes were saved."); return true;
    } catch (error) {
      logDeskFailure("synthetic.action", error);
      throw error;
    }
  };
  const syntheticBot = account.bots.find((bot) => bot.product === "synthetic");
  const syntheticAutoOn = syntheticBot?.state === "running" && Number(syntheticBot.capital_usd || 0) > 0;
  const executionStatus = syntheticBot?.state === "paused" ? "Paused" : syntheticAutoOn ? "Auto on" : "Waiting for funding";
  const executionLabel = syntheticBot?.state === "paused" ? "PAUSED" : syntheticAutoOn ? "AUTO" : "WAITING";
  const snapshotPending = snapshot.partial && snapshotCheckedKey !== resourceKey;
  const dailyGoalUsd = snapshot.execution?.daily_goal_usd;
  const dailyNetUsd = Number(snapshot.execution?.daily_net_pnl_usd || 0);
  const dailyTargetLabel = snapshot.execution?.daily_outcome === "loss"
    ? `${money(-Number(snapshot.execution?.daily_loss_target_usd || 0))} loss limit`
    : `${money(Number(dailyGoalUsd || 0))} goal`;
  const dailyExecutionPause = !snapshot.partial && snapshot.execution?.daily_loss_target_reached
    ? "Auto entries are paused for today because the protective daily loss limit was reached."
    : !snapshot.partial && snapshot.execution?.daily_goal_reached
      ? "Today's Auto goal is reached. New entries are paused until the next session."
      : "";
  return <DeskLocalized><div className="desk-screen"><div className="gradient-panel synthetic-pilot">
    <div className="synthetic-market-header">
      <div><h2>Market</h2><MemoizedQuoteStatus environment={environment} error={quoteError} market={market} store={store} /></div>
      <button type="button" className="small-action synthetic-help-link" onClick={() => setHelpOpen(true)}>How quotes work</button>
    </div>
    <div className="segment-control synthetic-market-rail" role="group" aria-label="Synthetic markets">
      {markets.map((item) => <button key={item} className={market === item ? "active" : ""} aria-pressed={market === item} onClick={() => { if (item !== market) { setSignals([]); marketRef.current = item; setMarket(item); } }}>{item}</button>)}
    </div>
    {environment === "testnet" && account.user.is_admin && <p className="synthetic-environment-note">Admin test environment · Virtual funds only.</p>}
    <div id="synthetic-market-snapshot" aria-label={market + " market snapshot"}>
      <MemoizedSyntheticMarketData account={account} environment={environment} executionLabel={executionLabel} market={market} marketChart={MarketChart} snapshot={snapshot} store={store} />
      {environment === "mainnet" ? <>
        <section className="synthetic-auto-panel" aria-labelledby="synthetic-auto-title">
          <div className="synthetic-auto-heading">
            <div className="synthetic-auto-title"><h3 id="synthetic-auto-title">Automatic execution</h3><p>Auto evaluates shared signals using 100% of your funded Synthetic allocation. One scheduled position opens at a time; top-ups are included automatically.</p></div>
            <div className="synthetic-auto-state" role="status" aria-live="polite" aria-atomic="true"><span className={"status-chip " + (syntheticAutoOn ? "running" : "paused")}><i />{executionStatus}</span></div>
          </div>
          <div className="synthetic-auto-capacity" aria-label="Automatic allocation and available margin"><span>Auto allocation <b>{capacityValue(snapshot.execution?.auto_allocation_usd, snapshotPending, Number(syntheticBot?.capital_usd))}</b></span><span>Auto available <b>{capacityValue(snapshot.execution?.auto_available_usd, snapshotPending)}</b></span><span>Auto locked margin <b>{capacityValue(snapshot.execution?.auto_locked_usd, snapshotPending)}</b></span></div>
          {syntheticAutoOn && typeof dailyGoalUsd === "number" && Number.isFinite(dailyGoalUsd) && <p className="synthetic-auto-hint" role="status">
            Daily Auto progress: {money(dailyNetUsd)} net ({money(Number(snapshot.execution?.daily_settled_net_pnl_usd || 0))} settled + {money(Number(snapshot.execution?.daily_open_net_pnl_usd || 0))} live) of {dailyTargetLabel}.
          </p>}
          {syntheticAutoOn && dailyExecutionPause && <p className="synthetic-auto-hint" role="status">{dailyExecutionPause}</p>}
        </section>
        <SyntheticSignalList signals={signals} />
      </> : account.user.is_admin ? <div className="button-row"><button className="small-action" onClick={() => void act("/v1/synthetic/actions", { action: "open", market, direction: "long", amount: 20 }).catch(() => undefined)}>Open $20 long</button><button className="small-action" onClick={() => void act("/v1/synthetic/actions", { action: "open", market, direction: "short", amount: 20 }).catch(() => undefined)}>Open $20 short</button><button className="danger-action" onClick={() => void act("/v1/synthetic/actions", { action: "reset" }).catch(() => undefined)}>Reset virtual balance</button></div> : <p>Testnet is reserved for administrator testing. Switch to mainnet for live synthetic access.</p>}
      <SyntheticPositionList positions={snapshot.positions} pendingFor={pendingFor} onClose={(positionId) => void act("/v1/synthetic/positions/" + positionId + "/close", {}).catch(() => undefined)} />
      {account.user.is_admin && snapshot.positions_stale && <p role="status">Position data is delayed; recent positions may be stale or unavailable. Open and close requests are checked against the current server state.</p>}
    </div>
  </div>
  {helpOpen && <AccessibleDialog label="How Synthetic quotes work" onClose={() => setHelpOpen(false)}><span className="eyebrow">SYNTHETIC QUOTES</span><h2>How quotes work</h2><p>Each index uses TradeMemo’s shared model feed. The displayed reference updates about once a second; it is not an external spot-market price.</p><div className="fact-block"><span>ORDER PRICE <b>Checked again at execution</b></span><span>SPREAD <b>Shown before review</b></span><span>TIER FEE <b>Applied at execution</b></span></div><p>A stale or unavailable quote prevents a new order. Existing positions remain unchanged until a valid close can be priced.</p><button type="button" className="primary-action" onClick={() => setHelpOpen(false)}>Back to market</button></AccessibleDialog>}
  </div></DeskLocalized>;
}
