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
import { formatSettlementExitReason } from "../../lib/settlement-label";
import { logDeskFailure } from "../../lib/desk-api";
import { useResourcePoller } from "./use-resource-poller";
import { ChevronRight, ProductPnlSummary, type ProductPnlSummaryData } from "./shared-ui";

type Market = "SYN-10" | "SYN-25" | "SYN-50" | "SYN-75" | "SYN-100";
type Signal = { id: string; market: string; direction: string; reference_price: number; expires_at: number };
type Snapshot = { market: string; partial?: boolean; history_available?: boolean; history_stale?: boolean; positions_stale?: boolean; latest: { market?: string; price?: number; reference?: number; sequence?: number; timestamp?: number; created_at?: number }; ticks: Array<{ market?: string; sequence?: number; price?: number; reference?: number; timestamp?: number; created_at?: number }>; positions: Array<{ id: string; market: string; direction: string; margin_usd: number; status: string; clearing_type?: string; spread_charged_usd?: number; tier_fee_usd?: number; user_net_unrealized_pnl_usd?: number; signal_id?: string; contract_type?: string; contract_expires_at?: number; maximum_loss_percent?: number; manual_stop_loss_percent?: number; contract_reason?: string }>; execution?: { auto_allocation_usd?: number; auto_available_usd?: number; auto_locked_usd?: number; manual_available_usd?: number; auto_margin_usd?: number; capacity_refresh_required?: boolean; daily_outcome?: "win" | "loss" | null; daily_goal_percent?: number | null; daily_goal_usd?: number | null; daily_settled_net_pnl_usd?: number; daily_open_net_pnl_usd?: number; daily_net_pnl_usd?: number; daily_loss_target_usd?: number | null; daily_loss_target_reached?: boolean; daily_goal_reached?: boolean }; auto_activity?: Array<{ timestamp: number; event_type: string; reason?: string; market?: string }>; settings?: Record<string, string>; allocation?: { available_usd: number; manual_available_usd?: number } };
type SyntheticQuote = { market: string; latest: Snapshot["latest"]; ticks: Snapshot["ticks"]; history_available?: boolean; history_stale?: boolean; received_at: number; server_updated_at: number };
type SyntheticSnapshots = Record<string, Snapshot | undefined>;
type SyntheticQuotes = Record<string, SyntheticQuote | undefined>;
type Account = Pick<LiveDashboard, "user" | "wallet" | "bots" | "ledger" | "memecoin" | "synthetic">;
type Request = (path: string, options?: RequestInit, environment?: "mainnet" | "testnet", timeoutMs?: number) => Promise<Record<string, any>>;
export type SyntheticWorkspaceProps = { account: Account; environment: "mainnet" | "testnet"; marketChart: ComponentType<{ points: Array<{ market?: string; sequence?: number; price: number; timestamp?: number }>; market: string }>; onDashboardPatch: (patch: (current: LiveDashboard | null) => LiveDashboard | null) => void; onNotice: (message: string) => void; onPickStrategy: () => void; request: Request; store: DeskStore };
const markets: Market[] = ["SYN-10", "SYN-25", "SYN-50", "SYN-75", "SYN-100"];
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
const signedMoney = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${money(Math.abs(value))}`;
const capacityValue = (value: number | undefined, pending: boolean, fallback?: number) => {
  if (pending) return "Checking";
  const amount = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return typeof amount === "number" && Number.isFinite(amount) ? money(amount) : "Unavailable";
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
      ? "SIM FEED · 1s"
      : status === "delayed"
        ? "Quote delayed"
        : "Connecting…";
  return <span className="live-indicator" role="status"><i />{label}</span>;
}

const MemoizedQuoteStatus = memo(SyntheticQuoteStatus);

function SyntheticMarketData({ account, environment, executionLabel, market, marketChart: MarketChart, snapshot, store, syntheticAutoOn }: {
  account: Account;
  environment: "mainnet" | "testnet";
  executionLabel: string;
  market: string;
  marketChart: SyntheticWorkspaceProps["marketChart"];
  snapshot: Snapshot;
  store: DeskStore;
  syntheticAutoOn: boolean;
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
    <div className="wallet-stat-grid synthetic-market-stats">
      <div><span className="eyebrow">LAST TICK</span><strong>{Number.isFinite(lastTick) && lastTick > 0 ? lastTick.toFixed(5) : "Connecting"}</strong></div>
      <div><span className="eyebrow">UNASSIGNED</span><strong>{money(account.wallet.available)}</strong></div>
      <div><span className="eyebrow">ALLOCATION</span><strong>{money(syntheticCapital)}</strong></div>
      <div><span className="eyebrow">EXECUTION</span><strong className={`synthetic-execution-value ${syntheticAutoOn ? "is-running" : ""}`}>{executionLabel}</strong></div>
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
  return <section className="synthetic-signal-section" aria-labelledby="synthetic-signals-title">
    <div className="synthetic-section-heading"><h3 id="synthetic-signals-title">Current signals</h3><span>Auto feed</span></div>
    {currentSignals.map((signal) => <div className="activity-row" key={signal.id}><div className="activity-info"><strong>{signal.market} · {signal.direction} shared signal</strong><small>Auto evaluates eligible signals; no order is guaranteed. Expires in {Math.max(0, Math.ceil((signal.expires_at * 1000 - now) / 1000))}s</small></div></div>)}
    {!currentSignals.length && <p className="synthetic-empty-state" role="status">No current signals. Waiting for the next update.</p>}
  </section>;
}

function SyntheticPositionList({ positions, pending, pendingFor, onClose }: {
  positions: Snapshot["positions"];
  pending: boolean;
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
  return <section className="synthetic-position-section" aria-labelledby="synthetic-positions-title">
    <div className="synthetic-section-heading"><h3 id="synthetic-positions-title">Open positions</h3><span>{pending ? "Updating" : `${openPositions.length} open`}</span></div>
    {!openPositions.length
      ? <p className="synthetic-empty-state" role="status">{pending ? "Checking open positions…" : "No open positions right now."}</p>
      : openPositions.map((position) => {
        const key = "synthetic-position:" + position.id + ":close";
        const expiry = Number(position.contract_expires_at);
        const secondsToExpiry = Number.isFinite(expiry) ? Math.ceil(expiry - now / 1000) : null;
        const expiryStatus = normaliseManualContractType(position.contract_type) === "fixed" && secondsToExpiry !== null ? secondsToExpiry > 0 ? " · scheduled close in " + secondsToExpiry + "s" : " · expiry reached; awaiting settlement" : "";
        return <div className="activity-row" key={position.id}><div className="activity-info"><strong>{position.market} · {position.direction}</strong><small>{liveNetPnlLabel(Number(position.user_net_unrealized_pnl_usd || 0))} · {money(position.margin_usd)} reserved · {position.clearing_type || "PRINCIPAL"}</small><small>Spread {money(position.spread_charged_usd || 0)} · tier fee {money(position.tier_fee_usd || 0)}</small><small className="synthetic-contract-record">{contractTypeLabel(position.contract_type)}{normaliseManualContractType(position.contract_type) === "open_ended" && Number.isFinite(Number(position.maximum_loss_percent)) ? " · max loss " + Number(position.maximum_loss_percent) + "%" : ""}{Number.isFinite(Number(position.manual_stop_loss_percent)) ? " · stop " + Number(position.manual_stop_loss_percent) + "%" : ""}{expiryStatus} · {contractReasonLabel(position.contract_reason)}</small></div><button className="small-action" disabled={pendingFor(key)} onClick={() => onClose(position.id)}>{pendingFor(key) ? "Closing…" : "Close"}</button></div>;
      })}
  </section>;
}

function SyntheticSettlementList({ settlements }: {
  settlements: NonNullable<NonNullable<Account["synthetic"]>["recent_settlements"]>;
}) {
  const recent = settlements.slice(0, 5);
  return <section className="synthetic-settlement-section" aria-labelledby="synthetic-settlements-title">
    <div className="synthetic-section-heading">
      <div className="synthetic-settlement-title-region">
        <h3 id="synthetic-settlements-title">Recent closed trades</h3>
        <span>{recent.length === 5 ? "Latest 5" : `${recent.length} shown`}</span>
      </div>
    </div>
    {!recent.length
      ? <p className="synthetic-empty-state" role="status">Closed trades will appear here after a Synthetic position settles.</p>
      : recent.map((settlement) => {
        const netPnl = settlement.user_net_pnl_usd;
        const hasNetPnl = typeof netPnl === "number" && Number.isFinite(netPnl);
        const pnlLabel = hasNetPnl
          ? signedMoney(netPnl)
          : "Net P&L unavailable";
        const modeValue = String(settlement.mode || "").toLowerCase();
        const mode = modeValue === "auto" ? "automatic" : modeValue === "manual" ? "manual" : "execution mode unavailable";
        const reasonValue = String(settlement.close_reason || "");
        const derivedReason = /^(game_|auto_daily_)/i.test(reasonValue);
        const exitReason = hasNetPnl || !derivedReason
          ? formatSettlementExitReason(reasonValue, netPnl)
          : "Exit reason unavailable";
        const margin = settlement.margin_usd;
        const marginLabel = typeof margin === "number" && Number.isFinite(margin)
          ? `Margin ${money(margin)}`
          : "Margin unavailable";
        return <div className="activity-row synthetic-settlement-row" key={settlement.id || `${settlement.market}-${settlement.closed_at}`}>
          <div className="activity-info">
            <strong>{settlement.market || "Synthetic market"} · {String(settlement.direction || "—").toUpperCase()} · {mode} · closed</strong>
            <small>{marginLabel} · P&amp;L <b className={hasNetPnl && netPnl > 0 ? "up" : hasNetPnl && netPnl < 0 ? "down" : ""}>{pnlLabel}</b> · {exitReason}</small>
          </div>
        </div>;
      })}
  </section>;
}

export function SyntheticWorkspace({ account, environment, marketChart: MarketChart, onDashboardPatch, onNotice, onPickStrategy, request, store }: SyntheticWorkspaceProps) {
  const [market, setMarket] = useState<Market>("SYN-25");
  const marketRef = useRef(market);
  const resourceKey = syntheticResourceKey(environment, market);
  const snapshots = useDeskSelector(store, selectSnapshots);
  const storedSnapshot = snapshots?.[resourceKey] ?? null;
  const fallbackSnapshot = useMemo<Snapshot>(() => ({ market, partial: true, latest: { market }, ticks: [], positions: [], settings: {} }), [market]);
  const snapshot = storedSnapshot?.market === market ? storedSnapshot : fallbackSnapshot;
  const snapshotPositionCount = snapshot.positions.length;
  const [snapshotCheckedKey, setSnapshotCheckedKey] = useState<string | null>(null);
  const [hasStartedTradeThisSession, setHasStartedTradeThisSession] = useState(false);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [quoteError, setQuoteError] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  useEffect(() => {
    if (snapshotPositionCount > 0) setHasStartedTradeThisSession(true);
  }, [snapshotPositionCount]);
  useResourcePoller<ProductPnlSummaryData>(async (_token, signal) => {
    const result = await request("/v1/synthetic/pnl-summary", { signal }, environment);
    const summary = result.summary;
    if (
      !summary ||
      typeof summary.last_24h_usd !== "number" ||
      !Number.isFinite(summary.last_24h_usd) ||
      typeof summary.all_time_usd !== "number" ||
      !Number.isFinite(summary.all_time_usd)
    ) {
      return undefined;
    }
    return {
      last_24h_usd: summary.last_24h_usd,
      all_time_usd: summary.all_time_usd,
    };
  }, (summary) => {
    onDashboardPatch((current) => current ? {
      ...current,
      synthetic: {
        ...current.synthetic,
        pnl_summary: summary,
      },
    } : current);
  }, 15_000, true, `synthetic-pnl:${account.user.id}:${environment}`, (error) => {
    logDeskFailure("synthetic.pnl-summary", error);
  }, "Synthetic");
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
      if (response.position || (path === "/v1/synthetic/actions" && payload.action === "open")) setHasStartedTradeThisSession(true);
      if (response.position) {
        update((current) => current ? { ...current, positions: [response.position, ...current.positions.filter((item) => item.id !== response.position.id)] } : current);
        if (response.position.status === "closed" && response.position.id) {
          onDashboardPatch((current) => {
            if (!current) return current;
            const previous = current.synthetic?.recent_settlements || [];
            const settlement = {
              id: String(response.position.id),
              market: response.position.market,
              mode: response.position.mode,
              direction: response.position.direction,
              margin_usd: response.position.margin_usd,
              user_net_pnl_usd: response.position.user_net_pnl_usd,
              close_reason: response.position.close_reason,
              closed_at: response.position.closed_at,
            };
            const recent_settlements = [settlement, ...previous.filter((item) => item.id !== settlement.id)]
              .sort((left, right) => Number(right.closed_at || 0) - Number(left.closed_at || 0))
              .slice(0, 8);
            return { ...current, synthetic: { ...current.synthetic, recent_settlements } };
          });
        }
      }
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
  const syntheticClosing = syntheticBot?.state === "closing";
  const executionStatus = syntheticBot?.state === "paused" ? "Paused" : syntheticClosing ? "Closing allocation" : syntheticAutoOn ? "Auto on" : "Waiting for funding";
  const executionLabel = syntheticBot?.state === "paused" ? "PAUSED" : syntheticClosing ? "CLOSING" : syntheticAutoOn ? "AUTO" : "WAITING";
  const snapshotPending = snapshot.partial === true && snapshotCheckedKey !== resourceKey;
  const hasTradeHistory = account.ledger.some((entry) => Boolean(entry.trade_detail))
    || Boolean(account.memecoin?.recent_settlements?.length)
    || Boolean(account.synthetic?.recent_settlements?.length)
    || Boolean(account.synthetic?.open_positions?.length)
    || snapshot.positions.length > 0
    || hasStartedTradeThisSession;
  const shouldShowStrategyPicker = environment === "mainnet" && account.bots.length === 0 && !hasTradeHistory && !snapshotPending;
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
      <div className="synthetic-market-title-region"><h2>{market}</h2><MemoizedQuoteStatus environment={environment} error={quoteError} market={market} store={store} /></div>
      <div className="synthetic-market-action-region"><button type="button" className="small-action synthetic-help-link" onClick={() => setHelpOpen(true)}>How quotes work</button></div>
    </div>
    <div className="segment-control synthetic-market-rail" role="group" aria-label="Synthetic markets">
      {markets.map((item) => <button key={item} className={market === item ? "active" : ""} aria-pressed={market === item} onClick={() => { if (item !== market) { setSignals([]); marketRef.current = item; setMarket(item); } }}>{item}</button>)}
    </div>
    {environment === "testnet" && account.user.is_admin && <p className="synthetic-environment-note">Admin test environment · Virtual funds only.</p>}
    <div id="synthetic-market-snapshot" aria-label={market + " market snapshot"}>
      <MemoizedSyntheticMarketData account={account} environment={environment} executionLabel={executionLabel} market={market} marketChart={MarketChart} snapshot={snapshot} store={store} syntheticAutoOn={syntheticAutoOn} />
      <ProductPnlSummary product="Synthetic" summary={account.synthetic?.pnl_summary} />
      {environment === "mainnet" ? <>
        <section className="synthetic-auto-panel" aria-labelledby="synthetic-auto-title">
          <div className="synthetic-auto-heading">
            <div className="synthetic-auto-title"><h3 id="synthetic-auto-title">Automatic execution</h3><p>Auto evaluates shared signals using 100% of your funded Synthetic allocation. One scheduled position opens at a time; top-ups are included automatically.</p></div>
            <div className="synthetic-auto-state" role="status" aria-live="polite" aria-atomic="true"><span className={"status-chip " + (syntheticAutoOn ? "running" : "paused")}><i />{executionStatus}</span></div>
          </div>
          <div className="synthetic-auto-capacity" aria-label="Auto available and locked margin"><span>Auto available <b>{capacityValue(snapshot.execution?.auto_available_usd, snapshotPending)}</b></span><span>Auto locked margin <b>{capacityValue(snapshot.execution?.auto_locked_usd, snapshotPending)}</b></span></div>
          {shouldShowStrategyPicker && <button type="button" className="primary-action synthetic-strategy-entry" onClick={onPickStrategy}>Pick a strategy <ChevronRight size={14} /></button>}
          {syntheticAutoOn && typeof dailyGoalUsd === "number" && Number.isFinite(dailyGoalUsd) && <p className="synthetic-auto-hint" role="status">
            Daily Auto progress: {money(dailyNetUsd)} net ({money(Number(snapshot.execution?.daily_settled_net_pnl_usd || 0))} settled + {money(Number(snapshot.execution?.daily_open_net_pnl_usd || 0))} live) of {dailyTargetLabel}.
          </p>}
          {syntheticAutoOn && dailyExecutionPause && <p className="synthetic-auto-hint" role="status">{dailyExecutionPause}</p>}
        </section>
        <SyntheticSignalList signals={signals} />
      </> : account.user.is_admin ? <div className="button-row"><button className="small-action" onClick={() => void act("/v1/synthetic/actions", { action: "open", market, direction: "long", amount: 20 }).catch(() => undefined)}>Open $20 long</button><button className="small-action" onClick={() => void act("/v1/synthetic/actions", { action: "open", market, direction: "short", amount: 20 }).catch(() => undefined)}>Open $20 short</button><button className="danger-action" onClick={() => void act("/v1/synthetic/actions", { action: "reset" }).catch(() => undefined)}>Reset virtual balance</button></div> : <p>Testnet is reserved for administrator testing. Switch to mainnet for live synthetic access.</p>}
      <SyntheticPositionList positions={snapshot.positions} pending={snapshotPending || snapshot.positions_stale === true} pendingFor={pendingFor} onClose={(positionId) => void act("/v1/synthetic/positions/" + positionId + "/close", {}).catch(() => undefined)} />
      <SyntheticSettlementList settlements={account.synthetic?.recent_settlements || []} />
      {account.user.is_admin && snapshot.positions_stale && <p role="status">Position data is delayed; recent positions may be stale or unavailable. Open and close requests are checked against the current server state.</p>}
    </div>
  </div>
  {helpOpen && <AccessibleDialog label="How Synthetic quotes work" onClose={() => setHelpOpen(false)}><span className="eyebrow">SYNTHETIC QUOTES</span><h2>How quotes work</h2><p>Each index uses TradeMemo’s shared model feed. The displayed reference updates about once a second; it is not an external spot-market price.</p><div className="fact-block"><span>ORDER PRICE <b>Checked again at execution</b></span><span>SPREAD <b>Shown before review</b></span><span>TIER FEE <b>Applied at execution</b></span></div><p>A stale or unavailable quote prevents a new order. Existing positions remain unchanged until a valid close can be priced.</p><button type="button" className="primary-action" onClick={() => setHelpOpen(false)}>Back to market</button></AccessibleDialog>}
  </div></DeskLocalized>;
}
