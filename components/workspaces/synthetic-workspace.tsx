"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { AccessibleDialog } from "../accessible-dialog";
import { DeskLocalized } from "../desk-language";
import { ActionFeedback } from "../ui/action-feedback";
import { useDeskSelector, type DeskStore } from "../../lib/desk-store";
import type { ActionKey, DeskState } from "../../lib/desk-types";
import type { LiveDashboard } from "../tradepulse-shell";
import { reconcileSyntheticTicks } from "../../lib/synthetic-ticks";
import { MAXIMUM_OPEN_ENDED_LOSS_CAP, MINIMUM_OPEN_ENDED_LOSS_CAP, contractReasonLabel, contractTypeLabel, manualContractPreferences, manualSyntheticOrderActionKey, normaliseManualContractType, validateOpenEndedTerms, type ManualContractType } from "../../lib/synthetic-contract-terms";
import { activateContractInfo, contractInfoExpanded, contractInfoFocus, contractInfoHover, initialContractInfoState } from "../../lib/synthetic-contract-info";
import { liveNetPnlLabel } from "../../lib/synthetic-position-pnl";
import { syntheticQuoteStatus } from "../../lib/synthetic-quote-status";
import { useResourcePoller } from "./use-resource-poller";

type Market = "SYN-10" | "SYN-25" | "SYN-50" | "SYN-75" | "SYN-100";
type Signal = { id: string; market: string; direction: string; reference_price: number; expires_at: number };
type Snapshot = { market: string; partial?: boolean; history_available?: boolean; latest: { market?: string; price?: number; reference?: number; sequence?: number; timestamp?: number; created_at?: number }; ticks: Array<{ market?: string; sequence?: number; price?: number; reference?: number; timestamp?: number; created_at?: number }>; positions: Array<{ id: string; market: string; direction: string; margin_usd: number; status: string; clearing_type?: string; spread_charged_usd?: number; tier_fee_usd?: number; user_net_unrealized_pnl_usd?: number; signal_id?: string; contract_type?: string; contract_expires_at?: number; maximum_loss_percent?: number; manual_stop_loss_percent?: number; contract_reason?: string }>; live_disclosure_accepted?: boolean; execution_mode?: "MANUAL" | "AUTO"; execution?: { auto_allocation_usd?: number; auto_available_usd?: number; manual_available_usd?: number; auto_margin_usd?: number; capacity_refresh_required?: boolean }; auto_activity?: Array<{ timestamp: number; event_type: string; reason?: string; market?: string }>; settings?: Record<string, string>; allocation?: { available_usd: number; manual_available_usd?: number } };
type SyntheticQuote = { market: string; latest: Snapshot["latest"]; ticks: Snapshot["ticks"]; history_available?: boolean; received_at: number; server_updated_at: number };
type SyntheticSnapshots = Record<string, Snapshot | undefined>;
type SyntheticQuotes = Record<string, SyntheticQuote | undefined>;
type Account = Pick<LiveDashboard, "user" | "wallet" | "bots">;
type Request = (path: string, options?: RequestInit, environment?: "mainnet" | "testnet", timeoutMs?: number) => Promise<Record<string, any>>;
type Review = { kind: "long" | "short" | "auto" | "approve"; path: string; payload: Record<string, unknown>; amount: number; market: string; direction: string; fee: number | null; signal?: Signal; manualContract?: ManualContractType; maximumLossPercent?: number; manualStopLossPercent?: number };

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
    {(snapshot.history_available === false || currentQuote?.history_available === false) && <p role="status">Chart history is delayed. The latest available quote is shown.</p>}
  </>;
}

const MemoizedSyntheticMarketData = memo(SyntheticMarketData);

function SyntheticSignalList({ signals, signalResults, positions, signalSubmissions, signalError, pendingFor, onReview }: {
  signals: Signal[];
  signalResults: Record<string, string>;
  positions: Snapshot["positions"];
  signalSubmissions: Record<string, Pick<Signal, "market" | "direction">>;
  signalError: string;
  pendingFor: (key: string) => boolean;
  onReview: (kind: Review["kind"], signal?: Signal) => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!signals.length) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [signals.length]);
  const currentSignals = signals.filter((signal) => signal.expires_at * 1000 > now).slice(0, 3);
  return <>
    {currentSignals.map((signal) => {
      const key = "signal:" + signal.id + ":approve";
      const approvalPending = pendingFor(key) || Boolean(signalSubmissions[signal.id]);
      const submitted = signalResults[signal.id] === "Submitted" || positions.some((position) => position.signal_id === signal.id);
      return <div className="activity-row" key={signal.id}><div className="activity-info"><strong>{signal.market} · {signal.direction} signal</strong><small>Reference {Number(signal.reference_price).toFixed(5)} · Expires in {Math.max(0, Math.ceil((signal.expires_at * 1000 - now) / 1000))}s</small></div><button className="small-action" disabled={approvalPending || submitted} onClick={() => onReview("approve", signal)}>{approvalPending ? "Approving…" : submitted ? "Submitted" : "Review signal"}</button></div>;
    })}
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

function SignalExpiryStatus({ signal }: { signal: Signal }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <p role="status">{signal.expires_at * 1000 <= now ? "Signal expired. Go back for a fresh signal." : "Signal is current."}</p>;
}

export function SyntheticWorkspace({ account, environment, marketChart: MarketChart, onDashboardPatch, onNotice, request, store }: SyntheticWorkspaceProps) {
  const [market, setMarket] = useState<Market>("SYN-25");
  const marketRef = useRef(market);
  const resourceKey = syntheticResourceKey(environment, market);
  const snapshots = useDeskSelector(store, selectSnapshots);
  const storedSnapshot = snapshots?.[resourceKey] ?? null;
  const fallbackSnapshot = useMemo<Snapshot>(() => ({ market, partial: true, latest: { market }, ticks: [], positions: [], settings: {} }), [market]);
  const snapshot = storedSnapshot?.market === market ? storedSnapshot : fallbackSnapshot;
  const [amount, setAmount] = useState("20");
  const [manualContract, setManualContract] = useState<ManualContractType>("fixed");
  const [maximumLossPercent, setMaximumLossPercent] = useState("50");
  const [manualStopLossPercent, setManualStopLossPercent] = useState("");
  const [contractInfo, setContractInfo] = useState(initialContractInfoState);
  const [autoAmount, setAutoAmount] = useState("");
  const [autoAllocation, setAutoAllocation] = useState("");
  const [signals, setSignals] = useState<Signal[]>([]);
  const [signalResults, setSignalResults] = useState<Record<string, string>>({});
  const [signalSubmissions, setSignalSubmissions] = useState<Record<string, Pick<Signal, "market" | "direction">>>({});
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
    const activeIds = new Set(next.map((signal) => signal.id));
    setSignalResults((current) => Object.keys(current).some((id) => !activeIds.has(id))
      ? Object.fromEntries(Object.entries(current).filter(([id]) => activeIds.has(id)))
      : current);
    setSignalError("");
  }, 2000, true, `synthetic-signals:${environment}:${market}`, () => {
    setSignalError("Signal updates are delayed. Reconnecting…");
  });
  useResourcePoller<Record<string, unknown>>(async (_token, signal) => {
    return await request("/v1/synthetic/stream?market=" + market, { signal }, environment);
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
        received_at: Date.now(),
        server_updated_at: Number(stream.updated_at),
      } satisfies SyntheticQuote,
    });
  }, 1000, true, `synthetic-quotes:${environment}:${market}`, () => setQuoteError(true));
  const actionKey = (path: string, payload: Record<string, unknown>) => {
    const position = path.match(/^\/v1\/synthetic\/positions\/([^/]+)\/close$/); const bot = path.match(/^\/v1\/bots\/(\d+)\/actions$/);
    if (path.includes("/synthetic/orders")) return ("synthetic-order:" + String(payload.market || market) + ":" + String(payload.direction || "order") + ":" + String(payload.contract_type || "fixed")) as ActionKey;
    if (path.includes("/synthetic/signals/")) return ("signal:" + path.split("/")[4] + ":approve") as ActionKey;
    if (path === "/v1/synthetic/actions") return ("synthetic-testnet:" + String(payload.action || "action")) as ActionKey;
    if (position) return ("synthetic-position:" + position[1] + ":close") as ActionKey;
    if (bot) return ("bot:" + bot[1] + ":" + String(payload.action || "action")) as ActionKey;
    if (path.includes("execution-mode")) return ("execution:" + String(payload.execution_mode || "execution-mode").toLowerCase()) as ActionKey;
    return (path.includes("disclosure") ? "disclosure:accept" : path + ":action") as ActionKey;
  };
  const reviewActionKey = review ? actionKey(review.path, review.payload) : null;
  const activeReviewActionPending = Boolean(reviewActionKey && pendingFor(reviewActionKey));
  const manualOrderPending = (direction: "long" | "short") => pendingFor(manualSyntheticOrderActionKey(market, direction, manualContract, maximumLossPercent, manualStopLossPercent));
  const openEndedTerms = manualContract === "open_ended" ? validateOpenEndedTerms(maximumLossPercent, manualStopLossPercent) : null;
  const act = async (path: string, payload: Record<string, unknown>) => {
    const key = actionKey(path, payload); if (pendingFor(key)) return false;
    const changesExecutionMode = path === "/v1/synthetic/settings/execution-mode";
    // These actions are attached to the engine's durable 30-second execution
    // window. Keep the browser attached long enough to receive that outcome
    // instead of aborting at the generic 15-second desk timeout.
    const durableAction = path === "/v1/synthetic/orders"
      || path.includes("/v1/synthetic/signals/")
      || /^\/v1\/synthetic\/positions\/[^/]+\/close$/.test(path);
    if (changesExecutionMode && executionSubmitting.current) return false;
    if (changesExecutionMode) { executionSubmitting.current = true; executionRevision.current += 1; setExecutionTransition(payload.execution_mode === "AUTO" ? "AUTO" : "MANUAL"); }
    const actionLabel = path.includes("/signals/") ? "Submitting signal approval…" : /^\/v1\/synthetic\/positions\/[^/]+\/close$/.test(path) ? "Submitting close request…" : changesExecutionMode ? payload.execution_mode === "AUTO" ? "Enabling Auto…" : "Switching to Manual…" : null;
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
  const openReview = (kind: Review["kind"], signal?: Signal) => {
    if (environment !== "mainnet") return;
    const value = Number(kind === "auto" ? autoAmount : amount), reserved = Number(autoAllocation);
    if (!Number.isFinite(value) || value < 20) return onNotice("Set an order size of at least $20.00.");
    if (kind === "auto" && (!Number.isFinite(reserved) || reserved < value)) return onNotice("Auto capacity must cover at least one Auto order.");
    const selectedMarket = signal?.market || market, direction = signal?.direction || kind;
    const path = kind === "auto" ? "/v1/synthetic/settings/execution-mode" : signal ? "/v1/synthetic/signals/" + signal.id + "/approve" : "/v1/synthetic/orders";
    const terms = manualContract === "open_ended" ? validateOpenEndedTerms(maximumLossPercent, manualStopLossPercent) : null;
    if (terms && !terms.valid) return onNotice(terms.error);
    const preferences = manualContractPreferences(manualContract, maximumLossPercent, manualStopLossPercent);
    const payload = kind === "auto" ? { execution_mode: "AUTO", auto_margin_usd: value, auto_allocation_usd: reserved } : signal ? { amount: value, funding_source: "mainnet", idempotency_key: "signal:" + account.user.id + ":" + signal.id, ...preferences } : { market: selectedMarket, direction, amount: value, mode: (snapshot.execution_mode || "MANUAL").toLowerCase(), funding_source: "mainnet", idempotency_key: "web:" + selectedMarket + ":" + direction + ":" + Date.now(), ...preferences };
    const fee = snapshot.partial ? null : value * Number(snapshot.settings?.["fee_bps_" + account.user.tier.toLowerCase()] || 20) / 10000;
    setAutoAcknowledged(false); setReviewError(""); setReview({ kind, path, payload, amount: value, market: selectedMarket, direction, fee, signal, ...(kind === "auto" ? {} : { manualContract, maximumLossPercent: Number(preferences.maximum_loss_percent), manualStopLossPercent: Number(preferences.manual_stop_loss_percent) || undefined }) });
  };
  const confirm = async () => {
    if (!review) return;
    const submission = review;
    const key = actionKey(submission.path, submission.payload);
    if (reviewSubmitting.current === key || pendingFor(key)) return;
    if ((submission.signal && submission.signal.expires_at * 1000 <= Date.now()) || (submission.kind === "auto" && !autoAcknowledged)) { setReviewError("This review expired or needs acknowledgement. Go back and review again."); return; }
    reviewSubmitting.current = key; setReviewError("");
    const signal = submission.signal;
    if (signal) {
      const signalId = signal.id;
      setSignalSubmissions((current) => ({ ...current, [signalId]: { market: signal.market, direction: signal.direction } }));
      const action = act(submission.path, submission.payload);
      setReview(null);
      try {
        const submitted = await action;
        if (submitted) setSignalResults((current) => ({ ...current, [signalId]: "Submitted" }));
        else if (!pendingFor(key)) setReview(submission);
      } catch (error) {
        const message = error instanceof Error ? error.message : "TradeMemo could not submit this request. Review it and try again.";
        if (/signal.*(?:expired|no longer)/i.test(message)) onNotice("That signal is no longer current. A fresh signal will appear when available.");
      } finally {
        setSignalSubmissions((current) => { const next = { ...current }; delete next[signalId]; return next; });
        if (reviewSubmitting.current === key) reviewSubmitting.current = null;
      }
      return;
    }
    try { const submitted = await act(submission.path, submission.payload); if (submitted) setReview(null); } catch (error) { const message = error instanceof Error ? error.message : "TradeMemo could not submit this request. Review it and try again."; setReviewError(message); } finally { if (reviewSubmitting.current === key) reviewSubmitting.current = null; }
  };
  const manualKey = "execution:manual";
  const autoKey = "execution:auto";
  const latestAuto = snapshot?.auto_activity?.[0];
  const autoActivityReason = (reason?: string) => {
    if (reason && /loss[_ -]streak/i.test(reason)) return "A protective loss-streak check is blocking new entries. Auto remains on until the server-side risk check clears.";
    if (reason && /daily[_ -]drawdown/i.test(reason)) return "A daily-loss limit is blocking new entries until the server-side risk check clears.";
    return reason;
  };
  const autoActivityTitle = !latestAuto ? "No Auto activity yet" : latestAuto.event_type === "auto_signal_rejected" && /loss[_ -]streak/i.test(latestAuto.reason || "") ? "Auto entries paused" : latestAuto.event_type === "auto_signal_rejected" ? "No order opened" : latestAuto.event_type === "position_opened" ? "Order opened" : "Auto activity recorded";
  const autoActivityDetail = latestAuto ? [latestAuto.market, autoActivityReason(latestAuto.reason), "Updated " + new Date(latestAuto.timestamp * 1000).toLocaleTimeString()].filter(Boolean).join(" · ") : "Eligible signals open only when the wallet allocation and quote checks pass.";
  const selectedFundingCapacity = Number(snapshot.allocation?.manual_available_usd ?? snapshot.allocation?.available_usd ?? 0);
  const selectedFundingLabel = "Manual capacity";
  const confirmedAuto = snapshot.execution_mode === "AUTO";
  const executionStatus = executionTransition === "AUTO" ? "Enabling Auto…" : executionTransition === "MANUAL" ? "Switching to Manual…" : snapshot.partial && !snapshot.execution_mode ? "Checking" : confirmedAuto ? "Auto on" : "Auto off";
  const executionLabel = executionTransition === "AUTO" ? "ENABLING AUTO" : executionTransition === "MANUAL" ? "SWITCHING TO MANUAL" : snapshot.partial && !snapshot.execution_mode ? "CHECKING" : snapshot.execution_mode || "MANUAL";
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
        <label className="amount-field">Order size<div className="amount-input"><span>$</span><input value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" aria-label="Synthetic order size" /></div></label>
        <div className="fact-block"><span>Wallet margin · 1:1 <b>{money(Number(amount) || 0)}</b></span><span>{selectedFundingLabel} <b>{snapshot.partial ? "Checking" : money(selectedFundingCapacity)}</b></span></div>
        <section className="synthetic-contract-selector" aria-labelledby="manual-contract-title">
          <div className="synthetic-contract-heading"><div><span className="eyebrow" id="manual-contract-title">MANUAL CONTRACT</span><small>Choose how the order will close before reviewing it.</small></div><div className="synthetic-contract-info"><button type="button" className="small-action" aria-label="About contract types" aria-expanded={contractInfoExpanded(contractInfo)} aria-controls="manual-contract-help" aria-describedby={contractInfoExpanded(contractInfo) ? "manual-contract-help" : undefined} onMouseEnter={() => setContractInfo((current) => contractInfoHover(current, true))} onMouseLeave={() => setContractInfo((current) => contractInfoHover(current, false))} onFocus={() => setContractInfo((current) => contractInfoFocus(current, true))} onBlur={() => setContractInfo((current) => contractInfoFocus(current, false))} onClick={() => setContractInfo(activateContractInfo)}><span aria-hidden="true">i</span></button>{contractInfoExpanded(contractInfo) && <div id="manual-contract-help" role="tooltip" className="synthetic-contract-tooltip">Fixed duration closes on schedule. Open-ended stays open until you close it or its loss limit is reached. Automatic orders show their confirmed terms after execution.</div>}</div></div>
          <div className="synthetic-contract-options" role="radiogroup" aria-label="Manual contract type">
            <button type="button" role="radio" aria-checked={manualContract === "fixed"} className={manualContract === "fixed" ? "selected" : ""} onClick={() => setManualContract("fixed")}><strong>Fixed duration</strong><small>Closes on a defined schedule. This is the default.</small></button>
            <button type="button" role="radio" aria-checked={manualContract === "open_ended"} className={manualContract === "open_ended" ? "selected" : ""} onClick={() => setManualContract("open_ended")}><strong>Open-ended</strong><small>Stays open until you close it or protection closes it.</small></button>
          </div>
          {manualContract === "open_ended" && <div className="synthetic-contract-risk"><label className="amount-field">Maximum loss cap ({MINIMUM_OPEN_ENDED_LOSS_CAP}%–{MAXIMUM_OPEN_ENDED_LOSS_CAP}%)<input value={maximumLossPercent} onChange={(event) => setMaximumLossPercent(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" aria-label="Open-ended maximum loss cap percentage" aria-invalid={Boolean(openEndedTerms && !openEndedTerms.valid)} /></label><label className="amount-field">Optional tighter stop (at least {MINIMUM_OPEN_ENDED_LOSS_CAP}%)<input value={manualStopLossPercent} onChange={(event) => setManualStopLossPercent(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" aria-label="Open-ended optional tighter stop percentage" placeholder="No additional stop" aria-invalid={Boolean(openEndedTerms && !openEndedTerms.valid)} /></label><small>Protection is capped at the percentage shown. A tighter stop must be between {MINIMUM_OPEN_ENDED_LOSS_CAP}% and the cap.</small>{openEndedTerms && !openEndedTerms.valid && <p role="alert">{openEndedTerms.error}</p>}</div>}
        </section>
        <section className="synthetic-auto-panel" aria-labelledby="synthetic-auto-title" aria-busy={Boolean(executionTransition)}>
          <div className="synthetic-auto-heading">
            <div className="synthetic-auto-title"><h3 id="synthetic-auto-title">Automatic execution</h3><p>Set the per-order margin and funds Auto may use. Enabling Auto requires review.</p></div>
            <div className="synthetic-auto-state" role="status" aria-live="polite" aria-atomic="true" aria-busy={Boolean(executionTransition)}><span className={"status-chip " + (executionTransition ? "paused" : confirmedAuto ? "running" : "paused")}><i />{executionStatus}</span></div>
          </div>
          <div className="synthetic-auto-fields">
            <label className="amount-field">Auto amount per order<input value={autoAmount} onChange={(event) => setAutoAmount(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" aria-label="Automatic Synthetic order size" /></label>
            <label className="amount-field">Set aside for Auto<input value={autoAllocation} onChange={(event) => setAutoAllocation(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" aria-label="Automatic Synthetic allocation" /></label>
          </div>
          <div className="synthetic-auto-capacity" aria-label="Automatic and manual available capacity"><span>Auto available <b>{snapshot.partial ? "Checking" : executionCapacityRefreshing ? "Updating…" : money(Number(snapshot.execution?.auto_available_usd || 0))}</b></span><span>Manual available <b>{snapshot.partial ? "Checking" : executionCapacityRefreshing ? "Updating…" : money(Number(snapshot.execution?.manual_available_usd || snapshot.allocation?.available_usd || 0))}</b></span></div>
          {executionCapacityRefreshing && <p className="synthetic-auto-hint" role="status">Capacity is refreshing. New orders are checked against current funding before submission.</p>}
          {Number(autoAllocation) < Number(autoAmount) && <p className="synthetic-auto-hint" role="status">Set aside at least {money(Math.max(20, Number(autoAmount) || 20))} for one Auto order. Manual capacity stays separate.</p>}
          <div className="synthetic-auto-actions">
            <button className="primary-action" disabled={pendingFor(autoKey) || Boolean(executionTransition) || Number(autoAmount) < 20 || Number(autoAllocation) < Number(autoAmount)} onClick={() => openReview("auto")}>{executionTransition === "AUTO" ? "Enabling Auto…" : confirmedAuto ? "Review Auto changes" : "Review & enable Auto"}</button>
            {(confirmedAuto || snapshot.partial) && <button className="small-action" disabled={pendingFor(manualKey) || Boolean(executionTransition)} onClick={() => void act("/v1/synthetic/settings/execution-mode", { execution_mode: "MANUAL" }).catch(() => undefined)}>{executionTransition === "MANUAL" ? "Switching to Manual…" : pendingFor(manualKey) ? "Saving…" : "Switch to Manual"}</button>}
          </div>
          {confirmedAuto && !executionTransition && <><p className="synthetic-auto-hint">Automatic uses the confirmed per-order margin within its assigned capacity.</p><div className="activity-row" role="status" aria-live="polite"><div className="activity-info"><strong>{autoActivityTitle}</strong><small>{autoActivityDetail}</small></div></div></>}
        </section>
        <div className="button-row" role="group" aria-label="Manual orders"><button className="small-action" disabled={manualOrderPending("long")} onClick={() => openReview("long")}>{manualOrderPending("long") ? "Submitting…" : "Review Long"}</button><button className="small-action" disabled={manualOrderPending("short")} onClick={() => openReview("short")}>{manualOrderPending("short") ? "Submitting…" : "Review Short"}</button></div>
        {Object.entries(signalSubmissions).map(([id, submission]) => <div className="activity-row" key={"signal-pending:" + id} role="status" aria-live="polite"><div className="activity-info"><strong>{submission.market} · {submission.direction} approval pending</strong><small>Waiting for server confirmation. No order is marked successful until the server confirms it.</small></div></div>)}
        <SyntheticSignalList signals={signals} signalResults={signalResults} positions={snapshot.positions} signalSubmissions={signalSubmissions} signalError={signalError} pendingFor={pendingFor} onReview={openReview} />
      </> : account.user.is_admin ? <div className="button-row"><button className="small-action" onClick={() => void act("/v1/synthetic/actions", { action: "open", market, direction: "long", amount: 20 }).catch(() => undefined)}>Open $20 long</button><button className="small-action" onClick={() => void act("/v1/synthetic/actions", { action: "open", market, direction: "short", amount: 20 }).catch(() => undefined)}>Open $20 short</button><button className="danger-action" onClick={() => void act("/v1/synthetic/actions", { action: "reset" }).catch(() => undefined)}>Reset virtual balance</button></div> : <p>Testnet is reserved for administrator testing. Switch to mainnet for live synthetic access.</p>}
      <SyntheticPositionList positions={snapshot.positions} pendingFor={pendingFor} onClose={(positionId) => void act("/v1/synthetic/positions/" + positionId + "/close", {}).catch(() => undefined)} />
    </div>
  </div>
  {helpOpen && <AccessibleDialog label="How Synthetic quotes work" onClose={() => setHelpOpen(false)}><span className="eyebrow">SYNTHETIC QUOTES</span><h2>How quotes work</h2><p>Each index uses TradeMemo’s shared model feed. The displayed reference updates about once a second; it is not an external spot-market price.</p><div className="fact-block"><span>ORDER PRICE <b>Checked again at execution</b></span><span>SPREAD <b>Shown before review</b></span><span>TIER FEE <b>Applied at execution</b></span></div><p>A stale or unavailable quote prevents a new order. Existing positions remain unchanged until a valid close can be priced.</p><button type="button" className="primary-action" onClick={() => setHelpOpen(false)}>Back to market</button></AccessibleDialog>}
  {review && <AccessibleDialog label={review.kind === "auto" ? "Review automatic execution" : "Review synthetic order"} onClose={() => setReview(null)}>
    <span className="eyebrow">MAINNET / FINAL REVIEW</span>
    <h2>{review.kind === "auto" ? "Enable automatic execution?" : review.market + " · " + review.direction.toUpperCase()}</h2>
    <div className="fact-block">
      <span>EXECUTION <b>{review.kind === "auto" ? "AUTO" : "MANUAL ORDER"}</b></span>
      {review.kind !== "auto" && <span>FUNDING <b>{String(review.payload.funding_source) === "credit" ? "NON-WITHDRAWABLE CREDIT" : "WALLET ALLOCATION"}</b></span>}
      <span>{review.kind === "auto" ? "MARGIN PER AUTO ORDER" : "MARGIN / 1:1"} <b>{money(review.amount)}</b></span>
      {review.kind === "auto" && <span>AUTO CAPACITY <b>{money(Number((review.payload as { auto_allocation_usd?: number }).auto_allocation_usd || 0))}</b></span>}
      {review.kind !== "auto" && <>
        <span>REQUESTED CONTRACT <b>{contractTypeLabel(review.manualContract)}</b></span>
        {review.manualContract === "open_ended" && <span>MAXIMUM LOSS CAP <b>{review.maximumLossPercent}%</b></span>}
        {review.manualContract === "open_ended" && review.manualStopLossPercent && <span>OPTIONAL TIGHTER STOP <b>{review.manualStopLossPercent}%</b></span>}
      </>}
      <span>ESTIMATED TIER FEE <b>{review.fee === null ? "Calculated at execution" : money(review.fee)}</b></span>
    </div>
    <p>{review.kind === "auto" ? "TradeMemo selects automatic order terms after its risk checks. The completed order shows the confirmed type, cap, and reason." : "TradeMemo confirms the final contract terms at execution. The completed order shows its fixed type, cap, and reason."} You can lose the full reserved margin. Prices may change during review.</p>
    {review.kind === "auto" && <label className="toggle-row"><span>I understand Auto uses only the stated Auto capacity and margin per order. Manual orders use the remaining Synthetic capacity.</span><input type="checkbox" checked={autoAcknowledged} disabled={activeReviewActionPending} onChange={(event) => setAutoAcknowledged(event.target.checked)} /><i aria-hidden="true" /></label>}
    {review.signal && <SignalExpiryStatus signal={review.signal} />}
    {reviewError && <p role="alert">{reviewError}</p>}
    {review.kind === "auto" && activeReviewActionPending && <p role="status">Saving the Auto setting. The state changes to on only after the server confirms the allocation.</p>}
    <button className="primary-action" disabled={activeReviewActionPending || (review.kind === "auto" && !autoAcknowledged)} onClick={() => void confirm()}>
      <ActionFeedback state={activeReviewActionPending ? "pending" : reviewError ? "error" : "idle"}>{activeReviewActionPending ? review.kind === "auto" ? "Saving Auto setting…" : "Submitting…" : review.kind === "auto" ? "Confirm Auto execution" : review.kind === "approve" ? "Confirm signal approval" : "Confirm " + review.direction}</ActionFeedback>
    </button>
    {activeReviewActionPending && <p role="status">The request is being submitted. You can return to the controls without cancelling it; the result will appear here.</p>}
    <button type="button" className="ghost-action" onClick={() => setReview(null)}>{activeReviewActionPending ? "Return to controls" : "Go back"}</button>
  </AccessibleDialog>}
  </div></DeskLocalized>;
}
