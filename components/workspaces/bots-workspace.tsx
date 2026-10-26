"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { AccessibleDialog } from "../accessible-dialog";
import { ActionFeedback } from "../ui/action-feedback";
import { formatSettlementExitReason } from "../../lib/settlement-label";
import type { WorkspaceDashboard } from "./workspace-dashboard";
import { MarketChart, formatMarketPrice, type MarketCandle, type MarketPoint } from "./market-chart";
import { ChevronRight, GradientPanel, PaymentMark, Plus, StateIcon, StateSwapIcon, X, Zap, money } from "./shared-ui";

function BotProductCard({ name, description, icon, selected, onClick }: { name: string; description: string; icon: string; selected?: boolean; onClick: () => void }) {
  return <button className={`product-card ${selected ? "selected" : ""}`} onClick={onClick}><span className="product-icon">{icon}</span><span><strong>{name}</strong><small>{description}</small></span><ChevronRight /></button>;
}
function EmptyBots({ onLaunch }: { onLaunch?: () => void }) {
  return <GradientPanel className="empty-bots"><img src="/illustrations/empty-bots.png" alt="Empty wallet scene with a butterfly" className="illustration-empty-bots pointer-events-none select-none" draggable={false} decoding="async" loading="eager" /><p>No bots are running yet.</p><button className="empty-bots-action" onClick={onLaunch}>Launch your first bot <ChevronRight size={14} /></button></GradientPanel>;
}

const memecoinNames: Record<string, string> = {
  DOGE: "Dogecoin", SHIB: "Shiba Inu", PEPE: "Pepe", WIF: "dogwifhat", BONK: "Bonk",
};
const memecoinLogos: Record<string, string> = {
  DOGE: "/icons/crypto/doge.svg", SHIB: "/icons/crypto/shib.svg", PEPE: "/icons/crypto/pepe.svg",
  WIF: "/icons/crypto/wif.png", BONK: "/icons/crypto/bonk.svg",
};

function MemecoinMark({ symbol, compact = false }: { symbol: string; compact?: boolean }) {
  const normalized = symbol.toUpperCase();
  const size = compact ? 16 : 18;
  const source = memecoinLogos[normalized];
  return source
    ? <img className="memecoin-mark" src={source} alt="" aria-hidden="true" width={size} height={size} />
    : <span className="memecoin-mark memecoin-mark-fallback" aria-hidden="true" style={{ width: size, height: size }}>{normalized.slice(0, 1)}</span>;
}

function percentageFromMargin(amount: number, margin: number) {
  return margin > 0 ? (amount / margin) * 100 : 0;
}

function percentageLabel(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function remainingTargetLabel(mark: number, target: number, direction: string) {
  const distance = direction.toLowerCase() === "short"
    ? ((mark - target) / mark) * 100
    : ((target - mark) / mark) * 100;
  return distance <= 0.005 ? "Target reached" : `Target ${distance.toFixed(2)}% away`;
}

function remainingStopLabel(mark: number, stop: number, direction: string) {
  const distance = direction.toLowerCase() === "short"
    ? ((stop - mark) / mark) * 100
    : ((mark - stop) / mark) * 100;
  return distance <= 0.005 ? "Stop crossed" : `Stop ${distance.toFixed(2)}% away`;
}

type MemecoinEvent = { id: string; kind: string; created_at: number; payload?: Record<string, unknown> };
type DisplayMemecoinEvent = MemecoinEvent & { reviewCount?: number };

function compactMemecoinEvents(events: MemecoinEvent[]) {
  const compacted: DisplayMemecoinEvent[] = [];
  for (const event of events.slice(-12)) {
    const isHold = event.kind === "strategy_decision" && event.payload?.decision === "hold";
    const priorHoldIndex = isHold ? compacted.findIndex((item) => item.kind === "strategy_decision" && item.payload?.decision === "hold") : -1;
    if (priorHoldIndex >= 0) {
      const prior = compacted[priorHoldIndex];
      compacted[priorHoldIndex] = { ...event, reviewCount: Number(prior.reviewCount || 1) + 1 };
    } else {
      compacted.push({ ...event, reviewCount: isHold ? 1 : undefined });
    }
  }
  return compacted.slice(-4);
}

function handleBotChoiceKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const choices = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="radio"]:not(:disabled):not([aria-disabled="true"])'));
  const index = choices.findIndex((choice) => choice === event.target);
  if (index < 0) return;
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1
    : (index + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + choices.length) % choices.length;
  choices[next].focus();
  choices[next].click();
}

function createMemecoinOrderIdempotencyKey(userId: number, botId: string) {
  const nonce = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `memecoin:${userId}:${botId}:${nonce}`;
}

export function BotsWorkspace({
  data,
  request,
  reload,
  onActionResult,
  onNotice,
  onOpenDemo,
  initialBotId = null,
}: {
  data: WorkspaceDashboard;
  request: (path: string, options?: RequestInit) => Promise<any>;
  reload: () => Promise<void>;
  onActionResult: (path: string, payload: Record<string, unknown>, response: Record<string, unknown>) => void;
  onNotice: (message: string) => void;
  onOpenDemo: () => void;
  initialBotId?: string | null;
}) {
  const [view, setView] = useState<"fleet" | "create" | "detail" | "flashback">(
    initialBotId ? "detail" : "fleet",
  );
  const [product, setProduct] = useState<"memecoin" | "synthetic">("memecoin");
  const [amount, setAmount] = useState("20");
  const [review, setReview] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialBotId);
  // Pending state is scoped to the action and its resource. A slow request on
  // one bot must never make another bot, position, or Flashback control look
  // like it is processing.
  const [pendingActions, setPendingActions] = useState<Record<string, boolean>>({});
  const [reviewError, setReviewError] = useState("");
  const [closeReview, setCloseReview] = useState(false);
  const [flashbackAmount, setFlashbackAmount] = useState(20);
  const [flashbackReview, setFlashbackReview] = useState(false);
  const [flashbackNewSession, setFlashbackNewSession] = useState(false);
  const [selectedFlashbackId, setSelectedFlashbackId] = useState<string | null>(null);
  const [flashbackType, setFlashbackType] = useState<"sealed" | "direction" | null>(null);
  const [flashbackDirectionMarket, setFlashbackDirectionMarket] = useState("");
  const [flashbackDirectionChoice, setFlashbackDirectionChoice] = useState<"up" | "down" | null>(null);
  const [flashbackNow, setFlashbackNow] = useState(() => Date.now());
  const [flashbackClockOffset, setFlashbackClockOffset] = useState(0);
  const [compoundOverrides, setCompoundOverrides] = useState<Record<string, number>>({});
  const [allocationDeltas, setAllocationDeltas] = useState<Record<string, number>>({});
  const [stateOverrides, setStateOverrides] = useState<Record<string, string>>({});
  const [closedBotIds, setClosedBotIds] = useState<string[]>([]);
  const [memecoinMarket, setMemecoinMarket] = useState("DOGE");
  const [memecoinAssets, setMemecoinAssets] = useState<string[]>(["DOGE", "SHIB", "PEPE", "WIF", "BONK"]);
  const [memecoinLeverage, setMemecoinLeverage] = useState(3);
  const [memecoinCadence, setMemecoinCadence] = useState(300);
  const [memecoinAutoEnabled, setMemecoinAutoEnabled] = useState(false);
  const [includeTrench, setIncludeTrench] = useState(false);
  const [memecoinAssetCategories, setMemecoinAssetCategories] = useState<Record<string, string>>({
    DOGE: "bluechip", SHIB: "bluechip", PEPE: "midcap", WIF: "midcap", BONK: "midcap",
  });
  const [memecoinCatalog, setMemecoinCatalog] = useState<Array<{ symbol: string; name?: string; category?: string; venue?: string; chain?: string; chain_label?: string; token_address?: string; eligible?: boolean }>>([]);
  const [memecoinInsights, setMemecoinInsights] = useState<Record<string, { available?: boolean; completed_positions?: number; participant_count?: number; positive_position_rate?: number }>>({});
  const [basketPickerOpen, setBasketPickerOpen] = useState(false);
  const [basketPickerLoading, setBasketPickerLoading] = useState(false);
  const [basketPickerError, setBasketPickerError] = useState("");
  const [basketQuery, setBasketQuery] = useState("");
  const [memecoinSnapshot, setMemecoinSnapshot] = useState<{ points?: MarketPoint[]; candles?: MarketCandle[]; latest?: { source?: string }; positions?: Array<{ id: string; symbol: string; direction: string; status: string; margin_usd: number; entry_price: number; mark_price?: number; unrealized_pnl?: number; realized_pnl?: number; close_reason?: string; stop_loss_price?: number; take_profit_price?: number; execution_type?: "automatic" | "manual"; idempotency_key?: string }>; events?: MemecoinEvent[] }>({});
  const [memecoinOrder, setMemecoinOrder] = useState<{
    direction: "long" | "short";
    source: "wallet" | "demo" | "credit";
    amount: string;
    idempotencyKey: string;
  } | null>(null);
  useEffect(() => {
    setSelectedId(initialBotId);
    setView(initialBotId ? "detail" : "fleet");
  }, [initialBotId]);
  const displayBots = data.bots
    .filter((bot) => !closedBotIds.includes(bot.id))
    .map((bot) => ({
      ...bot,
      state: stateOverrides[bot.id] ?? bot.state,
      compound_percent: compoundOverrides[bot.id] ?? bot.compound_percent,
      capital_usd: bot.capital_usd + (allocationDeltas[bot.id] || 0),
    }));
  const selected =
    displayBots.find((bot) => bot.id === selectedId) || displayBots[0];
  const runningStrategies = displayBots.filter((bot) => bot.state === "running" && !bot.demo_credit_only);
  const latestFlashback = data.flashback || null;
  const flashbackSessions = data.flashback_sessions || (latestFlashback ? [latestFlashback] : []);
  const activeFlashbacks = flashbackSessions.filter((session) => session.state === "sealed" || session.state === "ready_to_reveal");
  // The selected contract is a reading choice. Its state must never pause the
  // clock for another contract that is still live.
  const activeCountdownSession = activeFlashbacks.find((session) => session.state === "sealed") || null;
  const flashback = flashbackSessions.find((session) => session.id === selectedFlashbackId) || flashbackSessions[0] || null;
  const flashbackSessionIds = flashbackSessions.map((session) => session.id).join("|");
  const flashbackSessionChoices = [
    ...activeFlashbacks,
    ...(flashback && !activeFlashbacks.some((session) => session.id === flashback.id) ? [flashback] : []),
  ];
  const flashbackAvailable = String(data.environment || "").toLowerCase() === "mainnet";
  const flashbackRules = data.flashback_rules;
  const flashbackDirection = data.flashback_direction;
  const directionMarkets = flashbackDirection?.markets || [];
  const directionContract = flashback?.product_version === "market-direction-v1";
  const liveDirectionReference = directionContract ? flashback?.live_reference : undefined;
  const directionMultiplier = (amount: number) => Number(flashbackDirection?.schedule?.find((item) => item.up_to_usd === null || amount <= Number(item.up_to_usd))?.multiplier || 0);
  const flashbackReturnTable = (amount: number) => {
    const band = flashbackRules?.bands?.find((item) => item.up_to_usd === null || amount <= Number(item.up_to_usd));
    return band?.table || flashbackRules?.payout_tables?.[String(amount)] || [];
  };
  const flashbackTableSummary = (table: Array<{ multiplier: number; probability: number }>) => {
    const probability = (lower: number, upper: number) => table.reduce((total, row) => total + (Number(row.multiplier) >= lower && Number(row.multiplier) <= upper ? Number(row.probability) : 0), 0);
    return [
      ["CRASH", `${(probability(0, 0) * 100).toFixed(1)}%`],
      ["LADDER", "1.01×–3.00× / 0.01× steps"],
      ["1.01×–1.50×", `${(probability(1.01, 1.5) * 100).toFixed(1)}%`],
      ["1.51×–3.00×", `${(probability(1.51, 3) * 100).toFixed(1)}%`],
    ] as const;
  };
  const sealedReturn = flashback?.product_version === "sealed-return-v2";
  const sealedEntropyRefund = sealedReturn && flashback?.close_reason === "entropy_unavailable_refund";
  useEffect(() => {
    setSelectedFlashbackId((current) => flashbackSessions.some((session) => session.id === current)
      ? current
      : flashbackSessions[0]?.id || null);
  }, [flashbackSessionIds]);
  useEffect(() => {
    const clientNow = Date.now();
    const serverSeconds = Number(data.server_time);
    const serverNow = Number.isFinite(serverSeconds) && serverSeconds > 0
      ? serverSeconds * 1000
      : clientNow;
    setFlashbackClockOffset(serverNow - clientNow);
    setFlashbackNow(clientNow);
  }, [data.server_time]);
  useEffect(() => {
    if (view !== "flashback" || !activeCountdownSession) return;
    const tick = () => setFlashbackNow(Date.now());
    const refreshSession = async () => {
      try {
        const snapshot = await request("/v1/flashback");
        if (!snapshot?.session || typeof snapshot.session !== "object") return;
        onActionResult("/v1/flashback/refresh", {}, snapshot);
      } catch {
        // The countdown remains useful while the targeted status check retries.
      }
    };
    tick();
    const countdown = window.setInterval(tick, 1_000);
    // Both 30-second contracts need prompt authoritative status confirmation.
    // Direction additionally returns its display-only live reference here.
    const refresh = window.setInterval(() => void refreshSession(), 3_000);
    return () => {
      window.clearInterval(countdown);
      window.clearInterval(refresh);
    };
  }, [activeCountdownSession?.expires_at, activeCountdownSession?.id, activeCountdownSession?.product_version, onActionResult, request, view]);
  const refreshMemecoinCatalog = useCallback(async () => {
    const response = await request("/v1/memecoin/catalog");
    const assets = Array.isArray(response.assets)
      ? response.assets.filter((asset: { eligible?: boolean; symbol?: string }) => Boolean(asset.eligible) && Boolean(asset.symbol))
      : [];
    setMemecoinCatalog(assets);
    setMemecoinAssetCategories((current) => ({
      ...current,
      ...Object.fromEntries(assets
        .filter((asset: { category?: string }) => ["bluechip", "midcap", "microcap"].includes(String(asset.category)))
        .map((asset: { symbol: string; category?: string }) => [asset.symbol, String(asset.category)])),
    }));
  }, [request]);
  useEffect(() => {
    setCompoundOverrides((current) => {
      let changed = false;
      const next = { ...current };
      for (const [botId, percent] of Object.entries(current)) {
        const bot = data.bots.find((item) => item.id === botId);
        if (bot && bot.compound_percent === percent) {
          delete next[botId];
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [data.bots]);
  useEffect(() => {
    if (!selected || selected.product !== "memecoin") return;
    // New and projected credit-only Memecoin desks must never imply that
    // automatic trading was enabled. Saved funded/demo settings can opt in.
    setMemecoinAssets(["DOGE", "SHIB", "PEPE", "WIF", "BONK"]);
    setMemecoinLeverage(3);
    setMemecoinCadence(300);
    setMemecoinAutoEnabled(false);
    setIncludeTrench(false);
    setMemecoinAssetCategories({ DOGE: "bluechip", SHIB: "bluechip", PEPE: "midcap", WIF: "midcap", BONK: "midcap" });
    if (selected.demo_credit_only) return;
    const encoded = selected.demo_trial
      ? data.memecoin?.demo_authorization?.settings_json
      : data.memecoin?.authorization?.settings_json;
    if (!encoded) return;
    try {
      const settings = JSON.parse(encoded) as Record<string, unknown>;
      const assets = Array.isArray(settings.assets)
        ? settings.assets.map((item) => {
            const value = String(item).trim();
            return value.length > 20 ? value : value.toUpperCase();
          }).filter(Boolean)
        : [];
      if (assets.length) setMemecoinAssets(assets);
      if (settings.asset_categories && typeof settings.asset_categories === "object") {
        setMemecoinAssetCategories((current) => ({ ...current, ...Object.fromEntries(
          Object.entries(settings.asset_categories as Record<string, unknown>)
            .filter(([, category]) => ["bluechip", "midcap", "microcap"].includes(String(category)))
            .map(([asset, category]) => [asset, String(category)]),
        ) }));
      }
      if ([1, 3, 5, 10].includes(Number(settings.leverage))) setMemecoinLeverage(Number(settings.leverage));
      if ([60, 300, 900].includes(Number(settings.cadence_seconds))) setMemecoinCadence(Number(settings.cadence_seconds));
      if (typeof settings.auto_enabled === "boolean") setMemecoinAutoEnabled(settings.auto_enabled);
      if (typeof settings.include_trench === "boolean") setIncludeTrench(settings.include_trench);
    } catch {
      // An older authorization record should not prevent the default controls
      // from rendering or change the customer's existing allocation.
    }
  }, [selected?.id, selected?.product, selected?.demo_trial, selected?.demo_credit_only, data.memecoin?.authorization?.settings_json, data.memecoin?.demo_authorization?.settings_json]);
  useEffect(() => {
    if (!selected || selected.product !== "memecoin") return;
    void refreshMemecoinCatalog().catch(() => {
      // A label refresh cannot interrupt the existing market or order view.
    });
  }, [selected?.id, selected?.product, refreshMemecoinCatalog]);
  const openBasketPicker = async () => {
    setBasketPickerOpen(true);
    setBasketPickerError("");
    setBasketQuery("");
    setBasketPickerLoading(true);
    try {
      await refreshMemecoinCatalog();
    } catch (error) {
      setBasketPickerError(error instanceof Error ? error.message : "Eligible strategy markets are temporarily unavailable.");
    } finally {
      setBasketPickerLoading(false);
    }
  };
  const memecoinMarketLabel = (symbol: string) => {
    const catalogueName = memecoinCatalog.find((asset) => asset.symbol === symbol)?.name;
    return catalogueName || memecoinNames[symbol.toUpperCase()] || "Memecoin market";
  };
  const memecoinPositionIdentity = (symbol: string) => {
    const catalogueAsset = memecoinCatalog.find((asset) => asset.symbol === symbol);
    const approvedName = catalogueAsset?.name || memecoinNames[symbol.toUpperCase()];
    return {
      chainLabel: catalogueAsset?.chain_label,
      label: approvedName || "Memecoin market",
      title: approvedName || "Market label is being verified",
    };
  };
  const memecoinInsightLabel = (symbol: string) => {
    const insight = memecoinInsights[symbol];
    if (!insight?.available) return "All-time settled market evidence is not published until the privacy-safe sample threshold is met.";
    return `All-time settled mainnet result: ${insight.positive_position_rate}% of ${insight.completed_positions} completed wallet-funded positions closed positive across ${insight.participant_count} participants. Historical results are not a forecast.`;
  };
  useEffect(() => {
    if (memecoinAssets.length && !memecoinAssets.includes(memecoinMarket)) {
      setMemecoinMarket(memecoinAssets[0]);
    }
  }, [memecoinAssets, memecoinMarket]);
  useEffect(() => {
    if (!selected || selected.product !== "memecoin") return;
    let cancelled = false;
    const refresh = () => {
      void request(`/v1/memecoin/snapshot?bot_id=${selected.id}&symbol=${memecoinMarket}`)
        .then((snapshot) => { if (!cancelled) setMemecoinSnapshot(snapshot || {}); })
        .catch(() => {
          // Keep the last verified candles and marks visible during a short
          // reconnect; clearing the projection made a healthy feed look empty.
        });
    };
    refresh();
    // This endpoint includes chart history, positions and events. Polling the
    // full projection every second can starve an authorization request on a
    // constrained connection; execution still revalidates the live tick on
    // the server, independently of this display refresh.
    const timer = window.setInterval(refresh, 5_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [selected?.id, selected?.product, memecoinMarket, request]);
  useEffect(() => {
    if (!selected || selected.product !== "memecoin" || !memecoinAssets.length) return;
    let cancelled = false;
    const query = memecoinAssets.map((symbol) => `symbol=${encodeURIComponent(symbol)}`).join("&");
    void request(`/v1/memecoin/insights?${query}`)
      .then((response) => {
        if (cancelled || !Array.isArray(response.insights)) return;
        setMemecoinInsights(Object.fromEntries(response.insights
          .filter((item: { symbol?: string }) => Boolean(item.symbol))
          .map((item: { symbol: string; available?: boolean; completed_positions?: number; participant_count?: number; positive_position_rate?: number }) => [item.symbol, item])));
      })
      .catch(() => { if (!cancelled) setMemecoinInsights({}); });
    return () => { cancelled = true; };
  }, [selected?.id, selected?.product, memecoinAssets, request]);
  const actionKeyFor = (path: string, payload: Record<string, unknown>) => {
    const botAction = path.match(/^\/v1\/bots\/(\d+)\/actions$/);
    if (botAction) return `bot:${botAction[1]}:${String(payload.action || "action")}`;
    const position = path.match(/^\/v1\/memecoin\/positions\/([^/]+)\/close$/);
    if (position) return `memecoin-position:${position[1]}:close`;
    if (path === "/v1/memecoin/orders") return `memecoin-order:${String(payload.bot_id || "new")}`;
    if (path === "/v1/flashback/start") return "flashback:start";
    if (path === "/v1/flashback/direction/start") return "flashback:direction:start";
    if (path === "/v1/flashback/reveal") return `flashback:reveal:${String(payload.session_id || "current")}`;
    if (path === "/v1/bots") return "bot:create";
    return path;
  };
  const isActionPending = (key: string) => Boolean(pendingActions[key]);
  const run = async (path: string, payload: Record<string, unknown>) => {
    const actionKey = actionKeyFor(path, payload);
    if (isActionPending(actionKey)) return false;
    // Authorization persists a funded risk disclosure and the customer's
    // strategy controls in one transaction. Give that durable result enough
    // time to return instead of surfacing a browser abort as a refusal.
    const durableAction = path === `/v1/bots/${selected.id}/actions` && payload.action === "authorize";
    setReviewError("");
    setPendingActions((current) => ({ ...current, [actionKey]: true }));
    try {
      const response = await request(path, {
        method: "POST",
        body: JSON.stringify(payload),
      }, undefined, durableAction ? 40_000 : undefined);
      onNotice(response.message || "Saved successfully.");
      // The parent owns the desk snapshot. Apply an authoritative response
      // there rather than reaching across component scope; only responses
      // without a usable projection are reconciled in the background. The
      // completed action should not remain stuck behind a full dashboard load.
      if (response.bot || response.wallet || response.position || response.session) {
        onActionResult(path, payload, response);
      } else {
        void reload().catch(() => undefined);
      }
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Action failed.";
      setReviewError(message);
      onNotice(message);
      return false;
    } finally {
      setPendingActions((current) => {
        const next = { ...current };
        delete next[actionKey];
        return next;
      });
    }
  };
  const updateCompound = async (percent: number) => {
    const botId = selected?.id;
    if (!botId || isActionPending(`bot:${botId}:compound`) || selected.compound_percent === percent) return;
    const hadOverride = Object.prototype.hasOwnProperty.call(compoundOverrides, botId);
    const previous = compoundOverrides[botId] ?? selected.compound_percent;
    setCompoundOverrides((current) => ({ ...current, [botId]: percent }));
    const saved = await run(`/v1/bots/${botId}/actions`, {
      action: "compound",
      percent,
    });
    if (saved) return;
    setCompoundOverrides((current) => {
      if (hadOverride) return { ...current, [botId]: previous };
      const next = { ...current };
      delete next[botId];
      return next;
    });
  };
  const productLabel =
    product === "memecoin" ? "Memecoin" : "Synthetic Indices";
  const flashbackRemaining = flashback?.state === "sealed" && flashback.expires_at
    ? Math.max(0, Math.ceil((flashback.expires_at * 1000 - (flashbackNow + flashbackClockOffset)) / 1000))
    : 0;
  const flashbackTimeLabel = `${Math.floor(flashbackRemaining / 60)}:${String(flashbackRemaining % 60).padStart(2, "0")}`;
  const flashbackFleetState = flashback?.state || "available";
  const flashbackFleetStatus = flashbackFleetState === "sealed"
    ? "sealed"
    : flashbackFleetState === "ready_to_reveal"
      ? "ready to reveal"
      : flashbackFleetState === "revealed"
        ? "settled"
        : "available";
  const flashbackFleetTone = flashbackFleetState === "ready_to_reveal" || flashbackFleetState === "revealed"
    ? "running"
    : "paused";
  const flashbackFleetAction = flashbackFleetState === "ready_to_reveal"
    ? "Reveal result"
    : flashbackFleetState === "revealed"
      ? "Review Flashback"
      : flashbackFleetState === "sealed"
        ? "View session"
        : "Open Flashback";
  const flashbackFleetCard = flashbackAvailable ? (
    <GradientPanel className="fleet-bot-card reveal-card" key="flashback">
      <div className="fleet-bot-head">
        <div>
          <div className="bot-title">
            <strong>Flashback</strong>
            <span className={`status-chip ${flashbackFleetTone}`}>
              <i />
              {flashbackFleetStatus}
            </span>
          </div>
          <span className="eyebrow">{directionContract ? "FLASHBACK DIRECTION" : "SEALED RETURN"}</span>
          <strong className="fleet-amount">
            {flashback ? money(Number(flashback.allocation_usd || 0)) : "Choose an entry"}
          </strong>
        </div>
      </div>
      <div className="fleet-metrics">
        {!flashback && <>
          <div><span>ENTRY RANGE</span><strong>{money(Number(flashbackRules?.min_entry_usd || 20))}–{money(Number(flashbackRules?.max_entry_usd || 1000))}</strong></div>
          <div><span>MAX RETURN</span><strong>{Number(flashbackRules?.max_return_multiplier || 3).toFixed(2)}×</strong></div>
          <div><span>STATUS</span><strong>AVAILABLE</strong></div>
        </>}
        {flashbackFleetState === "sealed" && directionContract && <>
          <div><span>CALL</span><strong>{flashback?.market}/USD · {String(flashback?.direction || "").toUpperCase()}</strong></div>
          <div><span>SETTLES IN</span><strong>{flashbackRemaining === 0 ? "FINALISING" : flashbackTimeLabel}</strong></div>
          <div><span>ENTRY</span><strong>{money(Number(flashback?.allocation_usd || 0))}</strong></div>
        </>}
        {flashbackFleetState === "sealed" && !directionContract && <>
          <div><span>ENTRY</span><strong>{money(Number(flashback?.allocation_usd || 0))}</strong></div>
          <div><span>REVEAL WINDOW</span><strong>{flashbackRemaining === 0 ? "FINALISING" : flashbackTimeLabel}</strong></div>
          <div><span>STATUS</span><strong>SEALED</strong></div>
        </>}
        {flashbackFleetState === "ready_to_reveal" && <>
          <div><span>ENTRY</span><strong>{money(Number(flashback?.allocation_usd || 0))}</strong></div>
          <div><span>RESULT</span><strong>READY</strong></div>
          <div><span>STATUS</span><strong>REVEAL NOW</strong></div>
        </>}
        {flashbackFleetState === "revealed" && directionContract && <>
          <div><span>CALL</span><strong>{flashback?.market}/USD · {String(flashback?.direction || "").toUpperCase()}</strong></div>
          <div><span>NET CHANGE</span><strong className={Number(flashback?.user_net_usd || 0) >= 0 ? "up" : "down"}>{money(Number(flashback?.user_net_usd || 0))}</strong></div>
          <div><span>STATUS</span><strong>SETTLED</strong></div>
        </>}
        {flashbackFleetState === "revealed" && !directionContract && <>
          <div><span>ENTRY</span><strong>{money(Number(flashback?.allocation_usd || 0))}</strong></div>
          <div><span>RETURNED</span><strong>{money(Number(flashback?.return_usd || 0))}</strong></div>
          <div><span>STATUS</span><strong>SETTLED</strong></div>
        </>}
      </div>
      <div className="fleet-bot-actions">
        <span className="compound-chip">{directionContract ? "DIRECTION CONTRACT · SEPARATE FROM BOTS" : "SEALED RETURN · SEPARATE FROM BOTS"}</span>
        <button className="small-action" onClick={() => { setFlashbackNewSession(false); setReviewError(""); setView("flashback"); }}>
          {flashbackFleetAction} <ChevronRight />
        </button>
      </div>
    </GradientPanel>
  ) : null;
  const startFlashback = async () => {
    const started = await run("/v1/flashback/start", { amount: flashbackAmount });
    if (started) {
      setFlashbackReview(false);
      setFlashbackNewSession(false);
      setFlashbackNow(Date.now());
    }
  };
  const startFlashbackDirection = async () => {
    if (!flashbackDirectionChoice || !flashbackDirectionMarket) return;
    const started = await run("/v1/flashback/direction/start", { amount: flashbackAmount, market: flashbackDirectionMarket, direction: flashbackDirectionChoice });
    if (started) {
      setFlashbackReview(false);
      setFlashbackNewSession(false);
      setFlashbackType(null);
      setFlashbackNow(Date.now());
    }
  };
  if (view === "flashback")
    return (
      <div className="bot-detail">
        <button className="back-action" onClick={() => { setFlashbackNewSession(false); setView("fleet"); }}>
          <StateIcon name="arrow-left" /> Fleet overview
        </button>
        <GradientPanel className="detail-hero">
          <div>
            <h2>Flashback</h2>
            <span className={`status-chip ${flashback?.state === "ready_to_reveal" ? "paused" : "running"}`}>
              <i />
              {flashback?.state === "sealed" ? (directionContract ? "direction active" : sealedReturn ? "sealed return" : "earlier session") : flashback?.state === "ready_to_reveal" ? "ready to reveal" : flashback?.state === "revealed" ? "settled" : "choose a contract"}
            </span>
          </div>
        </GradientPanel>
        {flashbackSessionChoices.length > 1 && <GradientPanel className="compound-panel">
          <h2>Choose a contract</h2>
          <p>Each contract has its own entry, settlement clock, and result. Select one to view or reveal its exact outcome.</p>
          <div className="segment-control flashback-session-selector" role="radiogroup" aria-label="Flashback contract" onKeyDown={handleBotChoiceKeyDown}>
            {flashbackSessionChoices.map((session) => {
              const isSelected = session.id === flashback?.id;
              const kind = session.product_version === "market-direction-v1" ? "Direction" : "Sealed Return";
              const status = session.state === "ready_to_reveal"
                ? "Result ready"
                : session.state === "sealed"
                  ? `${Math.max(0, Math.ceil(((session.expires_at || 0) * 1000 - (flashbackNow + flashbackClockOffset)) / 1000))}s left`
                  : "Settled";
              return <button type="button" role="radio" aria-checked={isSelected} tabIndex={isSelected ? 0 : -1} className={isSelected ? "active" : ""} key={session.id} onClick={() => { setSelectedFlashbackId(session.id); setFlashbackNewSession(false); }}>{kind} · {money(Number(session.allocation_usd || 0))} · {status}</button>;
            })}
          </div>
        </GradientPanel>}
        <GradientPanel className="compound-panel">
          <h2>Active contracts</h2>
          <p>One Sealed Return and one Flashback Direction may run together. Each settles on its own 30-second contract clock.</p>
          <div className="fact-block">{activeFlashbacks.length ? activeFlashbacks.map((session) => <span key={session.id}><b>{session.product_version === "market-direction-v1" ? "DIRECTION" : "SEALED RETURN"}</b><b>{session.state === "sealed" ? `${Math.max(0, Math.ceil(((session.expires_at || 0) * 1000 - (flashbackNow + flashbackClockOffset)) / 1000))}s` : "SETTLING"}</b></span>) : <span><b>NO ACTIVE CONTRACTS</b><b>READY</b></span>}</div>
        </GradientPanel>
        {(flashbackNewSession || !flashback || activeFlashbacks.length < 2) && <>
          {!flashbackType && <div className="flashback-type-grid">
            <GradientPanel className="compound-panel"><h2>Sealed Return</h2><p>Lock a published return table. The result remains hidden until the reveal window closes; this is not a market trade.</p><button className="small-action" onClick={() => { setFlashbackType("sealed"); setReviewError(""); }}>Choose Sealed Return <ChevronRight /></button></GradientPanel>
            <GradientPanel className="compound-panel"><h2>Flashback Direction</h2><p>Choose an enabled market and Up or Down. The result settles automatically from a public USD reference after 30 seconds.</p><button className="small-action" disabled={!directionMarkets.length || activeFlashbacks.some((session) => session.product_version === "market-direction-v1")} onClick={() => { setFlashbackType("direction"); setFlashbackDirectionMarket(directionMarkets[0]?.symbol || ""); setReviewError(""); }}>{!directionMarkets.length ? "No markets enabled" : activeFlashbacks.some((session) => session.product_version === "market-direction-v1") ? "Direction active" : "Choose Direction"} <ChevronRight /></button></GradientPanel>
          </div>}
          {flashbackType === "sealed" && <>
            <GradientPanel className="compound-panel">
              <h2>A sealed return</h2>
              <p>Choose an entry within the published range. Flashback locks its published return table, then keeps the randomly determined return sealed until the reveal window closes. It does not place or simulate a market trade.</p>
              <label className="amount-field">ENTRY AMOUNT (USD)<div className="amount-input"><span>$</span><input inputMode="decimal" value={String(flashbackAmount)} onChange={(event) => setFlashbackAmount(Number(event.target.value) || 0)} aria-label="S
ealed Return entry amount" /></div></label>
              <div className="fact-block">{flashbackTableSummary(flashbackReturnTable(flashbackAmount)).map(([label, value]) => <span key={label}><b>{label}</b><b>{value}</b></span>)}</div>
            </GradientPanel>
            <div className="detail-stats"><GradientPanel><span>AMOUNT AT RISK</span><strong>{money(flashbackAmount)}</strong></GradientPanel><GradientPanel><span>REVEAL WINDOW</span><strong>{Number(flashbackRules?.duration_seconds || 30)}s</strong></GradientPanel><GradientPanel><span>MAX RETURN</span><strong>{money(flashbackAmount * Number(flashbackRules?.max_return_multiplier || 3))}</strong></GradientPanel></div>
            <GradientPanel className="compound-panel"><p>The complete entry can be lost. The published table includes the entry in every return, and larger outcomes are rarer. There is no performance fee, and a sealed return cannot be ended early.</p><button className="primary-action" disabled={flashbackAmount < Number(flashbackRules?.min_entry_usd || 20) || flashbackAmount > Number(flashbackRules?.max_entry_usd || 1000) || flashbackAmount > data.wallet.available} onClick={() => { setReviewError(""); setFlashbackReview(true); }}>Review sealed Flashback <ChevronRight /></button><button className="ghost-action" onClick={() => setFlashbackType(null)}>Choose another type</button></GradientPanel>
          </>}
          {flashbackType === "direction" && <>
            <GradientPanel className="compound-panel">
              <h2>Flashback Direction</h2>
              <p>Make one 30-second price call. First choose a market, then whether you expect its USD reference price to finish higher or lower.</p>
              <div className="flashback-direction-steps">
                <section className="flashback-direction-step" aria-labelledby="direction-market-step">
                  <div><span>1</span><h3 id="direction-market-step">Choose a market</h3></div>
                  <div className="segment-control" role="radiogroup" aria-label="Flashback Direction market">{directionMarkets.map((item) => <button type="button" role="radio" aria-checked={flashbackDirectionMarket === item.symbol} key={item.symbol} className={flashbackDirectionMarket === item.symbol ? "active" : ""} onClick={() => setFlashbackDirectionMarket(item.symbol)}>{item.symbol}/USD</button>)}</div>
                </section>
                <section className="flashback-direction-step" aria-labelledby="direction-call-step">
                  <div><span>2</span><h3 id="direction-call-step">Make your call</h3></div>
                  <p>At the 30-second expiry, will {flashbackDirectionMarket || "the selected market"}/USD be higher or lower than its entry price?</p>
                  <div className="segment-control direction-call-control" role="radiogroup" aria-label="Flashback Direction choice"><button type="button" role="radio" aria-checked={flashbackDirectionChoice === "up"} className={flashbackDirectionChoice === "up" ? "active" : ""} onClick={() => setFlashbackDirectionChoice("up")}><b>Higher</b><small>Price finishes above entry</small></button><button type="button" role="radio" aria-checked={flashbackDirectionChoice === "down"} className={flashbackDirectionChoice === "down" ? "active" : ""} onClick={() => setFlashbackDirectionChoice("down")}><b>Lower</b><small>Price finishes below entry</small></button></div>
                </section>
                <section className="flashback-direction-step" aria-labelledby="direction-entry-step">
                  <div><span>3</span><h3 id="direction-entry-step">Set your entry</h3></div>
                  <label className="amount-field">ENTRY AMOUNT (USD)<div className="amount-input"><span>$</span><input inputMode="decimal" value={String(flashbackAmount)} onChange={(event) => setFlashbackAmount(Number(event.target.value) || 0)} aria-label="Flashback Direction entry amount" /></div></label>
                </section>
              </div>
              <div className="fact-block"><span>WINDOW <b>{Number(flashbackDirection?.duration_seconds || 30)} SECONDS</b></span><span>CORRECT RETURN <b>{directionMultiplier(flashbackAmount).toFixed(2)}×</b></span><span>SETTLEMENT <b>KRAKEN USD MIDPOINT</b></span><span>TIE <b>FULL ENTRY RETURNED</b></span></div>
            </GradientPanel>
            <GradientPanel className="compound-panel"><p>Your market and direction are fixed at confirmation. The entry cannot be changed or ended early. There is no performance fee.</p><button className="primary-action" disabled={!flashbackDirectionChoice || !flashbackDirectionMarket || flashbackAmount < Number(flashbackRules?.min_entry_usd || 20) || flashbackAmount > Number(flashbackRules?.max_entry_usd || 1000) || flashbackAmount > data.wallet.available} onClick={() => { setReviewError(""); setFlashbackReview(true); }}>Review Flashback Direction <ChevronRight /></button><button className="ghost-action" onClick={() => setFlashbackType(null)}>Choose another type</button></GradientPanel>
          </>}
        </>}
        {flashback?.state === "sealed" && directionContract && <>
          <div className="detail-stats"><GradientPanel><span>MARKET / CALL</span><strong>{flashback.market}/USD · {String(flashback.direction || "").toUpperCase()}</strong></GradientPanel><GradientPanel><span>SETTLES IN</span><strong>{flashbackRemaining === 0 ? "FINALISING" : flashbackTimeLabel}</strong></GradientPanel><GradientPanel><span>ENTRY</span><strong>{money(Number(flashback.allocation_usd || 0))}</strong></GradientPanel></div>
          <GradientPanel className="compound-panel"><h2>Direction is active</h2><p>The entry reference was captured at confirmation. This live reference helps you follow the move; it is not the settlement quote, which is captured automatically at expiry.</p><div className="fact-block"><span>ENTRY PRICE <b>{formatMarketPrice(Number(flashback.entry_price || 0))}</b></span><span>CURRENT REFERENCE <b>{liveDirectionReference?.price !== undefined ? formatMarketPrice(Number(liveDirectionReference.price)) : "REFRESHING"}</b></span><span>MOVE <b className={liveDirectionReference?.move_percent === undefined ? undefined : liveDirectionReference.move_percent > 0 ? "up" : liveDirectionReference.move_percent < 0 ? "down" : undefined}>{liveDirectionReference?.move_percent === undefined ? "—" : `${liveDirectionReference.move_percent > 0 ? "+" : ""}${liveDirectionReference.move_percent.toFixed(3)}%`}</b></span><span>YOUR CALL <b className={liveDirectionReference?.call_status === "ahead" ? "up" : liveDirectionReference?.call_status === "behind" ? "down" : undefined}>{liveDirectionReference?.call_status === "ahead" ? "AHEAD" : liveDirectionReference?.call_status === "behind" ? "BEHIND" : liveDirectionReference?.call_status === "flat" ? "LEVEL" : "REFRESHING"}</b></span><span>PUBLISHED RETURN <b>{Number((flashback.payout_table as Record<string, unknown>)?.multiplier || 0).toFixed(2)}×</b></span><span>PRICE SOURCE <b>{liveDirectionReference?.source || flashback.entry_source || "KRAKEN"}</b></span></div></GradientPanel>
        </>}
        {flashback?.state === "sealed" && !directionContract && <>
          <div className="detail-stats">
            <GradientPanel><span>ENTRY</span><strong>{money(Number(flashback.allocation_usd || 0))}</strong></GradientPanel>
            <GradientPanel><span>REVEAL WINDOW</span><strong>{sealedReturn && flashbackRemaining === 0 ? "FINALISING" : flashbackTimeLabel}</strong></GradientPanel>
            <GradientPanel><span>STATUS</span><strong>SEALED</strong></GradientPanel>
          </div>
          <GradientPanel className="compound-panel">
            <h2>{sealedReturn ? "Return is sealed" : "Earlier session"}</h2>
            <p>{sealedReturn ? "The return table and entry are committed. The future external entropy source is used only after the reveal window ends, and TradePulse reveals the result automatically at expiry." : "This session was created before the current sealed-return product. It will complete at its scheduled reveal time; early settlement is no longer available."}</p>
            {sealedReturn ? <div className="fact-block">
              <span>COMMITMENT <b>{String(flashback.commitment || "").slice(0, 16)}…</b></span>
              <span>MAX RETURN <b>{Number(flashbackRules?.max_return_multiplier || 3).toFixed(2)}×</b></span>
              {flashbackTableSummary(Array.isArray(flashback.payout_table) ? flashback.payout_table : []).map(([label, value]) => <span key={label}><b>{label}</b><b>{value}</b></span>)}
            </div> : <div className="fact-block"><span>COMMITMENT <b>{String(flashback.commitment || "").slice(0, 16)}…</b></span><span>STATUS <b>HISTORICAL TERMS</b></span></div>}
          </GradientPanel>
        </>}
        {flashback?.state === "ready_to_reveal" && <>
          <GradientPanel className="compound-panel">
            <h2>Finalising your result</h2>
            <p>The reveal window has closed. TradePulse is automatically applying the committed result.</p>
            <div className="fact-block"><span>ENTRY <b>{money(Number(flashback.allocation_usd || 0))}</b></span><span>COMMITMENT <b>{String(flashback.commitment || "").slice(0, 16)}…</b></span></div>
          </GradientPanel>
        </>}
        {flashback?.state === "revealed" && !flashbackNewSession && <>
          {directionContract ? <>
            <div className="detail-stats"><GradientPanel><span>MARKET / CALL</span><strong>{flashback.market}/USD · {String(flashback.direction || "").toUpperCase()}</strong></GradientPanel><GradientPanel><span>RETURNED</span><strong>{money(Number(flashback.return_usd || 0))}</strong></GradientPanel><GradientPanel><span>NET CHANGE</span><strong className={Number(flashback.user_net_usd || 0) >= 0 ? "up" : "down"}>{money(Number(flashback.user_net_usd || 0))}</strong></GradientPanel></div>
            <GradientPanel className="compound-panel flashback-reveal"><h2>Flashback Direction settled</h2><div className="fact-block"><span>ENTRY PRICE <b>{Number(flashback.entry_price || 0).toFixed(8)}</b></span><span>SETTLEMENT PRICE <b>{Number(flashback.exit_price || 0).toFixed(8)}</b></span><span>OUTCOME <b>{flashback.close_reason === "tie_refund" ? "TIE · ENTRY RETURNED" : flashback.close_reason === "reference_unavailable_refund" ? "REFERENCE UNAVAILABLE · ENTRY RETURNED" : Number(flashback.user_net_usd || 0) > 0 ? "CORRECT" : "INCORRECT"}</b></span><span>RETURN <b>{Number(flashback.payout_multiplier || 0).toFixed(2)}×</b></span><span>REFERENCE <b>{flashback.exit_source || "KRAKEN"}</b></span><span>FEE <b>$0.00</b></span></div><button className="small-action" onClick={() => { setFlashbackAmount(20); setFlashbackType(null); setFlashbackDirectionChoice(null); setReviewError(""); setFlashbackNewSession(true); }}>Start another Flashback <Plus /></button></GradientPanel>
          </> : sealedReturn ? <>
            <div className="detail-stats">
              <GradientPanel><span>OUTCOME</span><strong>{sealedEntropyRefund ? "ENTRY RETURNED" : Number(flashback.payout_multiplier || 0) === 0 ? "FULL LOSS" : `${Number(flashback.payout_multiplier || 0).toFixed(2)}×`}</strong></GradientPanel>
              <GradientPanel><span>RETURNED</span><strong>{money(Number(flashback.return_usd || 0))}</strong></GradientPanel>
              <GradientPanel><span>NET CHANGE</span><strong className={Number(flashback.user_net_usd || 0) >= 0 ? "up" : "down"}>{money(Number(flashback.user_net_usd || 0))}</strong></GradientPanel>
            </div>
            <GradientPanel className="compound-panel flashback-reveal">
              <h2>Flashback revealed</h2>
              <div className="fact-block">
                <span>ENTRY <b>{money(Number(flashback.allocation_usd || 0))}</b></span>
                <span>{sealedEntropyRefund ? "SETTLEMENT" : "RETURN"} <b>{sealedEntropyRefund ? "ENTRY RETURNED" : `${Number(flashback.payout_multiplier || 0).toFixed(2)}×`}</b></span>
                <span>FEE <b>$0.00</b></span>
                <span>ENTROPY SOURCE <b>{flashback.market || "—"}/USD · {flashback.exit_source || "—"}</b></span>
                <span>VERIFY HASH <b>{String(flashback.entropy_hash || "").slice(0, 16)}…</b></span>
                <span>COMMITMENT <b>{String(flashback.commitment || "").slice(0, 16)}…</b></span>
              </div>
              <p>{sealedEntropyRefund ? "The external entropy source did not respond during the resolution window. Your full entry was returned and no random return was selected." : "The revealed nonce, commitment, and external entropy hash preserve the sealed rules for this session."}</p>
              <button className="small-action" onClick={() => { setFlashbackAmount(20); setReviewError(""); setFlashbackNewSession(true); }}>Start another Flashback <Plus /></button>
            </GradientPanel>
          </> : <>
            <div className="detail-stats">
              <GradientPanel><span>ENTRY</span><strong>{money(Number(flashback.allocation_usd || 0))}</strong></GradientPanel>
              <GradientPanel><span>NET CHANGE</span><strong className={Number(flashback.user_net_usd || 0) >= 0 ? "up" : "down"}>{money(Number(flashback.user_net_usd || 0))}</strong></GradientPanel>
              <GradientPanel><span>STATUS</span><strong>SETTLED</strong></GradientPanel>
            </div>
            <GradientPanel className="compound-panel">
              <h2>Earlier Flashback session</h2>
              <div className="fact-block">
                <span>COMMITMENT <b>{String(flashback.commitment || "").slice(0, 16)}…</b></span>
                <span>STATUS <b>HISTORICAL TERMS</b></span>
              </div>
              <p>This session was settled under earlier terms. Its original record remains available in account activity.</p>
              <button className="small-action" onClick={() => { setFlashbackAmount(20); setReviewError(""); setFlashbackNewSession(true); }}>Start current Flashback <Plus /></button>
            </GradientPanel>
          </>}
        </>}
        {flashbackReview && <AccessibleDialog label={flashbackType === "direction" ? "Review Flashback Direction" : "Review Flashback"} onClose={() => setFlashbackReview(false)} dismissible={!isActionPending(flashbackType === "direction" ? "flashback:direction:start" : "flashback:start")}>
          <h2>{flashbackType === "direction" ? "Confirm Flashback Direction?" : "Start a sealed Flashback?"}</h2>
          {flashbackType === "direction" ? <><p>TradePulse will lock {money(flashbackAmount)} on {flashbackDirectionMarket}/USD · {String(flashbackDirectionChoice || "").toUpperCase()} for 30 seconds. A correct direction returns {money(flashbackAmount * directionMultiplier(flashbackAmount))} ({directionMultiplier(flashbackAmount).toFixed(2)}×); an incorrect direction loses the full entry. An exact tie returns the full entry. Settlement uses the Kraken USD midpoint. There is no performance fee.</p><div className="fact-block"><span>AVAILABLE AFTER <b>{money(Math.max(0, data.wallet.available - flashbackAmount))}</b></span><span>AMOUNT AT RISK <b>{money(flashbackAmount)}</b></span><span>SETTLEMENT <b>AUTOMATIC</b></span></div></> : <><p>TradePulse will lock {money(flashbackAmount)} for {Number(flashbackRules?.duration_seconds || 30)} seconds and commit the published return table before the result is sealed. Your entire entry is at risk; the highest total return is {money(flashbackAmount * Number(flashbackRules?.max_return_multiplier || 3))}. There is no performance fee.</p><div className="fact-block"><span>AVAILABLE AFTER <b>{money(Math.max(0, data.wallet.available - flashbackAmount))}</b></span><span>AMOUNT AT RISK <b>{money(flashbackAmount)}</b></span><span>RESULT <b>SEALED</b></span></div></>}
          {reviewError && <p className="security-feedback" role="alert">{reviewError}</p>}
          <button className="primary-action" disabled={isActionPending(flashbackType === "direction" ? "flashback:direction:start" : "flashback:start") || flashbackAmount < Number(flashbackRules?.min_entry_usd || 20) || flashbackAmount > Number(flashbackRules?.max_entry_usd || 1000) || flashbackAmount > data.wallet.available || (flashbackType === "direction" && (!flashbackDirectionChoice || !flashbackDirectionMarket))} aria-busy={isActionPending(flashbackType === "direction" ? "flashback:direction:start" : "flashback:start")} onClick={() => void (flashbackType === "direction" ? startFlashbackDirection() : startFlashback())}>{isActionPending(flashbackType === "direction" ? "flashback:direction:start" : "flashback:start") ? "Starting…" : flashbackType === "direction" ? "Confirm Flashback Direction" : "Start sealed Flashback"} <StateIcon name="check" /></button>
          <button className="ghost-action" disabled={isActionPending(flashbackType === "direction" ? "flashback:direction:start" : "flashback:start")} onClick={() => setFlashbackReview(false)}>Go back</button>
        </AccessibleDialog>}
      </div>
    );
  if (view === "create")
    return (
      <div className="bot-flow">
        <button
          className="back-action"
          onClick={() => {
            setReview(false);
            setView("fleet");
          }}
        >
          <StateIcon name="arrow-left" /> Fleet overview
        </button>
        <div className="flow-kicker">
          <span className="eyebrow">NEW AUTOMATION</span>
          <h2>Choose a product</h2>
          <p>
            Each account can operate one Memecoin bot and one Synthetic Indices
            bot at the same time.
          </p>
        </div>
        <div className="product-grid">
          <BotProductCard
            name="Memecoin"
            description="Automated crypto strategy"
            icon="M"
            selected={product === "memecoin"}
            onClick={() => setProduct("memecoin")}
          />
          <BotProductCard
            name="Synthetic Indices"
            description="Trade the shared synthetic engine"
            icon="S"
            selected={product === "synthetic"}
            onClick={() => setProduct("synthetic")}
          />
        </div>
        <div className="amount-input">
          <span>$</span>
          <input
            value={amount}
            onChange={(event) =>
              setAmount(event.target.value.replace(/[^0-9.]/g, ""))
            }
            inputMode="decimal"
            aria-label="Allocation amount"
          />
        </div>
        <div className="available-line">
          <span>AVAILABLE TO DEPLOY</span>
          <strong>{money(data.wallet.available)}</strong>
        </div>
        <p className="minimum-hint">
          Minimum allocation is $20.00. Your allocation cannot exceed your
          available balance.
        </p>
        <button
          className="primary-action"
          disabled={
            Number(amount) < 20 || Number(amount) > data.wallet.available
          }
          onClick={() => { setReviewError(""); setReview(true); }}
        >
          Review allocation <ChevronRight />
        </button>
        {review && (
          <AccessibleDialog label="Confirm deployment" onClose={() => setReview(false)} dismissible={!isActionPending("bot:create")}>
              <span className="eyebrow">FINAL REVIEW</span>
              <h2>Confirm deployment</h2>
              <div className="fact-block">
                <span>
                  PRODUCT <b>{productLabel}</b>
                </span>
                <span>
                  ALLOCATION <b>{money(Number(amount))}</b>
                </span>
                <span>
                  AVAILABLE AFTER{" "}
                  <b>
                    {money(Math.max(0, data.wallet.available - Number(amount)))}
                  </b>
                </span>
                <span>
                  COMPOUNDING <b>0%</b>
                </span>
                {product === "memecoin" && <span>STATUS <b>AUTHORIZATION REQUIRED</b></span>}
              </div>
              {product === "memecoin" && <p>Live market data is used to internally settle results against this Memecoin allocation.</p>}
              {reviewError && <p className="security-feedback" role="alert">{reviewError}</p>}
              <button
                className="primary-action"
                disabled={isActionPending("bot:create")}
                aria-busy={isActionPending("bot:create")}
                onClick={async () => {
                  const created = await run("/v1/bots", { product, amount: Number(amount) });
                  if (created) {
                    setReview(false);
                    setView("fleet");
                  }
                }}
              >
                {isActionPending("bot:create") ? "Submitting…" : "Start trade"} <Zap />
              </button>
              <button className="ghost-action" disabled={isActionPending("bot:create")} onClick={() => setReview(false)}>
                Go back
              </button>
          </AccessibleDialog>
        )}
      </div>
    );
    if (view === "detail" && selected) {
      const paused = selected.state === "paused";
      const isDemoCreditOnlyBot = selected.product === "memecoin" && Boolean(selected.demo_credit_only);
      const awaitingAuthorization = selected.product === "memecoin" && selected.state === "awaiting_authorization" && !isDemoCreditOnlyBot;
      const isDemoBot = Boolean(selected.demo_trial) && !isDemoCreditOnlyBot;
      const isVirtualMemecoinBot = isDemoBot || isDemoCreditOnlyBot;
      const isClosing = selected.state === "closing";
      const activeDemoPool = data.demo?.pool_state === "active" && Number(data.demo.pool_available_usd || 0) > 0;
      const activeDemoCredit = Number(data.demo?.credit_available_usd || 0) > 0;
      const selectedMemecoinCategories = new Set(memecoinAssets.map((asset) => memecoinAssetCategories[asset] || "microcap"));
      const baseCadenceCategories = [...selectedMemecoinCategories].filter((category) => category !== "microcap");
      const cadenceCategories = baseCadenceCategories.length ? baseCadenceCategories : [...selectedMemecoinCategories];
      const permittedCadences = [60, 300, 900].filter((value) => (
        cadenceCategories.every((category) => (
          category === "bluechip" ? value === 60 || value === 300 : category === "midcap" ? value === 300 : value === 900
        ))
      ));
      const permittedLeverage = Math.min(...[...selectedMemecoinCategories].map((category) => category === "bluechip" ? 10 : category === "midcap" ? 5 : 3), includeTrench ? 3 : 10);
      const savedCadence = permittedCadences.includes(memecoinCadence) ? memecoinCadence : (permittedCadences.includes(300) ? 300 : permittedCadences[0]);
      const savedLeverage = Math.min(memecoinLeverage, permittedLeverage);
      const selectedMarketCategory = memecoinAssetCategories[memecoinMarket] || "microcap";
      const manualCadence = selectedMarketCategory === "microcap" ? 900 : savedCadence;
      const filteredBasketAssets = memecoinCatalog.filter((asset) => {
        const label = `${asset.symbol} ${asset.name || ""} ${asset.category || ""}`.toLowerCase();
        return label.includes(basketQuery.trim().toLowerCase());
      });
    return (
      <div className="bot-detail">
        <button className="back-action" onClick={() => setView("fleet")}>
          <StateIcon name="arrow-left" /> Fleet overview
        </button>
        <GradientPanel className="detail-hero">
          <div>
            <span className="eyebrow">{selected.name.toUpperCase()} BOT</span>
            <h2>{selected.name}</h2>
            <span className={`status-chip ${paused || awaitingAuthorization || isDemoCreditOnlyBot || isClosing ? "paused" : "running"}`}>
              <i />
              {isClosing ? "closing protected positions" : isDemoCreditOnlyBot ? "manual trading credit" : awaitingAuthorization ? "authorization required" : paused ? "paused" : "active"}
            </span>
          </div>
        </GradientPanel>
        <button className="small-action" onClick={() => { setFlashbackNewSession(false); setReviewError(""); setView("flashback"); }}>
          Open Flashback <ChevronRight />
        </button>
        <div className="detail-stats">
          <GradientPanel>
            <span>{isDemoBot ? "DEMO AVAILABLE" : isDemoCreditOnlyBot ? "CREDIT AVAILABLE" : "ALLOCATION"}</span>
            <strong>{money(isDemoBot ? Number(data.demo?.pool_available_usd || 0) : isDemoCreditOnlyBot ? Number(data.demo?.credit_available_usd || 0) : selected.capital_usd)}</strong>
          </GradientPanel>
          <GradientPanel>
            <span>{isDemoBot ? "DEMO LOCKED" : isDemoCreditOnlyBot ? "CREDIT LOCKED" : "COMPOUNDING"}</span>
            <strong>{isDemoBot ? money(Number(data.demo?.pool_locked_usd || 0)) : isDemoCreditOnlyBot ? money(Number(data.demo?.credit_locked_usd || 0)) : `${selected.compound_percent}%`}</strong>
          </GradientPanel>
          <GradientPanel>
            <span>{isDemoBot ? "DEMO P&L" : isDemoCreditOnlyBot ? "EXECUTION" : "HIGH-WATER MARK"}</span>
            <strong>{isDemoBot ? money(Number(data.demo?.pool_realised_pnl_usd || 0)) : isDemoCreditOnlyBot ? "Manual only" : money(Number(selected.hwm_usd ?? selected.capital_usd))}</strong>
          </GradientPanel>
        </div>
        {selected.product === "memecoin" && (
          <GradientPanel className="compound-panel">
            <span className="eyebrow">LIVE MEMECOIN MARKET</span>
            <div className="segment-control" role="radiogroup" aria-label="Live Memecoin market" onKeyDown={handleBotChoiceKeyDown}>
              {memecoinAssets.map((symbol) => (
                <button type="button" role="radio" aria-checked={memecoinMarket === symbol} tabIndex={memecoinMarket === symbol ? 0 : -1} className={memecoinMarket === symbol ? "active" : ""} key={symbol} title={memecoinInsightLabel(symbol)} aria-label={`${memecoinMarketLabel(symbol)}. ${memecoinInsightLabel(symbol)}`} onClick={() => setMemecoinMarket(symbol)}><span className="memecoin-choice-label"><MemecoinMark symbol={symbol} />{memecoinMarketLabel(symbol)}</span></button>
              ))}
            </div>
            <MarketChart points={memecoinSnapshot.points || []} ohlcCandles={memecoinSnapshot.candles} market={`${memecoinMarketLabel(memecoinMarket)} / USDT`} sourceLabel={memecoinSnapshot.latest?.source === "kraken" || memecoinSnapshot.latest?.source === "kraken_rest" ? "Kraken 1-minute" : "1-minute"} />
            {(memecoinSnapshot.positions || []).length > 0 && (
              <div className="support-ticket-list">
                {(memecoinSnapshot.positions || []).slice(0, 5).map((position) => {
                  const identity = memecoinPositionIdentity(position.symbol);
                  const entryType = position.execution_type === "automatic" || String(position.idempotency_key || "").startsWith("strategy:")
                    ? "automatic"
                    : "manual";
                  const mark = Number(position.mark_price);
                  const livePnl = Number(position.unrealized_pnl);
                  const hasLiveMark = position.status === "open" && Number.isFinite(mark) && mark > 0 && Number.isFinite(livePnl);
                  const livePnlPercent = hasLiveMark ? percentageFromMargin(livePnl, Number(position.margin_usd)) : 0;
                  return <div className="activity-row" key={position.id}>
                    <div className="activity-info">
                      <strong title={identity.title}><MemecoinMark symbol={position.symbol} compact />{identity.label} · {position.direction.toUpperCase()} · {entryType} · {position.status}</strong>
                      {position.status === "open"
                        ? <><small>{entryType === "automatic" ? "Auto-managed" : "Manual order"} · Margin {money(position.margin_usd)} · Entry {formatMarketPrice(position.entry_price)}{entryType === "automatic" && position.stop_loss_price && position.take_profit_price ? ` · Stop ${formatMarketPrice(position.stop_loss_price)} · Target ${formatMarketPrice(position.take_profit_price)}` : ""}</small><small className="memecoin-live-position">{hasLiveMark ? <><span>Mark {formatMarketPrice(mark)}</span><span>Live P&amp;L <b className={livePnl >= 0 ? "up" : "down"}>{livePnl >= 0 ? "+" : ""}{money(livePnl)} ({percentageLabel(livePnlPercent)})</b></span>{position.take_profit_price && <span className="memecoin-target-distance">{remainingTargetLabel(mark, Number(position.take_profit_price), position.direction)}</span>}{position.stop_loss_price && <span className="memecoin-stop-distance">{remainingStopLabel(mark, Number(position.stop_loss_price), position.direction)}</span>}</> : <span>Live reference awaiting a current executable price</span>}</small></>
                        : <small>{entryType === "automatic" ? "Auto exit" : "Manual exit"} · Margin {money(position.margin_usd)} · P&amp;L <b className={Number(position.realized_pnl || 0) >= 0 ? "up" : "down"}>{Number(position.realized_pnl || 0) >= 0 ? "+" : ""}{money(Number(position.realized_pnl || 0))}</b>{position.close_reason ? ` · ${String(position.close_reason).replaceAll("_", " ")}` : ""}</small>}
                    </div>
                    {position.status === "open" && <button className="small-action" disabled={isActionPending(`memecoin-position:${position.id}:close`)} aria-busy={isActionPending(`memecoin-position:${position.id}:close`)} title={`Close this ${identity.label} position at the next executable market price`} aria-label={`Close ${identity.label} ${position.direction} position`} onClick={() => void run(`/v1/memecoin/positions/${position.id}/close`, {})}>{isActionPending(`memecoin-position:${position.id}:close`) ? "Closing…" : "Close position"} <X /></button>}
                  </div>;
                })}
              </div>
            )}
              {(memecoinSnapshot.events || []).length > 0 && <div className="support-ticket-list">
              {compactMemecoinEvents(memecoinSnapshot.events || []).map((event) => {
                const reason = typeof event.payload?.reason === "string" ? event.payload.reason : "";
                const available = reason.match(/(\$[\d,.]+) remains available/i)?.[1];
                const isAllocationHold = event.kind === "strategy_rejected" && /insufficient memecoin allocation/i.test(reason);
                const isQuoteDelay = event.kind === "strategy_rejected" && /stale|fresh market price|market feed/i.test(reason);
                const decision = typeof event.payload?.decision === "string" ? event.payload.decision : "";
                const eventSymbol = typeof event.payload?.symbol === "string" ? event.payload.symbol : "";
                const label = isQuoteDelay
                  ? "Price check paused entry"
                  : isAllocationHold

                    ? "Allocation hold"
                    : event.kind === "strategy_decision" && decision === "opened"
                      ? "Automatic entry opened"
                      : event.kind === "strategy_decision" && decision === "hold"
                        ? event.reviewCount && event.reviewCount > 1 ? `No trade opened · ${event.reviewCount} recent checks` : "No trade opened"
                        : event.kind.replaceAll("_", " ");
                const detail = isQuoteDelay
                  ? "No position was opened. The bot will retry at its next scheduled decision after it receives a current quote."
                  : isAllocationHold
                    ? `${available ? `${available} is free, but ` : ""}the next full-sized position needs more. No position was opened.`
                    : event.kind === "strategy_decision" && decision === "opened"
                      ? `${eventSymbol ? `${memecoinMarketLabel(eventSymbol)} entry recorded. ` : ""}Position safeguards are active.`
                      : event.kind === "strategy_decision" && decision === "hold"
                        ? event.reviewCount && event.reviewCount > 1 ? "No selected market met the strategy rules in these recent checks. The next review will replace this summary." : "No selected market met the strategy rules in this review."
                        : reason || "Strategy review recorded.";
                return <div className="activity-row" key={event.id}>
                  <div className="activity-info">
                    <strong>{label}</strong>
                    <small>{detail} · {new Date(event.created_at * 1000).toLocaleTimeString()}</small>
                  </div>
                </div>;
              })}
              </div>}
              {(selected.state === "running" || isDemoCreditOnlyBot) && (
                <button
                  className="small-action"
                  disabled={isActionPending(`memecoin-order:${selected.id}`) || (isDemoBot ? !activeDemoPool : isDemoCreditOnlyBot ? !activeDemoCredit : false)}
                  onClick={() => setMemecoinOrder({
                    direction: "long",
                    source: isDemoBot ? "demo" : isDemoCreditOnlyBot ? "credit" : "wallet",
                    amount: "20",
                    idempotencyKey: createMemecoinOrderIdempotencyKey(data.user.id, selected.id),
                  })}
                >
                  Review manual order <ChevronRight />
                </button>
              )}
            </GradientPanel>
          )}
          {!isVirtualMemecoinBot && !isClosing && (
            <GradientPanel className="compound-panel">
              <span className="eyebrow">COMPOUNDING</span>
              <div className="segment-control" role="radiogroup" aria-label="Compounding" onKeyDown={handleBotChoiceKeyDown}>
                {[0, 50, 100].map((percent) => (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected.compound_percent === percent}
                    tabIndex={selected.compound_percent === percent ? 0 : -1}
                    className={
                      selected.compound_percent === percent ? "active" : ""
                    }
                    key={percent}
                    aria-disabled={isActionPending(`bot:${selected.id}:compound`)}
                    onClick={() => void updateCompound(percent)}
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            </GradientPanel>
          )}
          {selected.product === "memecoin" && !isDemoCreditOnlyBot && !isClosing && (
            <GradientPanel className="compound-panel">
              <span className="eyebrow">{isDemoBot ? "SHARED DEMO CONTROLS" : awaitingAuthorization ? "FUNDED MEMECOIN BOT BETA" : "MEMECOIN STRATEGY CONTROLS"}</span>
              <p>
                {isDemoBot
                  ? "Choose how the shared virtual pool may be used by this Memecoin strategy. The pool remains separate from your wallet and from Synthetic; manual orders always require a separate review."
                  : awaitingAuthorization
                  ? "Your assigned Memecoin allocation is the capital at risk. TradePulse uses live market data and internally settles results. Trench Mode watches fresh launches on supported networks only after a same-network DEX quote and liquidity gate; it does not guarantee protection from rugs or rapid loss."
                  : "These controls apply to future automatic entries. Existing positions keep their recorded risk limits; manual orders always require a separate review."}
              </p>
              {awaitingAuthorization && <div className="activity-row" role="status">
                <div className="activity-info">
                  <strong>Automatic entries cannot start yet.</strong>
                  <small>Choose the strategy controls, turn Automatic entries on if you want it, then authorize this bot. It will review only fresh eligible market signals after authorization.</small>
                </div>
              </div>}
            <span className="eyebrow">STRATEGY BASKET</span>
            <div className="segment-control" role="group" aria-label="Strategy basket">
              {["DOGE", "SHIB", "PEPE", "WIF", "BONK"].map((symbol) => (
                <button type="button" key={symbol} aria-pressed={memecoinAssets.includes(symbol)} disabled={memecoinAssets.length === 1 && memecoinAssets.includes(symbol)} className={memecoinAssets.includes(symbol) ? "active" : ""} onClick={() => setMemecoinAssets((current) => current.includes(symbol) ? current.filter((item) => item !== symbol) : [...current, symbol])}><span className="memecoin-choice-label"><MemecoinMark symbol={symbol} />{symbol}</span></button>
              ))}
            </div>
            <button type="button" className="small-action" onClick={() => void openBasketPicker()}>
              Browse eligible markets <ChevronRight />
            </button>
            <span className="eyebrow">LEVERAGE</span>
            <div className="segment-control" role="radiogroup" aria-label="Leverage" onKeyDown={handleBotChoiceKeyDown}>
              {[1, 3, 5, 10].filter((value) => value <= permittedLeverage).map((value) => <button type="button" role="radio" aria-checked={savedLeverage === value} tabIndex={savedLeverage === value ? 0 : -1} key={value} className={savedLeverage === value ? "active" : ""} onClick={() => setMemecoinLeverage(value)}>{value}×</button>)}
            </div>
            <span className="eyebrow">DECISION CADENCE</span>
              <div className="segment-control" role="radiogroup" aria-label="Decision cadence" onKeyDown={handleBotChoiceKeyDown}>
                {permittedCadences.map((value) => <button type="button" role="radio" aria-checked={savedCadence === value} tabIndex={savedCadence === value ? 0 : -1} key={value} className={savedCadence === value ? "active" : ""} onClick={() => setMemecoinCadence(value)}>{value === 60 ? "1m" : value === 300 ? "5m" : "15m"}</button>)}
              </div>
              <button type="button" className={memecoinAutoEnabled ? "small-action active" : "small-action"} aria-label="Automatic Memecoin entries" aria-pressed={memecoinAutoEnabled} onClick={() => setMemecoinAutoEnabled((current) => !current)}>Automatic entries: {memecoinAutoEnabled ? "On" : "Off"}</button>
              <button type="button" className={includeTrench ? "small-action active" : "small-action"} aria-label="Include Trench Mode" aria-pressed={includeTrench} disabled={includeTrench && memecoinAssets.some((asset) => (memecoinAssetCategories[asset] || "microcap") === "microcap")} title={includeTrench && memecoinAssets.some((asset) => (memecoinAssetCategories[asset] || "microcap") === "microcap") ? "Remove new-launch markets before turning Trench Mode off." : undefined} onClick={() => setIncludeTrench((current) => !current)}>Include Trench Mode: {includeTrench ? "On" : "Off"}</button>
              <button
                className="primary-action"
                disabled={isActionPending(`bot:${selected.id}:authorize`) || memecoinAssets.length === 0}
                onClick={() => run(`/v1/bots/${selected.id}/actions`, { action: "authorize", accepted: awaitingAuthorization, settings: { basket: "eligible_strategy", assets: memecoinAssets, auto_enabled: memecoinAutoEnabled, include_trench: includeTrench, cadence_seconds: savedCadence, leverage: savedLeverage } })}
              >
                {isActionPending(`bot:${selected.id}:authorize`) ? "Saving…" : isDemoBot ? "Save demo controls" : awaitingAuthorization ? (memecoinAutoEnabled ? "Authorize and enable Auto" : "Authorize Memecoin Bot Beta") : "Save strategy controls"} <StateIcon name="check" />
              </button>
            </GradientPanel>
          )}
          <div className="detail-actions">
            {!isVirtualMemecoinBot && !isClosing && <>
              <div className="amount-input">
                <span>$</span>
                <input
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value.replace(/[^0-9.]/g, ""))
                  }
                  inputMode="decimal"
                  aria-label="Product top-up amount"
                />
              </div>
              <button
                className="small-action"
                disabled={Number(amount) < 20 || isActionPending(`bot:${selected.id}:topup`)}
                onClick={() =>
                  run(`/v1/bots/${selected.id}/actions`, {
                    action: "topup",
                    amount: Number(amount),
                  })
                }
              >
                {isActionPending(`bot:${selected.id}:topup`) ? "Updating…" : "Top up allocation"} <Plus />
              </button>
            </>}
          {!isDemoCreditOnlyBot && !isClosing && <button
            className="primary-action"
            disabled={awaitingAuthorization || isActionPending(`bot:${selected.id}:toggle`)}
            onClick={() =>
              run(`/v1/bots/${selected.id}/actions`, { action: "toggle" })
            }
          >
            {paused ? "Resume bot" : "Pause bot"}{" "}
            <StateSwapIcon
              name={paused ? "play" : "pause"}
              swapKey={paused ? "bot-resume" : "bot-pause"}
            />
          </button>}
            {!isVirtualMemecoinBot && <button
                className="danger-action"
                disabled={isActionPending(`bot:${selected.id}:close`)}
                onClick={() => { setReviewError(""); setCloseReview(true); }}
              >
                {isClosing ? "Finish closing bot" : "Close bot"} <X />
              </button>}
          </div>
          {memecoinOrder && (
            <AccessibleDialog label="Review Memecoin order" onClose={() => setMemecoinOrder(null)} dismissible={!isActionPending(`memecoin-order:${selected.id}`)}>
              <span className="eyebrow">MANUAL MEMECOIN ORDER</span>
              <h2>Review order</h2>
              <p>Manual orders use the same fresh-price, liquidity, position, and settlement safeguards as automatic entries.</p>
              <div className="segment-control" role="radiogroup" aria-label="Memecoin order direction" onKeyDown={handleBotChoiceKeyDown}>
                {(["long", "short"] as const).map((direction) => <button type="button" role="radio" aria-checked={memecoinOrder.direction === direction} tabIndex={memecoinOrder.direction === direction ? 0 : -1} key={direction} className={memecoinOrder.direction === direction ? "active" : ""} onClick={() => setMemecoinOrder((current) => current ? { ...current, direction } : current)}>{direction === "long" ? "Long" : "Short"}</button>)}
              </div>
              {!isDemoBot && !isDemoCreditOnlyBot && <div className="segment-control" role="radiogroup" aria-label="Memecoin order funding source" onKeyDown={handleBotChoiceKeyDown}>
                <button type="button" role="radio" aria-checked={memecoinOrder.source === "wallet"} tabIndex={memecoinOrder.source === "wallet" ? 0 : -1} className={memecoinOrder.source === "wallet" ? "active" : ""} onClick={() => setMemecoinOrder((current) => current ? { ...current, source: "wallet" } : current)}>Wallet allocation</button>
                {activeDemoCredit && <button type="button" role="radio" aria-checked={memecoinOrder.source === "credit"} tabIndex={memecoinOrder.source === "credit" ? 0 : -1} className={memecoinOrder.source === "credit" ? "active" : ""} onClick={() => setMemecoinOrder((current) => current ? { ...current, source: "credit" } : current)}>Demo trading credit</button>}
              </div>}
              <div className="amount-input">
                <span>$</span>
                <input value={memecoinOrder.amount} onChange={(event) => setMemecoinOrder((current) => current ? { ...current, amount: event.target.value.replace(/[^0-9.]/g, "") } : current)} inputMode="decimal" aria-label="Memecoin order margin" />
              </div>
              <div className="fact-block">
                <span>MARKET <b>{memecoinMarketLabel(memecoinMarket)}</b></span>
                <span>LEVERAGE <b>{savedLeverage}×</b></span>
                <span>CADENCE <b>{manualCadence === 60 ? "1 MINUTE" : manualCadence === 300 ? "5 MINUTES" : "15 MINUTES"}</b></span>
                <span>FUNDING <b>{memecoinOrder.source === "demo" ? "SHARED DEMO" : memecoinOrder.source === "credit" ? "TRADING CREDIT" : "WALLET ALLOCATION"}</b></span>
              </div>
              {reviewError && <p className="security-feedback" role="alert">{reviewError}</p>}
              <button
                className="primary-action"
                disabled={isActionPending(`memecoin-order:${selected.id}`) || Number(memecoinOrder.amount) <= 0 || (isDemoBot && !activeDemoPool) || (isDemoCreditOnlyBot && !activeDemoCredit)}
                aria-busy={isActionPending(`memecoin-order:${selected.id}`)}
                onClick={async () => {
                  const placed = await run("/v1/memecoin/orders", {
                    action: "order",
                    bot_id: selected.id,
                    symbol: memecoinMarket,
                    direction: memecoinOrder.direction,
                    amount: Number(memecoinOrder.amount),
                    leverage: savedLeverage,
                    cadence_seconds: manualCadence,
                    funding_source: memecoinOrder.source,
                    idempotency_key: memecoinOrder.idempotencyKey,
                    settings: { include_trench: includeTrench },
                  });
                  if (placed) setMemecoinOrder(null);
                }}
              >
                {isActionPending(`memecoin-order:${selected.id}`) ? "Submitting…" : "Confirm order"} <StateIcon name="check" />
              </button>
              <button className="ghost-action" disabled={isActionPending(`memecoin-order:${selected.id}`)} onClick={() => setMemecoinOrder(null)}>Go back</button>
            </AccessibleDialog>
          )}
          {closeReview && (
            <AccessibleDialog label={`Close ${selected.name}`} onClose={() => setCloseReview(false)} dismissible={!isActionPending(`bot:${selected.id}:close`)}>
              <span className="eyebrow">FINAL REVIEW</span>
              <h2>Close {selected.name}?</h2>
              <p>{isClosing
                ? "The bot is already closing. Any in-flight position remains protected until settlement finishes."
                : selected.product === "synthetic"
                  ? "Close every open Synthetic position first. Once none remain, the available product allocation returns to your balance."
                  : "The product’s available allocation returns to your balance. Any open position remains protected until its settlement finishes."}</p>
              {reviewError && <p className="security-feedback" role="alert">{reviewError}</p>}
              <button className="danger-action" disabled={isActionPending(`bot:${selected.id}:close`)} aria-busy={isActionPending(`bot:${selected.id}:close`)} onClick={async () => {
                const closed = await run(`/v1/bots/${selected.id}/actions`, { action: "close" });
                if (closed) setCloseReview(false);
              }}>{isActionPending(`bot:${selected.id}:close`) ? "Closing…" : isClosing ? "Continue closing bot" : "Close bot"} <X /></button>
              <button className="ghost-action" disabled={isActionPending(`bot:${selected.id}:close`)} onClick={() => setCloseReview(false)}>Go back</button>
            </AccessibleDialog>
          )}
          {basketPickerOpen && (
            <AccessibleDialog label="Choose eligible strategy markets" onClose={() => setBasketPickerOpen(false)} dismissible={!basketPickerLoading}>
              <span className="eyebrow">TRADABLE STRATEGY BASKET</span>
              <h2>Choose eligible markets</h2>
              <p>Only markets currently passing TradePulse eligibility checks appear here. A selected market is checked again for a fresh price, liquidity, and risk limits before any order opens.</p>
              <div className="amount-input">
                <input value={basketQuery} onChange={(event) => setBasketQuery(event.target.value)} placeholder="Search eligible markets" aria-label="Search eligible strategy markets" autoComplete="off" />
              </div>
              {memecoinAssets.length > 0 && <>
                <span className="eyebrow">SELECTED</span>
                <div className="segment-control" role="list" aria-label="Selected strategy markets">
                  {memecoinAssets.map((symbol) => <button type="button" role="listitem" key={symbol} className="active" disabled={memecoinAssets.length === 1} onClick={() => setMemecoinAssets((current) => current.filter((item) => item !== symbol))}><span className="memecoin-choice-label"><MemecoinMark symbol={symbol} compact />{memecoinMarketLabel(symbol)}</span> <X /></button>)}
                </div>
              </>}
              {basketPickerLoading && <div className="activity-row" role="status"><div className="activity-info"><strong>Loading eligible markets</strong><small>Checking the current executable catalogue.</small></div></div>}
              {basketPickerError && <p className="security-feedback" role="alert">{basketPickerError}</p>}
              {!basketPickerLoading && !basketPickerError && <>
                <span className="eyebrow">AVAILABLE NOW</span>
                {filteredBasketAssets.length ? <div className="support-ticket-list">
                  {filteredBasketAssets.map((asset) => {
                    const chosen = memecoinAssets.includes(asset.symbol);
                    const category = asset.category || "market";
                    return <div className="activity-row" key={asset.symbol}>
                      <div className="activity-info"><strong><MemecoinMark symbol={asset.symbol} compact /> {asset.name || memecoinMarketLabel(asset.symbol)}</strong><small>{asset.chain_label ? `${asset.chain_label} · ` : ""}{asset.symbol} · {category}{asset.venue ? ` · ${asset.venue}` : ""}</small></div>
                      <button type="button" className={chosen ? "small-action active" : "small-action"} disabled={chosen && memecoinAssets.length === 1} aria-pressed={chosen} onClick={() => setMemecoinAssets((current) => chosen ? current.filter((item) => item !== asset.symbol) : [...current, asset.symbol])}>{chosen ? "Selected" : "Add"}</button>
                    </div>;
                  })}
                </div> : <div className="activity-row"><div className="activity-info"><strong>No eligible markets match</strong><small>Try a symbol or market name from the current catalogue.</small></div></div>}
              </>}
              {memecoinAssets.some((asset) => (memecoinAssetCategories[asset] || "microcap") === "microcap") && !includeTrench && <p className="security-feedback" role="status">Enable Trench Mode before saving a basket that includes a new-launch market.</p>}
              <button type="button" className="primary-action" onClick={() => setBasketPickerOpen(false)} disabled={basketPickerLoading}>Done <StateIcon name="check" /></button>
            </AccessibleDialog>
          )}
        </div>
    );
  }
  const deployedCapital = displayBots.reduce((sum, bot) => sum + bot.capital_usd, 0);
  return (
    <div className="bots-screen">
      <div className="fleet-heading">
        <div>
          <h2>
            Bot fleet{" "}
            <small>{runningStrategies.length} active · {money(deployedCapital)} deployed · {displayBots.length} of 2 slots</small>
          </h2>
        </div>
        <div className="fleet-heading-actions">
          <button
            className="primary-action fleet-start-action"
            onClick={() => setView("create")}
            disabled={displayBots.length >= 2}
          >
            <Plus /> Start strategy
          </button>
          <button className="small-action fleet-flashback-action" onClick={() => { setFlashbackNewSession(false); setReviewError(""); setView("flashback"); }}>
            Flashback <ChevronRight />
          </button>
        </div>
      </div>
      {displayBots.length ? (
        <div className="fleet-bot-grid">
          {displayBots.map((bot) => {
            const sharedDemo = Boolean(bot.demo_trial) && !bot.demo_credit_only;
            const status = bot.demo_credit_only
              ? "manual trading credit"
              : sharedDemo
                ? `demo ${data.demo?.pool_state || data.demo?.state || bot.state}`
                : bot.state.replace(/_/g, " ");
            const statusTone = status === "running" || status === "demo active" ? "running" : "paused";
            const allocation = bot.demo_credit_only
              ? Number(data.demo?.credit_available_usd || 0) + Number(data.demo?.credit_locked_usd || 0)
              : sharedDemo
                ? Number(data.demo?.pool_available_usd || 0) + Number(data.demo?.pool_locked_usd || 0)
                : bot.capital_usd;
            const source = bot.demo_credit_only
              ? "TRADING CREDIT"
              : sharedDemo
                ? "VIRTUAL FUNDS"
                : "ALLOCATION";
            const isSynthetic = bot.product === "synthetic";
            const syntheticExecution = data.synthetic?.execution_mode || "MANUAL";
            const autoPosition = isSynthetic
              ? data.synthetic?.open_positions?.find((position) => position.mode === "auto")
              : undefined;
            const realizedSynthetic = Number(data.synthetic?.realized_pnl_usd || 0);
            const latestSyntheticSettlement = isSynthetic ? data.synthetic?.recent_settlements?.[0] : undefined;
            const latestMemecoinSettlement = !isSynthetic
              ? data.memecoin?.recent_settlements?.find((position) => Number(position.bot_id) === Number(bot.id))
              : undefined;
            const latestMemecoinEngine = latestMemecoinSettlement
              ? data.engine.find((run) => run.event_key === `memecoin-close:${latestMemecoinSettlement.id}`)
              : undefined;
            const latestSettlement = latestSyntheticSettlement || latestMemecoinSettlement;
            const latestSettlementPnl = latestSyntheticSettlement
              ? Number(latestSyntheticSettlement.user_net_pnl_usd ?? latestSyntheticSettlement.realized_pnl_usd ?? 0)
              : Number(latestMemecoinEngine?.net_realized ?? latestMemecoinSettlement?.realized_pnl ?? 0);
            const settledPnl = isSynthetic
              ? realizedSynthetic
              : data.engine.filter((run) => Number(run.bot_id) === Number(bot.id)).reduce((total, run) => total + Number(run.net_realized || 0), 0);
            const hasSettledPnl = isSynthetic
              ? Boolean(latestSyntheticSettlement)
              : data.engine.some((run) => Number(run.bot_id) === Number(bot.id));
            const rawSettlementMarket = latestSyntheticSettlement?.market || latestMemecoinSettlement?.symbol || "";
            // Contract and mint identifiers are audit data, not primary customer
            // copy. The API supplies approved aliases for both the qualified id
            // and raw address; retain a short neutral fallback during a cold
            // catalogue refresh instead of leaking an opaque identifier.
            const settlementMarket = isSynthetic
              ? rawSettlementMarket
              : data.memecoin?.market_labels?.[rawSettlementMarket]
                || data.memecoin?.market_labels?.[rawSettlementMarket.toLowerCase()]
                || "Memecoin";
            const settlementDirection = latestSyntheticSettlement?.direction || latestMemecoinSettlement?.direction;
            const settlementReason = latestSyntheticSettlement?.close_reason || latestMemecoinSettlement?.close_reason;
            return (
            <GradientPanel className={`fleet-bot-card reveal-card ${isSynthetic ? "fleet-synthetic-card" : "fleet-memecoin-card"}`} key={bot.id}>
              <div className="fleet-bot-head">
                <div>
                  <div className="bot-title">
                    <strong>{bot.name}</strong>
                    <span className={`status-chip ${statusTone}`}>
                      <i />
                      {status}
                    </span>
                  </div>
                  <span className="eyebrow">{source}</span>
                  <strong className="fleet-amount">
                    {money(allocation)}
                  </strong>
                </div>
              </div>
              <div className="fleet-metrics">
                <div>
                  <span>{isSynthetic ? "EXECUTION" : bot.demo_credit_only ? "EXECUTION" : sharedDemo ? "POOL" : "COMPOUND"}</span>
                  <strong>{isSynthetic ? `Auto ${syntheticExecution === "AUTO" ? "on" : "off"}` : bot.demo_credit_only ? "Manual only" : sharedDemo ? "Shared across products" : `${bot.compound_percent}%`}</strong>
                </div>
                <div>
                  <span>{isSynthetic ? "ACTIVE AUTO ORDER" : "LATEST SETTLEMENT"}</span>
                  <strong className={isSynthetic ? (autoPosition ? "up" : "down") : statusTone === "running" ? "up" : "down"}>
                    {isSynthetic ? autoPosition ? `${autoPosition.market} · ${String(autoPosition.direction || "").toUpperCase()} · ${money(Number(autoPosition.margin_usd || 0))}` : "No Auto order open" : latestSettlement ? `${settlementMarket} · ${String(settlementDirection || "").toUpperCase()} · ${latestSettlementPnl >= 0 ? "+" : "−"}${money(Math.abs(latestSettlementPnl))}` : "No settled positions"}
                  </strong>
                </div>
                <div>
                  <span>{isSynthetic ? "LATEST SETTLEMENT" : "ALL SETTLED P&L"}</span>
                  <strong className={latestSettlement ? (latestSettlementPnl >= 0 ? "up" : "down") : hasSettledPnl && settledPnl < 0 ? "down" : "up"}>
                    {isSynthetic ? latestSettlement ? `${settlementMarket} · ${String(settlementDirection || "").toUpperCase()} · ${latestSettlementPnl >= 0 ? "+" : "−"}${money(Math.abs(latestSettlementPnl))}` : "No settled positions" : hasSettledPnl ? `${settledPnl >= 0 ? "+" : "−"}${money(Math.abs(settledPnl))}` : "No settled positions"}
                  </strong>
                  {latestSettlement && <small>{formatSettlementExitReason(settlementReason)}</small>}
                </div>
              </div>
              <div className="fleet-bot-actions">
                <span className="compound-chip">
                  {isSynthetic ? hasSettledPnl ? `${settledPnl >= 0 ? "ALL SETTLED P&L +" : "ALL SETTLED P&L −"}${money(Math.abs(settledPnl))}` : "NO SETTLED POSITIONS" : bot.demo_credit_only ? "MANUAL ONLY" : sharedDemo ? "SHARED VIRTUAL DEMO" : `COMPOUND ${bot.compound_percent}%`}
                </span>
                <button
                  className="small-action"
                  onClick={() => {
                    setSelectedId(bot.id);
                    setView("detail");
                  }}
                >
                  Open detail <ChevronRight />
                </button>
              </div>
            </GradientPanel>
            );
          })}
          {flashbackFleetCard}
        </div>
      ) : (
        <>
          {flashbackFleetCard && <div className="fleet-bot-grid">{flashbackFleetCard}</div>}
          <EmptyBots onLaunch={() => setView("create")} />
        </>
      )}
      {displayBots.some((bot) => bot.state === "paused") && (
        <GradientPanel className="bot-card">
          <img
            src="/illustrations/engine-paused.png"
            alt="Paused bot engine"
            className="illustration-engine-paused"
            decoding="async"
          />
          <div>
            <span className="eyebrow">BOT PAUSED</span>
            <h2>One or more bots are paused</h2>
            <p>
              Paused bots retain allocation and do not process new strategy runs
              until resumed.
            </p>
          </div>
        </GradientPanel>
      )}
      {data?.demo?.state === "issued" && (
        <button
          className="demo-link"
          onClick={onOpenDemo}
        >
          Start the {Number(data?.demo?.grant_usd || 0) > 0 ? money(Number(data?.demo?.grant_usd)) : "shared"} virtual demo{" "}
          <ChevronRight />
        </button>
      )}
      {data?.demo?.state === "active" && (
        <p className="demo-link" role="status">
          Shared virtual demo · {money(Number(data?.demo?.pool_available_usd || 0))} available · {money(Number(data?.demo?.pool_locked_usd || 0))} locked · isolated from wallet
        </p>
      )}
    </div>
  );
}
