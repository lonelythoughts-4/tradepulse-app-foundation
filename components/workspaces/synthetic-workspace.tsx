"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { AccessibleDialog } from "../accessible-dialog";
import { ActionFeedback } from "../ui/action-feedback";
import { useDeskSelector, type DeskStore } from "../../lib/desk-store";
import type { ActionKey, DeskState } from "../../lib/desk-types";
import type { LiveDashboard } from "../tradepulse-shell";
import { reconcileSyntheticTicks, type SyntheticTick } from "../../lib/synthetic-ticks";
import { MAXIMUM_OPEN_ENDED_LOSS_CAP, MINIMUM_OPEN_ENDED_LOSS_CAP, contractReasonLabel, contractTypeLabel, manualContractPreferences, manualSyntheticOrderActionKey, normaliseManualContractType, validateOpenEndedTerms, type ManualContractType } from "../../lib/synthetic-contract-terms";
import { activateContractInfo, contractInfoExpanded, contractInfoFocus, contractInfoHover, initialContractInfoState } from "../../lib/synthetic-contract-info";
import { liveNetPnlLabel } from "../../lib/synthetic-position-pnl";
import { useResourcePoller } from "./use-resource-poller";

type Market = "SYN-10" | "SYN-25" | "SYN-50" | "SYN-75" | "SYN-100";
type Signal = { id: string; market: string; direction: string; reference_price: number; expires_at: number };
type Snapshot = { market: string; latest: { market?: string; price?: number; reference?: number; sequence?: number; timestamp?: number; created_at?: number }; ticks: Array<{ market?: string; sequence?: number; price?: number; reference?: number; timestamp?: number; created_at?: number }>; positions: Array<{ id: string; market: string; direction: string; margin_usd: number; status: string; clearing_type?: string; spread_charged_usd?: number; tier_fee_usd?: number; user_net_unrealized_pnl_usd?: number; signal_id?: string; contract_type?: string; contract_expires_at?: number; maximum_loss_percent?: number; manual_stop_loss_percent?: number; contract_reason?: string }>; live_disclosure_accepted?: boolean; execution_mode?: "MANUAL" | "AUTO"; execution?: { auto_allocation_usd?: number; auto_available_usd?: number; manual_available_usd?: number; auto_margin_usd?: number }; auto_activity?: Array<{ timestamp: number; event_type: string; reason?: string; market?: string }>; settings?: Record<string, string>; allocation?: { available_usd: number; manual_available_usd?: number }; demo?: { active: boolean; state?: string; available_usd: number; credit_available_usd?: number } };
type Account = Pick<LiveDashboard, "user" | "wallet" | "bots">;
type Request = (path: string, options?: RequestInit, environment?: "mainnet" | "testnet", timeoutMs?: number) => Promise<Record<string, any>>;
type Review = { kind: "long" | "short" | "auto" | "approve"; path: string; payload: Record<string, unknown>; amount: number; market: string; direction: string; fee: number; signal?: Signal; manualContract?: ManualContractType; maximumLossPercent?: number; manualStopLossPercent?: number };

export type SyntheticWorkspaceProps = { account: Account; environment: "mainnet" | "testnet"; marketChart: ComponentType<{ points: Array<{ market?: string; sequence?: number; price: number; timestamp?: number }>; market: string }>; onDashboardPatch: (patch: (current: LiveDashboard | null) => LiveDashboard | null) => void; onNotice: (message: string) => void; request: Request; store: DeskStore };
const markets: Market[] = ["SYN-10", "SYN-25", "SYN-50", "SYN-75", "SYN-100"];
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
const selectSnapshot = (state: DeskState) => state.resources.synthetic as Snapshot | null;

export function SyntheticWorkspace({ account, environment, marketChart: MarketChart, onDashboardPatch, onNotice, request, store }: SyntheticWorkspaceProps) {
  const [market, setMarket] = useState<Market>("SYN-25");
  const marketRef = useRef(market);
  const revision = useRef(0);
  const snapshot = useDeskSelector(store, selectSnapshot);
  const [amount, setAmount] = useState("20");
  const [manualContract, setManualContract] = useState<ManualContractType>("fixed");
  const [maximumLossPercent, setMaximumLossPercent] = useState("50");
  const [manualStopLossPercent, setManualStopLossPercent] = useState("");
  const [contractInfo, setContractInfo] = useState(initialContractInfoState);
  const [autoAmount, setAutoAmount] = useState("");
  const [autoAllocation, setAutoAllocation] = useState("");
  const [fundingSource, setFundingSource] = useState<"wallet" | "demo" | "credit">("wallet");
  const [signals, setSignals] = useState<Signal[]>([]);
  const [signalResults, setSignalResults] = useState<Record<string, string>>({});
  const [signalError, setSignalError] = useState("");
  const signalPollInFlight = useRef(false);
  const signalPollFailures = useRef(0);
  const [loadError, setLoadError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [helpOpen, setHelpOpen] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [reviewError, setReviewError] = useState("");
  const reviewSubmitting = useRef<string | null>(null);
  const [autoAcknowledged, setAutoAcknowledged] = useState(false);
  const [executionTransition, setExecutionTransition] = useState<"MANUAL" | "AUTO" | null>(null);
  const executionSubmitting = useRef(false);
  const executionRevision = useRef(0);
  const confirmedMode = useRef<{ revision: number; mode: "MANUAL" | "AUTO" } | null>(null);
  const pending = useDeskSelector(store, (state) => state.actions);
  const pendingFor = (key: string) => Boolean(pending[key as ActionKey]?.pending);
  const update = useCallback((next: Snapshot | null | ((current: Snapshot | null) => Snapshot | null)) => {
    const current = store.getState().resources.synthetic as Snapshot | null;
    store.applyResource("synthetic", typeof next === "function" ? (next as (current: Snapshot | null) => Snapshot | null)(current) : next, ++revision.current);
  }, [store]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { setReview(null); setReviewError(""); }, [environment, market]);
  useEffect(() => { if (snapshot) { setAutoAmount((current) => current || String(Number(snapshot.execution?.auto_margin_usd || 20))); setAutoAllocation((current) => current || String(Number(snapshot.execution?.auto_allocation_usd || 0))); } }, [snapshot]);
  useEffect(() => {
    if (fundingSource === "demo" && !snapshot?.demo?.active) setFundingSource("wallet");
    if (fundingSource === "credit" && !Number(snapshot?.demo?.credit_available_usd || 0)) setFundingSource("wallet");
  }, [fundingSource, snapshot?.demo?.active, snapshot?.demo?.credit_available_usd]);
  useResourcePoller<Snapshot>(async () => {
    try { return await request("/v1/synthetic/" + market) as Snapshot; }
    catch (error) {
      // The lightweight stream has a live quote and owned positions even when
      // the fuller history/configuration snapshot is temporarily delayed.
      // Render that safe subset instead of replacing the entire desk with an
      // outage screen.
      try {
        const stream = await request("/v1/synthetic/stream?market=" + market, {}, environment);
        const latest = stream.latest as Snapshot["latest"];
        const price = Number(latest?.reference ?? latest?.price);
        if (Number.isFinite(price) && price > 0) {
          setLoadError("");
          return { market, latest, ticks: [latest], positions: stream.positions || [], settings: {} } as Snapshot;
        }
      } catch { /* The normal retry path below remains the final fallback. */ }
      setLoadError(error instanceof Error ? error.message : "Market data is temporarily unavailable.");
      return undefined;
    }
  }, (next) => {
    if (next.market !== marketRef.current) return;
    const confirmed = confirmedMode.current;
    const mode = confirmed && confirmed.revision >= executionRevision.current ? confirmed.mode : undefined;
    setLoadError("");
    update(mode && executionSubmitting.current ? { ...next, execution_mode: mode } : next);
  }, 5000, true);
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      if (cancelled || signalPollInFlight.current) return;
      signalPollInFlight.current = true;
      try {
        const result = await request("/v1/synthetic/signals?market=" + market + "&limit=10");
        if (!cancelled && market === marketRef.current) {
          const next = (result.signals || []) as Signal[];
          setSignals(next);
          setSignalResults((current) => Object.fromEntries(Object.entries(current).filter(([id]) => next.some((signal) => signal.id === id))));
          signalPollFailures.current = 0;
          setSignalError("");
        }
      } catch {
        if (!cancelled) {
          signalPollFailures.current += 1;
          // A single slow upstream read is not a customer-visible outage.
          // Keep the last verified signals on screen and only surface the
          // reconnect state after a short, consecutive failure window.
          if (signalPollFailures.current >= 3) setSignalError("Signal updates are delayed. Reconnecting…");
        }
      } finally { signalPollInFlight.current = false; }
    };
    void refresh(); const timer = window.setInterval(refresh, 2000); return () => { cancelled = true; window.clearInterval(timer); };
  }, [environment, market, request]);
  useEffect(() => {
    let cancelled = false; let inFlight = false;
    const refresh = async () => { if (cancelled || inFlight) return; inFlight = true; try { const stream = await request("/v1/synthetic/stream?market=" + market, {}, environment); const latest = stream.latest as Snapshot["latest"] & { timestamp?: number }; const price = Number(latest?.reference ?? latest?.price); if (!cancelled && Number.isFinite(price) && price > 0 && Number.isInteger(Number(latest?.sequence))) update((current) => current && current.market === market ? { ...current, latest, ticks: reconcileSyntheticTicks([...current.ticks.map((tick) => ({ market: tick.market || market, sequence: Number(tick.sequence), price: Number(tick.reference ?? tick.price), timestamp: tick.timestamp ?? tick.created_at })), { market, sequence: Number(latest.sequence), price, timestamp: latest.timestamp ?? latest.created_at }], market).map((tick) => ({ ...tick, reference: tick.price })).slice(-240), positions: stream.positions || current.positions } : current); } catch { /* snapshot poll recovers */ } finally { inFlight = false; } };
    void refresh(); const timer = window.setInterval(refresh, 1000); return () => { cancelled = true; window.clearInterval(timer); };
  }, [environment, market, request, update]);
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
    const actionLabel = path.includes("/signals/") ? "Submitting signal approval…" : /^\/v1\/synthetic\/positions\/[^/]+\/close$/.test(path) ? "Submitting close request…" : changesExecutionMode ? "Saving execution mode…" : null;
    if (actionLabel) onNotice(actionLabel);
    try {
      const response = await store.runAction(key, () => request(path, { method: "POST", body: JSON.stringify(payload) }, environment, durableAction ? 40_000 : undefined));
      if (changesExecutionMode && (response.execution_mode === "MANUAL" || response.execution_mode === "AUTO")) confirmedMode.current = { revision: executionRevision.current, mode: response.execution_mode };
      if (response.position) update((current) => current ? { ...current, positions: [response.position, ...current.positions.filter((item) => item.id !== response.position.id)] } : current);
      if (path === "/v1/synthetic/disclosure" && response.accepted) update((current) => current ? { ...current, live_disclosure_accepted: true } : current);
      if (path === "/v1/synthetic/settings/execution-mode" && response.execution_mode) { update((current) => current ? { ...current, execution_mode: response.execution_mode, execution: { ...current.execution, ...response } } : current); setExecutionTransition(null); }
      const bot = path.match(/^\/v1\/bots\/(\d+)\/actions$/);
      if (bot && payload.action === "topup") onDashboardPatch((current) => current ? { ...current, wallet: response.wallet ? { ...current.wallet, ...response.wallet } : current.wallet, bots: current.bots.map((item) => item.id === bot[1] ? { ...item, ...(response.bot || {}) } : item) } : current);
      onNotice(response.message || "Saved successfully."); return true;
    } catch (error) { if (changesExecutionMode) setExecutionTransition(null); const message = error instanceof Error ? error.message : "Action failed."; onNotice(message); throw error; }
    finally { if (changesExecutionMode) { executionSubmitting.current = false; executionRevision.current += 1; } }
  };
  const openReview = (kind: Review["kind"], signal?: Signal) => {
    if (!snapshot || environment !== "mainnet") return;
    const value = Number(kind === "auto" ? autoAmount : amount), capacity = Number(snapshot.allocation?.manual_available_usd || snapshot.allocation?.available_usd || 0), reserved = Number(autoAllocation);
    if (kind === "auto" && !snapshot.live_disclosure_accepted) return onNotice("Review and accept the live-risk acknowledgement before enabling Auto.");
    if (!Number.isFinite(value) || value < 20) return onNotice("Set an order size of at least $20.00.");
    if (kind === "auto" && (!Number.isFinite(reserved) || reserved < value)) return onNotice("Auto capacity must cover at least one Auto order.");
    const usingPool = fundingSource === "demo" && Boolean(snapshot.demo?.active);
    const usingCredit = fundingSource === "credit" && Number(snapshot.demo?.credit_available_usd || 0) > 0;
    if (kind !== "auto" && fundingSource === "wallet" && value > capacity) return onNotice("Manual capacity has " + money(capacity) + " available. Reduce the order size or change the allocation split.");
    if (kind === "auto" && (usingPool || usingCredit)) return onNotice("Auto uses wallet allocation only. Select Wallet for automatic execution; virtual funds and trading credit require a manual review.");
    const selectedMarket = signal?.market || market, direction = signal?.direction || kind;
    const path = kind === "auto" ? "/v1/synthetic/settings/execution-mode" : signal ? "/v1/synthetic/signals/" + signal.id + "/approve" : "/v1/synthetic/orders";
    const source = usingPool ? "demo" : usingCredit ? "credit" : "mainnet";
    const terms = manualContract === "open_ended" ? validateOpenEndedTerms(maximumLossPercent, manualStopLossPercent) : null;
    if (terms && !terms.valid) return onNotice(terms.error);
    const preferences = manualContractPreferences(manualContract, maximumLossPercent, manualStopLossPercent);
    const payload = kind === "auto" ? { execution_mode: "AUTO", auto_margin_usd: value, auto_allocation_usd: reserved } : signal ? { amount: value, funding_source: source, idempotency_key: "signal:" + source + ":" + account.user.id + ":" + signal.id, ...preferences } : { market: selectedMarket, direction, amount: value, mode: (snapshot.execution_mode || "MANUAL").toLowerCase(), funding_source: source, idempotency_key: "web:" + source + ":" + selectedMarket + ":" + direction + ":" + Date.now(), ...preferences };
    setAutoAcknowledged(false); setReviewError(""); setReview({ kind, path, payload, amount: value, market: selectedMarket, direction, fee: value * Number(snapshot.settings?.["fee_bps_" + account.user.tier.toLowerCase()] || 20) / 10000, signal, ...(kind === "auto" ? {} : { manualContract, maximumLossPercent: Number(preferences.maximum_loss_percent), manualStopLossPercent: Number(preferences.manual_stop_loss_percent) || undefined }) });
  };
  const confirm = async () => {
    if (!review) return;
    const key = actionKey(review.path, review.payload);
    if (reviewSubmitting.current === key || pendingFor(key)) return;
    if ((review.signal && review.signal.expires_at * 1000 <= Date.now()) || (review.kind === "auto" && !autoAcknowledged)) { setReviewError("This review expired or needs acknowledgement. Go back and review again."); return; }
    reviewSubmitting.current = key; setReviewError("");
    try { const submitted = await act(review.path, review.payload); if (submitted && review.signal) setSignalResults((current) => ({ ...current, [review.signal!.id]: "Submitted" })); if (submitted) setReview(null); } catch (error) { const message = error instanceof Error ? error.message : "Action failed."; setReviewError(message); if (review.signal && /signal.*(?:expired|no longer)/i.test(message)) { setReview(null); onNotice("That signal is no longer current. A fresh signal will appear when available."); } } finally { if (reviewSubmitting.current === key) reviewSubmitting.current = null; }
  };
  const chartTicks = snapshot?.ticks?.length ? snapshot.ticks : snapshot?.latest ? [snapshot.latest] : [];
  const points = reconcileSyntheticTicks(chartTicks.map((tick) => ({ market: tick.market || market, sequence: Number(tick.sequence), price: Number(tick.reference ?? tick.price), timestamp: tick.timestamp ?? tick.created_at })), market).slice(-80);
  const manualKey = "execution:manual";
  const autoKey = "execution:auto";
  const latestAuto = snapshot?.auto_activity?.[0];
  const autoActivityTitle = !latestAuto ? "No Auto activity yet" : latestAuto.event_type === "auto_signal_rejected" ? "No order opened" : latestAuto.event_type === "position_opened" ? "Order opened" : "Auto activity recorded";
  const autoActivityDetail = latestAuto ? [latestAuto.market, latestAuto.reason, "Updated " + new Date(latestAuto.timestamp * 1000).toLocaleTimeString()].filter(Boolean).join(" · ") : "Eligible signals open only when the wallet allocation and quote checks pass.";
  if (snapshot) return <div className="desk-screen"><div className="gradient-panel synthetic-pilot">
    <div className="synthetic-market-header">
      <div><h2>Market</h2><span className="live-indicator" role="status"><i />LIVE QUOTE · 1s</span></div>
      <button type="button" className="small-action synthetic-help-link" onClick={() => setHelpOpen(true)}>How quotes work</button>
    </div>
    <div className="segment-control synthetic-market-rail" role="group" aria-label="Synthetic markets">
      {markets.map((item) => <button key={item} className={market === item ? "active" : ""} aria-pressed={market === item} onClick={() => { if (item !== market) { update(null); setSignals([]); marketRef.current = item; setMarket(item); } }}>{item}</button>)}
    </div>
    {environment === "testnet" && account.user.is_admin && <p className="synthetic-environment-note">Admin test environment · Virtual funds only.</p>}
    <div id="synthetic-market-snapshot" aria-label={market + " market snapshot"}>
      <MarketChart points={points} market={market} />
      <div className="wallet-stat-grid">
        <div><span className="eyebrow">LAST TICK</span><strong>{Number(snapshot.latest?.reference || 0).toFixed(5)}</strong></div>
        <div><span className="eyebrow">UNASSIGNED</span><strong>{money(account.wallet.available)}</strong></div>
        <div><span className="eyebrow">ALLOCATION</span><strong>{money(account.bots.find((bot) => bot.product === "synthetic")?.capital_usd || 0)}</strong></div>
        <div><span className="eyebrow">EXECUTION</span><strong>{executionTransition ? "SWITCHING" : snapshot.execution_mode || "MANUAL"}</strong></div>
      </div>
      {environment === "mainnet" ? <>
        {!snapshot.live_disclosure_accepted && <div className="announcements"><span className="eyebrow">LIVE-RISK ACKNOWLEDGEMENT</span><strong>Required before wallet-funded Synthetic trading or Auto.</strong><p>Each order reserves wallet funds at 1:1 margin; price movement can result in loss of the full reserved amount; spread and tier fees apply. Auto may place wallet-funded orders using the amount you approve.</p><button className="primary-action" disabled={pendingFor("disclosure:accept")} onClick={() => void act("/v1/synthetic/disclosure", {}).catch(() => undefined)}>{pendingFor("disclosure:accept") ? "Saving…" : "Review & accept"}</button></div>}
        <label className="amount-field">Order size<div className="amount-input"><span>$</span><input value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" aria-label="Synthetic order size" /></div></label>
        {(snapshot.demo?.active || Number(snapshot.demo?.credit_available_usd || 0) > 0) && <div className="button-row" role="group" aria-label="Synthetic funding source">
          <button type="button" className={fundingSource === "wallet" ? "small-action active" : "small-action"} aria-pressed={fundingSource === "wallet"} onClick={() => setFundingSource("wallet")}>Wallet</button>
          {snapshot.demo?.active && <button type="button" className={fundingSource === "demo" ? "small-action active" : "small-action"} aria-pressed={fundingSource === "demo"} onClick={() => setFundingSource("demo")}>Demo pool · {money(snapshot.demo?.available_usd || 0)}</button>}
          {Number(snapshot.demo?.credit_available_usd || 0) > 0 && <button type="button" className={fundingSource === "credit" ? "small-action active" : "small-action"} aria-pressed={fundingSource === "credit"} onClick={() => setFundingSource("credit")}>Trading credit · {money(Number(snapshot.demo?.credit_available_usd || 0))}</button>}
        </div>}
        <div className="fact-block"><span>{fundingSource === "demo" ? "Demo margin · 1:1" : fundingSource === "credit" ? "Credit margin · 1:1" : "Margin · 1:1"} <b>{money(Number(amount) || 0)}</b></span><span>Manual capacity <b>{money(Number(snapshot.allocation?.manual_available_usd || snapshot.allocation?.available_usd || 0))}</b></span></div>
        <section className="synthetic-contract-selector" aria-labelledby="manual-contract-title">
          <div className="synthetic-contract-heading"><div><span className="eyebrow" id="manual-contract-title">MANUAL CONTRACT</span><small>Choose the lifecycle before you review an order.</small></div><div className="synthetic-contract-info"><button type="button" className="small-action" aria-label="About contract types" aria-expanded={contractInfoExpanded(contractInfo)} aria-controls="manual-contract-help" aria-describedby={contractInfoExpanded(contractInfo) ? "manual-contract-help" : undefined} onMouseEnter={() => setContractInfo((current) => contractInfoHover(current, true))} onMouseLeave={() => setContractInfo((current) => contractInfoHover(current, false))} onFocus={() => setContractInfo((current) => contractInfoFocus(current, true))} onBlur={() => setContractInfo((current) => contractInfoFocus(current, false))} onClick={() => setContractInfo(activateContractInfo)}><span aria-hidden="true">i</span></button>{contractInfoExpanded(contractInfo) && <div id="manual-contract-help" role="tooltip" className="synthetic-contract-tooltip">Fixed duration closes on its stated schedule. Open-ended stays open until you close it or its stop/cap is reached. Auto terms are chosen privately by TradePulse and are shown only after execution.</div>}</div></div>
          <div className="synthetic-contract-options" role="radiogroup" aria-label="Manual contract type">
            <button type="button" role="radio" aria-checked={manualContract === "fixed"} className={manualContract === "fixed" ? "selected" : ""} onClick={() => setManualContract("fixed")}><strong>Fixed duration</strong><small>Closes on a defined schedule. This is the default.</small></button>
            <button type="button" role="radio" aria-checked={manualContract === "open_ended"} className={manualContract === "open_ended" ? "selected" : ""} onClick={() => setManualContract("open_ended")}><strong>Open-ended</strong><small>Stays open until you close it or protection closes it.</small></button>
          </div>
          {manualContract === "open_ended" && <div className="synthetic-contract-risk"><label className="amount-field">Maximum loss cap ({MINIMUM_OPEN_ENDED_LOSS_CAP}%–{MAXIMUM_OPEN_ENDED_LOSS_CAP}%)<input value={maximumLossPercent} onChange={(event) => setMaximumLossPercent(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" aria-label="Open-ended maximum loss cap percentage" aria-invalid={Boolean(openEndedTerms && !openEndedTerms.valid)} /></label><label className="amount-field">Optional tighter stop (at least {MINIMUM_OPEN_ENDED_LOSS_CAP}%)<input value={manualStopLossPercent} onChange={(event) => setManualStopLossPercent(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" aria-label="Open-ended optional tighter stop percentage" placeholder="No additional stop" aria-invalid={Boolean(openEndedTerms && !openEndedTerms.valid)} /></label><small>Protection is capped at the percentage shown. A tighter stop must be between {MINIMUM_OPEN_ENDED_LOSS_CAP}% and the cap.</small>{openEndedTerms && !openEndedTerms.valid && <p role="alert">{openEndedTerms.error}</p>}</div>}
        </section>
        <div className="button-row" role="group" aria-label="Execution mode"><button className={snapshot.execution_mode === "MANUAL" ? "small-action active" : "small-action"} disabled={pendingFor(manualKey) || Boolean(executionTransition)} onClick={() => void act("/v1/synthetic/settings/execution-mode", { execution_mode: "MANUAL" }).catch(() => undefined)}>{executionTransition === "MANUAL" ? "Switching…" : pendingFor(manualKey) ? "Saving…" : "Manual review"}</button><span className={"status-chip " + (executionTransition === "AUTO" || snapshot.execution_mode === "AUTO" ? "running" : "paused")} aria-live="polite"><i />{executionTransition === "AUTO" ? "Enabling Auto…" : executionTransition === "MANUAL" ? "Returning to manual…" : "Auto " + (snapshot.execution_mode === "AUTO" ? "on" : "off")}</span></div>
        <label className="amount-field">Auto amount per order<input value={autoAmount} onChange={(event) => setAutoAmount(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" aria-label="Automatic Synthetic order size" /></label>
        <label className="amount-field">Set aside for Auto<input value={autoAllocation} onChange={(event) => setAutoAllocation(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" aria-label="Automatic Synthetic allocation" /></label>
        <p>Auto: {money(Number(snapshot.execution?.auto_available_usd || 0))} reserved · Manual: {money(Number(snapshot.execution?.manual_available_usd || snapshot.allocation?.available_usd || 0))} available</p>
        <button className="primary-action" disabled={!snapshot.live_disclosure_accepted || pendingFor(autoKey) || Boolean(executionTransition) || Number(autoAmount) < 20 || Number(autoAllocation) < Number(autoAmount)} onClick={() => openReview("auto")}>{executionTransition === "AUTO" ? "Enabling Auto…" : snapshot.execution_mode === "AUTO" ? "Review Auto changes" : "Review & enable Auto"}</button>
        {Number(autoAllocation) < Number(autoAmount) && <p role="status">Set aside at least {money(Math.max(20, Number(autoAmount) || 20))} for Auto to enable review. Manual capacity stays separate.</p>}
        {snapshot.execution_mode === "AUTO" && <><p>Automatic uses the confirmed per-order margin within its assigned capacity.</p><div className="activity-row" role="status" aria-live="polite"><div className="activity-info"><strong>{autoActivityTitle}</strong><small>{autoActivityDetail}</small></div></div></>}
        <div className="button-row" role="group" aria-label="Manual orders"><button className="small-action" disabled={!snapshot.live_disclosure_accepted || manualOrderPending("long")} onClick={() => openReview("long")}>{manualOrderPending("long") ? "Submitting…" : "Review Long"}</button><button className="small-action" disabled={!snapshot.live_disclosure_accepted || manualOrderPending("short")} onClick={() => openReview("short")}>{manualOrderPending("short") ? "Submitting…" : "Review Short"}</button></div>
        {signals.filter((signal) => signal.expires_at * 1000 > now).slice(0, 3).map((signal) => { const key = "signal:" + signal.id + ":approve"; const submitted = Boolean(signalResults[signal.id]) || snapshot.positions.some((position) => position.signal_id === signal.id); return <div className="activity-row" key={signal.id}><div className="activity-info"><strong>{signal.market} · {signal.direction} signal</strong><small>Reference {Number(signal.reference_price).toFixed(5)} · Expires in {Math.max(0, Math.ceil((signal.expires_at * 1000 - now) / 1000))}s</small></div><button className="small-action" disabled={!snapshot.live_disclosure_accepted || pendingFor(key) || submitted} onClick={() => openReview("approve", signal)}>{pendingFor(key) ? "Approving…" : submitted ? "Submitted" : "Review signal"}</button></div>; })}
        {signalError ? <p role="status">{signalError}</p> : !signals.some((signal) => signal.expires_at * 1000 > now) && <p role="status">No current signals. Waiting for the next update.</p>}
      </> : account.user.is_admin ? <div className="button-row"><button className="small-action" onClick={() => void act("/v1/synthetic/actions", { action: "open", market, direction: "long", amount: 20 }).catch(() => undefined)}>Open $20 long</button><button className="small-action" onClick={() => void act("/v1/synthetic/actions", { action: "open", market, direction: "short", amount: 20 }).catch(() => undefined)}>Open $20 short</button><button className="danger-action" onClick={() => void act("/v1/synthetic/actions", { action: "reset" }).catch(() => undefined)}>Reset virtual balance</button></div> : <p>Testnet is reserved for administrator testing. Switch to mainnet for live synthetic access.</p>}
      {snapshot.positions.filter((position) => position.status === "open").map((position) => { const key = "synthetic-position:" + position.id + ":close"; const expiry = Number(position.contract_expires_at); const secondsToExpiry = Number.isFinite(expiry) ? Math.ceil(expiry - now / 1000) : null; const expiryStatus = normaliseManualContractType(position.contract_type) === "fixed" && secondsToExpiry !== null ? secondsToExpiry > 0 ? " · scheduled close in " + secondsToExpiry + "s" : " · expiry reached; awaiting settlement" : ""; return <div className="activity-row" key={position.id}><div className="activity-info"><strong>{position.market} · {position.direction}</strong><small>{liveNetPnlLabel(Number(position.user_net_unrealized_pnl_usd || 0))} · {money(position.margin_usd)} reserved · {position.clearing_type || "PRINCIPAL"}</small><small>Spread {money(position.spread_charged_usd || 0)} · tier fee {money(position.tier_fee_usd || 0)}</small><small className="synthetic-contract-record">{contractTypeLabel(position.contract_type)}{normaliseManualContractType(position.contract_type) === "open_ended" && Number.isFinite(Number(position.maximum_loss_percent)) ? " · max loss " + Number(position.maximum_loss_percent) + "%" : ""}{Number.isFinite(Number(position.manual_stop_loss_percent)) ? " · stop " + Number(position.manual_stop_loss_percent) + "%" : ""}{expiryStatus} · {contractReasonLabel(position.contract_reason)}</small></div><button className="small-action" disabled={pendingFor(key)} onClick={() => void act("/v1/synthetic/positions/" + position.id + "/close", {}).catch(() => undefined)}>{pendingFor(key) ? "Closing…" : "Close"}</button></div>; })}
    </div>
  </div>
  {helpOpen && <AccessibleDialog label="How Synthetic quotes work" onClose={() => setHelpOpen(false)}><span className="eyebrow">SYNTHETIC QUOTES</span><h2>How quotes work</h2><p>Each index uses TradePulse’s shared model feed. The displayed reference updates about once a second; it is not an external spot-market price.</p><div className="fact-block"><span>ORDER PRICE <b>Checked again at execution</b></span><span>SPREAD <b>Shown before review</b></span><span>TIER FEE <b>Applied at execution</b></span></div><p>A stale or unavailable quote prevents a new order. Existing positions remain unchanged until a valid close can be priced.</p><button type="button" className="primary-action" onClick={() => setHelpOpen(false)}>Back to market</button></AccessibleDialog>}
  {review && <AccessibleDialog label={review.kind === "auto" ? "Review automatic execution" : "Review synthetic order"} onClose={() => setReview(null)}><span className="eyebrow">MAINNET / FINAL REVIEW</span><h2>{review.kind === "auto" ? "Enable automatic execution?" : review.market + " · " + review.direction.toUpperCase()}</h2><div className="fact-block"><span>EXECUTION <b>{review.kind === "auto" ? "AUTO" : "MANUAL ORDER"}</b></span><span>{review.kind === "auto" ? "MARGIN PER AUTO ORDER" : "MARGIN / 1:1"} <b>{money(review.amount)}</b></span>{review.kind === "auto" && <span>AUTO CAPACITY <b>{money(Number((review.payload as { auto_allocation_usd?: number }).auto_allocation_usd || 0))}</b></span>}{review.kind !== "auto" && <><span>REQUESTED CONTRACT <b>{contractTypeLabel(review.manualContract)}</b></span>{review.manualContract === "open_ended" && <span>MAXIMUM LOSS CAP <b>{review.maximumLossPercent}%</b></span>}{review.manualContract === "open_ended" && review.manualStopLossPercent && <span>OPTIONAL TIGHTER STOP <b>{review.manualStopLossPercent}%</b></span>}</>}<span>ESTIMATED TIER FEE <b>{money(review.fee)}</b></span></div><p>{review.kind === "auto" ? "Auto terms are chosen by TradePulse after its private checks. The confirmed type, cap and reason appear on the resulting order." : "The server confirms the final contract terms at execution; the resulting order shows its immutable type, cap and reason."} You can lose the full reserved margin. Prices may change during review.</p>{review.kind === "auto" && <label className="toggle-row"><span>I understand Auto uses only the stated Auto capacity and margin per order. Manual orders use the remaining Synthetic capacity.</span><input type="checkbox" checked={autoAcknowledged} disabled={activeReviewActionPending} onChange={(event) => setAutoAcknowledged(event.target.checked)} /><i aria-hidden="true" /></label>}{review.signal && <p role="status">{review.signal.expires_at * 1000 <= now ? "Signal expired. Go back for a fresh signal." : "Signal is current."}</p>}{reviewError && <p role="alert">{reviewError}</p>}<button className="primary-action" disabled={activeReviewActionPending || Boolean(review.signal && review.signal.expires_at * 1000 <= now) || (review.kind === "auto" && !autoAcknowledged)} onClick={() => void confirm()}><ActionFeedback state={activeReviewActionPending ? "pending" : reviewError ? "error" : "idle"}>{activeReviewActionPending ? "Submitting…" : review.kind === "auto" ? "Confirm Auto execution" : review.kind === "approve" ? "Confirm signal approval" : "Confirm " + review.direction}</ActionFeedback></button>{activeReviewActionPending && <p role="status">The request is submitting. You may return to the controls; this does not cancel it. Its result will appear on the desk.</p>}<button type="button" className="ghost-action" onClick={() => setReview(null)}>{activeReviewActionPending ? "Return to controls" : "Go back"}</button></AccessibleDialog>}
  </div>;
  return <div className="desk-screen"><div className="gradient-panel synthetic-pilot"><div className="activity-row" role="status"><div className="activity-info"><strong>{loadError ? "Market data is temporarily unavailable" : "Loading " + market}</strong><small>{loadError ? "The desk will retry automatically. Existing orders and positions are unchanged." : "Retrieving the current model quote and order state."}</small></div></div></div></div>;
}
