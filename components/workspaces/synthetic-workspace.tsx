"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { AccessibleDialog } from "../accessible-dialog";
import { DeskLocalized } from "../desk-language";
import { ActionFeedback } from "../ui/action-feedback";
import { useDeskSelector, type DeskStore } from "../../lib/desk-store";
import type { ActionKey, DeskState } from "../../lib/desk-types";
import type { LiveDashboard } from "../tradepulse-shell";
import { reconcileSyntheticTicks } from "../../lib/synthetic-ticks";
import { contractReasonLabel, contractTypeLabel, normaliseManualContractType } from "../../lib/synthetic-contract-terms";
import { liveNetPnlLabel } from "../../lib/synthetic-position-pnl";
import { syntheticQuoteStatus } from "../../lib/synthetic-quote-status";
import { useResourcePoller } from "./use-resource-poller";

type Market = "SYN-10" | "SYN-25" | "SYN-50" | "SYN-75" | "SYN-100";
type Signal = { id: string; market: string; direction: string; reference_price: number; expires_at: number };
type Snapshot = { market: string; partial?: boolean; history_available?: boolean; history_stale?: boolean; positions_stale?: boolean; latest: { market?: string; price?: number; reference?: number; sequence?: number; timestamp?: number; created_at?: number }; ticks: Array<{ market?: string; sequence?: number; price?: number; reference?: number; timestamp?: number; created_at?: number }>; positions: Array<{ id: string; market: string; direction: string; margin_usd: number; status: string; clearing_type?: string; spread_charged_usd?: number; tier_fee_usd?: number; user_net_unrealized_pnl_usd?: number; signal_id?: string; contract_type?: string; contract_expires_at?: number; maximum_loss_percent?: number; manual_stop_loss_percent?: number; contract_reason?: string }>; live_disclosure_accepted?: boolean; execution_mode?: "MANUAL" | "AUTO"; execution?: { auto_allocation_usd?: number; auto_available_usd?: number; auto_locked_usd?: number; manual_available_usd?: number; auto_margin_usd?: number; capacity_refresh_required?: boolean; daily_outcome?: "win" | "loss" | null; daily_goal_percent?: number | null; daily_goal_usd?: number | null; daily_settled_net_pnl_usd?: number; daily_open_net_pnl_usd?: number; daily_net_pnl_usd?: number; daily_loss_target_usd?: number | null; daily_loss_target_reached?: boolean; daily_goal_reached?: boolean }; auto_activity?: Array<{ timestamp: number; event_type: string; reason?: string; market?: string }>; settings?: Record<string, string>; allocation?: { available_usd: number; manual_available_usd?: number } };
type SyntheticQuote = { market: string; latest: Snapshot["latest"]; ticks: Snapshot["ticks"]; history_available?: boolean; history_stale?: boolean; received_at: number; server_updated_at: number };
type SyntheticSnapshots = Record<string, Snapshot | undefined>;
type SyntheticQuotes = Record<string, SyntheticQuote | undefined>;
type Account = Pick<LiveDashboard, "user" | "wallet" | "bots">;
type Request = (path: string, options?: RequestInit, environment?: "mainnet" | "testnet", timeoutMs?: number) => Promise<Record<string, any>>;
type Review = { kind: "auto"; path: string; payload: Record<string, unknown>; amount: number; market: string; direction: string; fee: number | null };

export type SyntheticWorkspaceProps = { account: Account; environment: "mainnet" | "testnet"; marketChart: ComponentType<{ points: Array<{ market?: string; sequence?: number; price: number; timestamp?: number }>; market: string }>; onDashboardPatch: (patch: (current: LiveDashboard | null) => LiveDashboard | null) => void; onNotice: (message: string) => void; request: Request; store: DeskStore };
const markets: Market[] = ["SYN-10", "SYN-25", "SYN-50", "SYN-75", "SYN-100"];
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
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

function SyntheticSignalList({ signals, signalError }: {
  signals: Signal[];
  signalError: string;
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
    {signalError ? <p role="status">{signalError}</p> : !currentSignals.length && <p role="status">No current signals. Waiting for the next update.</p>}
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
  const [autoAmount, setAutoAmount] = useState("");
  const [autoAllocation, setAutoAllocation] = useState("");
  const [signals, setSignals] = useState<Signal[]>([]);
  const [signalError, setSignalError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [quoteError, setQuoteError] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [reviewError, setReviewError] = useState("");
  const reviewSubmitting = useRef<string | null>(null);
  const [autoAcknowledged, setAutoAcknowledged] = useState(false);
  const [executionTransition, setExecutionTransition] = useState<"MANUAL" | "AUTO" | null>(null);
  const [executionCapacityRefreshing, setExecutionCapacityRefreshing] = useState(false);
  const executionSubmitting = useRef(false);
  const executionRevision = useRef(0);
  const confirmedMode = useRef<{ revision: number; mode: "MANUAL" | "AUTO" } | null>(null);
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
  useEffect(() => { setReview(null); setReviewError(""); setQuoteError(false); }, [environment, market]);
  useEffect(() => { if (snapshot && !snapshot.partial) { setAutoAmount((current) => current || String(Number(snapshot.execution?.auto_margin_usd || 20))); setAutoAllocation((current) => current || String(Number(snapshot.execution?.auto_allocation_usd || 0))); } }, [snapshot]);
  useResourcePoller<Snapshot>(async (_token, signal) => {
    try { return await request("/v1/synthetic/" + market + "?view=trading", { signal }, environment) as Snapshot; }
    catch (error) {
      if (signal.aborted) throw error;
      setLoadError(error instanceof Error ? error.message : "Market data is temporarily unavailable.");
      return undefined;
    }
  }, (next) => {
    if (next.market !== marketRef.current) return;
    const confirmed = confirmedMode.current;
    const mode = confirmed && confirmed.revision >= executionRevision.current ? confirmed.mode : undefined;
    setLoadError("");
    if (environment === "mainnet" && !next.partial && next.execution_mode === "MANUAL" && executionCapacityRefreshing) setExecutionCapacityRefreshing(false);
    update({ ...next, ...(mode && executionSubmitting.current ? { execution_mode: mode } : {}) });
  }, 5000, true, `synthetic:${environment}:${market}`, (error) => {
    setLoadError(error instanceof Error ? error.message : "Market data is temporarily unavailable.");
  });
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
    setSignalError("");
  }, 2000, true, `synthetic-signals:${environment}:${market}`, () => {
    setSignalError("Signal updates are delayed. Reconnecting…");
  });
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
  }, 1000, true, `synthetic-quotes:${environment}:${market}`, () => setQuoteError(true));
  const actionKey = (path: string, payload: Record<string, unknown>) => {
    const position = path.match(/^\/v1\/synthetic\/positions\/([^/]+)\/close$/); const bot = path.match(/^\/v1\/bots\/(\d+)\/actions$/);
    if (path === "/v1/synthetic/actions") return ("synthetic-testnet:" + String(payload.action || "action")) as ActionKey;
    if (position) return ("synthetic-position:" + position[1] + ":close") as ActionKey;
    if (bot) return ("bot:" + bot[1] + ":" + String(payload.action || "action")) as ActionKey;
    if (path.includes("execution-mode")) return ("execution:" + String(payload.execution_mode || "execution-mode").toLowerCase()) as ActionKey;
    return (path.includes("disclosure") ? "disclosure:accept" : path + ":action") as ActionKey;
  };
  const reviewActionKey = review ? actionKey(review.path, review.payload) : null;
  const activeReviewActionPending = Boolean(reviewActionKey && pendingFor(reviewActionKey));
  const act = async (path: string, payload: Record<string, unknown>) => {
    const key = actionKey(path, payload); if (pendingFor(key)) return false;
    const changesExecutionMode = path === "/v1/synthetic/settings/execution-mode";
    // These actions are attached to the engine's durable 30-second execution
    // window. Keep the browser attached long enough to receive that outcome
    // instead of aborting at the generic 15-second desk timeout.
    const durableAction = /^\/v1\/synthetic\/positions\/[^/]+\/close$/.test(path);
    if (changesExecutionMode && executionSubmitting.current) return false;
    if (changesExecutionMode) { executionSubmitting.current = true; executionRevision.current += 1; setExecutionTransition(payload.execution_mode === "AUTO" ? "AUTO" : "MANUAL"); }
    const actionLabel = /^\/v1\/synthetic\/positions\/[^/]+\/close$/.test(path) ? "Submitting close request…" : changesExecutionMode ? payload.execution_mode === "AUTO" ? "Enabling Auto…" : "Turning Auto off…" : null;
    if (actionLabel) onNotice(actionLabel);
    try {
      const response = await store.runAction(key, () => request(path, { method: "POST", body: JSON.stringify(payload) }, environment, durableAction ? 40_000 : undefined));
      if (changesExecutionMode && (response.execution_mode === "MANUAL" || response.execution_mode === "AUTO")) confirmedMode.current = { revision: executionRevision.current, mode: response.execution_mode };
      if (response.position) update((current) => current ? { ...current, positions: [response.position, ...current.positions.filter((item) => item.id !== response.position.id)] } : current);
      if (path === "/v1/synthetic/disclosure" && response.accepted) update((current) => current ? { ...current, live_disclosure_accepted: true } : current);
      if (path === "/v1/synthetic/settings/execution-mode" && response.execution_mode) {
        update((current) => current ? { ...current, execution_mode: response.execution_mode, execution: { ...current.execution, ...response } } : current);
        if (response.execution_mode === "MANUAL" && response.capacity_refresh_required) {
          setAutoAllocation(String(Number(response.auto_allocation_usd || 0)));
          setExecutionCapacityRefreshing(true);
        } else {
          setExecutionCapacityRefreshing(false);
        }
        setExecutionTransition(null);
      }
      const bot = path.match(/^\/v1\/bots\/(\d+)\/actions$/);
      if (bot && payload.action === "topup") onDashboardPatch((current) => current ? { ...current, wallet: response.wallet ? { ...current.wallet, ...response.wallet } : current.wallet, bots: current.bots.map((item) => item.id === bot[1] ? { ...item, ...(response.bot || {}) } : item) } : current);
      onNotice(response.message || "Your changes were saved."); return true;
    } catch (error) { if (changesExecutionMode) setExecutionTransition(null);     const message = error instanceof Error ? error.message : "TradeMemo could not complete this action. Review your choices and try again."; onNotice(message); throw error; }
    finally { if (changesExecutionMode) { executionSubmitting.current = false; executionRevision.current += 1; } }
  };
  const openReview = () => {
    if (environment !== "mainnet") return;
    const value = Number(autoAmount), reserved = Number(autoAllocation);
    if (!Number.isFinite(value) || value < 20) return onNotice("Set an order size of at least $20.00.");
    if (!Number.isFinite(reserved) || reserved < value) return onNotice("Auto capacity must cover at least one Auto order.");
    const path = "/v1/synthetic/settings/execution-mode";
    const payload = { execution_mode: "AUTO", auto_margin_usd: value, auto_allocation_usd: reserved };
    const fee = snapshot.partial ? null : value * Number(snapshot.settings?.["fee_bps_" + account.user.tier.toLowerCase()] || 20) / 10000;
    setAutoAcknowledged(false); setReviewError(""); setReview({ kind: "auto", path, payload, amount: value, market, direction: "auto", fee });
  };
  const confirm = async () => {
    if (!review) return;
    const submission = review;
    const key = actionKey(submission.path, submission.payload);
    if (reviewSubmitting.current === key || pendingFor(key)) return;
    if (!autoAcknowledged) { setReviewError("Review and acknowledge the Auto allocation before continuing."); return; }
    reviewSubmitting.current = key; setReviewError("");
    try { const submitted = await act(submission.path, submission.payload); if (submitted) setReview(null); } catch (error) { const message = error instanceof Error ? error.message : "TradeMemo could not submit this request. Review it and try again."; setReviewError(message); } finally { if (reviewSubmitting.current === key) reviewSubmitting.current = null; }
  };
  const manualKey = "execution:manual";
  const autoKey = "execution:auto";
  const confirmedAuto = snapshot.execution_mode === "AUTO";
  const executionStatus = executionTransition === "AUTO" ? "Enabling Auto…" : executionTransition === "MANUAL" ? "Turning Auto off…" : snapshot.partial && !snapshot.execution_mode ? "Checking" : confirmedAuto ? "Auto on" : "Auto off";
  const executionLabel = executionTransition === "AUTO" ? "ENABLING AUTO" : executionTransition === "MANUAL" ? "TURNING AUTO OFF" : snapshot.partial && !snapshot.execution_mode ? "CHECKING" : confirmedAuto ? "AUTO" : "AUTO OFF";
  const dailyGoalUsd = snapshot.execution?.daily_goal_usd;
  const dailyNetUsd = Number(snapshot.execution?.daily_net_pnl_usd || 0);
  const dailyTargetLabel = snapshot.execution?.daily_outcome === "loss"
    ? `${money(-Number(snapshot.execution?.daily_loss_target_usd || 0))} loss limit`
    : `${money(Number(dailyGoalUsd || 0))} goal`;
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
      {loadError && <p role="status">{loadError} Action requests are checked against the current server state.</p>}
      {!snapshot.live_disclosure_accepted && environment === "mainnet" && <section className="announcements synthetic-risk-notice" aria-labelledby="synthetic-risk-title"><div className="synthetic-risk-copy"><span className="eyebrow">LIVE-RISK ACKNOWLEDGEMENT</span><strong id="synthetic-risk-title">Required before wallet-funded Synthetic trading or Auto.</strong><p>Orders reserve wallet funds at 1:1 margin. Price movement can lose the full reserved amount; spread and tier fees apply. Auto may place wallet-funded orders up to the amount you approve.</p></div><button className="primary-action" disabled={pendingFor("disclosure:accept")} onClick={() => void act("/v1/synthetic/disclosure", {}).catch(() => undefined)}>{pendingFor("disclosure:accept") ? "Saving…" : "Review & accept"}</button></section>}
      {environment === "mainnet" ? <>
        <section className="synthetic-auto-panel" aria-labelledby="synthetic-auto-title" aria-busy={Boolean(executionTransition)}>
          <div className="synthetic-auto-heading">
            <div className="synthetic-auto-title"><h3 id="synthetic-auto-title">Automatic execution</h3><p>Auto evaluates shared signals for your account using its assigned allocation. Set the per-order margin and total allocation; enabling requires review.</p></div>
            <div className="synthetic-auto-state" role="status" aria-live="polite" aria-atomic="true" aria-busy={Boolean(executionTransition)}><span className={"status-chip " + (executionTransition ? "paused" : confirmedAuto ? "running" : "paused")}><i />{executionStatus}</span></div>
          </div>
          <div className="synthetic-auto-fields">
            <label className="amount-field">Auto amount per order<input value={autoAmount} onChange={(event) => setAutoAmount(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" aria-label="Automatic Synthetic order size" /></label>
            <label className="amount-field">Set aside for Auto<input value={autoAllocation} onChange={(event) => setAutoAllocation(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" aria-label="Automatic Synthetic allocation" /></label>
          </div>
          <div className="synthetic-auto-capacity" aria-label="Automatic and unassigned available capacity"><span>Auto available <b>{snapshot.partial ? "Checking" : executionCapacityRefreshing ? "Updating…" : money(Number(snapshot.execution?.auto_available_usd || 0))}</b></span><span>Auto locked margin <b>{snapshot.partial ? "Checking" : executionCapacityRefreshing ? "Updating…" : money(Number(snapshot.execution?.auto_locked_usd || 0))}</b></span><span>Unassigned Synthetic capacity <b>{snapshot.partial ? "Checking" : executionCapacityRefreshing ? "Updating…" : money(Number(snapshot.execution?.manual_available_usd || snapshot.allocation?.available_usd || 0))}</b></span></div>
          {executionCapacityRefreshing && <p className="synthetic-auto-hint" role="status">Capacity is refreshing. New orders are checked against current funding before submission.</p>}
          {Number(autoAllocation) < Number(autoAmount) && <p className="synthetic-auto-hint" role="status">Set aside at least {money(Math.max(20, Number(autoAmount) || 20))} for one Auto order. The remaining Synthetic capacity will not be used by Auto.</p>}
          {confirmedAuto && typeof dailyGoalUsd === "number" && Number.isFinite(dailyGoalUsd) && <p className="synthetic-auto-hint" role="status">
            Daily Auto progress: {money(dailyNetUsd)} net ({money(Number(snapshot.execution?.daily_settled_net_pnl_usd || 0))} settled + {money(Number(snapshot.execution?.daily_open_net_pnl_usd || 0))} live) of {dailyTargetLabel}.
          </p>}
          <div className="synthetic-auto-actions">
            <button className="primary-action" disabled={pendingFor(autoKey) || Boolean(executionTransition) || Number(autoAmount) < 20 || Number(autoAllocation) < Number(autoAmount)} onClick={() => openReview()}>{executionTransition === "AUTO" ? "Enabling Auto…" : confirmedAuto ? "Review Auto changes" : "Review & enable Auto"}</button>
            {(confirmedAuto || snapshot.partial) && <button className="small-action" disabled={pendingFor(manualKey) || Boolean(executionTransition)} onClick={() => void act("/v1/synthetic/settings/execution-mode", { execution_mode: "MANUAL" }).catch(() => undefined)}>{executionTransition === "MANUAL" ? "Turning Auto off…" : pendingFor(manualKey) ? "Saving…" : "Turn Auto off"}</button>}
          </div>
        </section>
        <SyntheticSignalList signals={signals} signalError={signalError} />
      </> : account.user.is_admin ? <div className="button-row"><button className="small-action" onClick={() => void act("/v1/synthetic/actions", { action: "open", market, direction: "long", amount: 20 }).catch(() => undefined)}>Open $20 long</button><button className="small-action" onClick={() => void act("/v1/synthetic/actions", { action: "open", market, direction: "short", amount: 20 }).catch(() => undefined)}>Open $20 short</button><button className="danger-action" onClick={() => void act("/v1/synthetic/actions", { action: "reset" }).catch(() => undefined)}>Reset virtual balance</button></div> : <p>Testnet is reserved for administrator testing. Switch to mainnet for live synthetic access.</p>}
      <SyntheticPositionList positions={snapshot.positions} pendingFor={pendingFor} onClose={(positionId) => void act("/v1/synthetic/positions/" + positionId + "/close", {}).catch(() => undefined)} />
      {snapshot.positions_stale && <p role="status">Position data is delayed; recent positions may be stale or unavailable. Open and close requests are checked against the current server state.</p>}
    </div>
  </div>
  {helpOpen && <AccessibleDialog label="How Synthetic quotes work" onClose={() => setHelpOpen(false)}><span className="eyebrow">SYNTHETIC QUOTES</span><h2>How quotes work</h2><p>Each index uses TradeMemo’s shared model feed. The displayed reference updates about once a second; it is not an external spot-market price.</p><div className="fact-block"><span>ORDER PRICE <b>Checked again at execution</b></span><span>SPREAD <b>Shown before review</b></span><span>TIER FEE <b>Applied at execution</b></span></div><p>A stale or unavailable quote prevents a new order. Existing positions remain unchanged until a valid close can be priced.</p><button type="button" className="primary-action" onClick={() => setHelpOpen(false)}>Back to market</button></AccessibleDialog>}
  {review && <AccessibleDialog label={review.kind === "auto" ? "Review automatic execution" : "Review synthetic order"} onClose={() => setReview(null)}>
    <span className="eyebrow">MAINNET / FINAL REVIEW</span>
    <h2>Enable automatic execution?</h2>
    <div className="fact-block">
      <span>EXECUTION <b>AUTO</b></span>
      <span>MARGIN PER AUTO ORDER <b>{money(review.amount)}</b></span>
      <span>AUTO CAPACITY <b>{money(Number((review.payload as { auto_allocation_usd?: number }).auto_allocation_usd || 0))}</b></span>
      <span>ESTIMATED TIER FEE <b>{review.fee === null ? "Calculated at execution" : money(review.fee)}</b></span>
    </div>
    <p>Auto evaluates eligible shared signals using the settings above. You can lose the full reserved margin; returns are not guaranteed.</p>
    <label className="toggle-row"><span>I understand Auto uses only the stated allocation and margin per order; the remaining Synthetic capacity is not auto-traded.</span><input type="checkbox" checked={autoAcknowledged} disabled={activeReviewActionPending} onChange={(event) => setAutoAcknowledged(event.target.checked)} /><i aria-hidden="true" /></label>
    {reviewError && <p role="alert">{reviewError}</p>}
    {review.kind === "auto" && activeReviewActionPending && <p role="status">Saving the Auto setting. The state changes to on only after the server confirms the allocation.</p>}
    <button className="primary-action" disabled={activeReviewActionPending || (review.kind === "auto" && !autoAcknowledged)} onClick={() => void confirm()}>
      <ActionFeedback state={activeReviewActionPending ? "pending" : reviewError ? "error" : "idle"}>{activeReviewActionPending ? "Saving Auto setting…" : "Confirm Auto execution"}</ActionFeedback>
    </button>
    {activeReviewActionPending && <p role="status">The request is being submitted. You can return to the controls without cancelling it; the result will appear here.</p>}
    <button type="button" className="ghost-action" onClick={() => setReview(null)}>{activeReviewActionPending ? "Return to controls" : "Go back"}</button>
  </AccessibleDialog>}
  </div></DeskLocalized>;
}
