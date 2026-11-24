"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibleDialog } from "../accessible-dialog";
import { DeskLocalized } from "../desk-language";
import { ActionFeedback } from "../ui/action-feedback";
import { formatSettlementExitReason } from "../../lib/settlement-label";
import { flashbackSettlementPresentation } from "../../lib/financial-flow-reconciliation";
import { logDeskFailure } from "../../lib/desk-api";
import {
  getFlashbackStartAvailability,
  parseFlashbackEntryAmount,
  shouldOpenDirectionOnFlashbackEntry,
  shouldPollFlashbackStatus,
} from "../../lib/flashback-controls";
import type { WorkspaceDashboard } from "./workspace-dashboard";
import { useResourcePoller } from "./use-resource-poller";
import { MarketChart, formatMarketPrice, type MarketCandle, type MarketPoint } from "./market-chart";
import { ChevronRight, GradientPanel, PaymentMark, Plus, StateIcon, StateSwapIcon, X, Zap, money } from "./shared-ui";

function BotProductCard({ name, description, selected, onClick }: { name: string; description: string; selected?: boolean; onClick: () => void }) {
  return <DeskLocalized><button className={`product-card ${selected ? "selected" : ""}`} onClick={onClick}><span><strong>{name}</strong><small>{description}</small></span><ChevronRight /></button></DeskLocalized>;
}
function EmptyBots({ onLaunch }: { onLaunch?: () => void }) {
  return <DeskLocalized><GradientPanel className="empty-bots"><img src="/illustrations/empty-bots.png" alt="No bots running" className="illustration-empty-bots pointer-events-none select-none" draggable={false} decoding="async" loading="eager" /><span className="eyebrow">YOUR BOT FLEET</span><h2>Set up your first automation</h2><p>Choose Memecoin or Synthetic Indices when at least $20 is available.</p><button className="primary-action" onClick={onLaunch}>Choose a strategy <ChevronRight size={14} /></button></GradientPanel></DeskLocalized>;
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
  initialBotId = null,
  initialView = "fleet",
  flashbackOnly = false,
  onLeaveFlashback,
}: {
  data: WorkspaceDashboard;
  request: (path: string, options?: RequestInit, environment?: "mainnet" | "testnet", timeoutMs?: number) => Promise<any>;
  reload: () => Promise<void>;
  onActionResult: (path: string, payload: Record<string, unknown>, response: Record<string, unknown>) => void;
  onNotice: (message: string) => void;
  initialBotId?: string | null;
  initialView?: "fleet" | "create" | "flashback";
  flashbackOnly?: boolean;
  onLeaveFlashback?: () => void;
}) {
  const initialFlashbackSessions = (data.flashback_sessions || (data.flashback ? [data.flashback] : []))
    .filter((session) => session.product_version === "market-direction-v1");
  const openDirectionOnEntry = shouldOpenDirectionOnFlashbackEntry(
    initialView === "flashback",
    initialFlashbackSessions,
    Boolean(data.flashback_direction?.markets?.length),
  );
  const [view, setView] = useState<"fleet" | "create" | "detail" | "flashback">(
    initialBotId ? "detail" : initialView,
  );
  const [product, setProduct] = useState<"memecoin" | "synthetic">("memecoin");
  const [amount, setAmount] = useState("20");
  const [review, setReview] = useState(false);
  const [syntheticRiskAcknowledged, setSyntheticRiskAcknowledged] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialBotId);
  // Pending state is scoped to the action and its resource. A slow request on
  // one bot must never make another bot, position, or Flashback control look
  // like it is processing.
  const [pendingActions, setPendingActions] = useState<Record<string, boolean>>({});
  const [reviewError, setReviewError] = useState("");
  const [closeReview, setCloseReview] = useState(false);
  const [flashbackAmount, setFlashbackAmount] = useState("20");
  const [flashbackReview, setFlashbackReview] = useState(false);
  const [flashbackNewSession, setFlashbackNewSession] = useState(false);
  const [selectedFlashbackId, setSelectedFlashbackId] = useState<string | null>(null);
  const [flashbackType, setFlashbackType] = useState<"sealed" | "direction" | null>(() => openDirectionOnEntry ? "direction" : null);
  const [flashbackDirectionMarket, setFlashbackDirectionMarket] = useState("");
  const [flashbackDirectionChoice, setFlashbackDirectionChoice] = useState<"up" | "down" | null>(null);
  const flashbackMarketStepRef = useRef<HTMLHeadingElement | null>(null);
  const flashbackCallStepRef = useRef<HTMLHeadingElement | null>(null);
  const flashbackEntryStepRef = useRef<HTMLHeadingElement | null>(null);
  const [flashbackNow, setFlashbackNow] = useState(() => Date.now());
  const [flashbackClockOffset, setFlashbackClockOffset] = useState(0);
  const [compoundOverrides, setCompoundOverrides] = useState<Record<string, number>>({});
  const pollingWorkspace = flashbackOnly ? "Flashback" : "Bots";
  const [initialCompoundPercent, setInitialCompoundPercent] = useState(0);
  const [allocationDeltas, setAllocationDeltas] = useState<Record<string, number>>({});
  const [stateOverrides, setStateOverrides] = useState<Record<string, string>>({});
  const [closedBotIds, setClosedBotIds] = useState<string[]>([]);
  const [memecoinMarket, setMemecoinMarket] = useState("DOGE");
  const [memecoinAssets, setMemecoinAssets] = useState<string[]>(["DOGE", "SHIB", "PEPE", "WIF", "BONK"]);
  const [memecoinLeverage, setMemecoinLeverage] = useState(3);
  const [memecoinCadence, setMemecoinCadence] = useState(300);
  const [memecoinAutoEnabled, setMemecoinAutoEnabled] = useState(false);
  const [includeTrench, setIncludeTrench] = useState(false);
  const [acceptedMemecoinAuthorizations, setAcceptedMemecoinAuthorizations] = useState<Record<string, boolean>>({});
  const [memecoinAssetCategories, setMemecoinAssetCategories] = useState<Record<string, string>>({
    DOGE: "bluechip", SHIB: "bluechip", PEPE: "midcap", WIF: "midcap", BONK: "midcap",
  });
  const [memecoinCatalog, setMemecoinCatalog] = useState<Array<{ symbol: string; name?: string; category?: string; venue?: string; chain?: string; chain_label?: string; token_address?: string; eligible?: boolean }>>([]);
  const [memecoinInsights, setMemecoinInsights] = useState<Record<string, { available?: boolean; completed_positions?: number; participant_count?: number; positive_position_rate?: number }>>({});
  const [basketPickerOpen, setBasketPickerOpen] = useState(false);
  const [basketPickerLoading, setBasketPickerLoading] = useState(false);
  const [basketPickerError, setBasketPickerError] = useState("");
  const [basketQuery, setBasketQuery] = useState("");
  const [memecoinSnapshot, setMemecoinSnapshot] = useState<{ symbol?: string; bot_id?: number | null; environment?: string; partial?: boolean; points?: MarketPoint[]; candles?: MarketCandle[]; latest?: { source?: string }; positions?: Array<{ id: string; symbol: string; direction: string; status: string; margin_usd: number; entry_price: number; mark_price?: number; unrealized_pnl?: number; realized_pnl?: number; close_reason?: string; stop_loss_price?: number; take_profit_price?: number; execution_type?: "automatic" | "manual"; idempotency_key?: string }>; events?: MemecoinEvent[] }>({});
  const [memecoinOrder, setMemecoinOrder] = useState<{
    direction: "long" | "short";
    amount: string;
    idempotencyKey: string;
  } | null>(null);
  useEffect(() => {
    setSelectedId(initialBotId);
    setView(initialBotId ? "detail" : initialView);
  }, [initialBotId, initialView]);
  const displayBots = data.bots
    .filter((bot) => !bot.demo_trial && !bot.demo_credit_only && !closedBotIds.includes(bot.id))
    .map((bot) => ({
      ...bot,
      state: stateOverrides[bot.id] ?? bot.state,
      compound_percent: compoundOverrides[bot.id] ?? bot.compound_percent,
      capital_usd: bot.capital_usd + (allocationDeltas[bot.id] || 0),
    }));
  const selected =
    displayBots.find((bot) => bot.id === selectedId) || displayBots[0];
  const runningStrategies = displayBots.filter((bot) => bot.state === "running");
  const latestFlashback = data.flashback || null;
  const flashbackSessions = (data.flashback_sessions || (latestFlashback ? [latestFlashback] : []))
    .filter((session) => session.product_version === "market-direction-v1");
  const activeFlashbacks = flashbackSessions.filter((session) => session.state === "sealed" || session.state === "ready_to_reveal");
  const recentFlashbackSessions = flashbackSessions
    .filter((session) => session.state === "revealed")
    .slice(0, 8);
  // The selected contract is a reading choice. Its state must never pause the
  // clock for another contract that is still live.
  const activeCountdownSession = activeFlashbacks.find((session) => session.state === "sealed") || null;
  const flashback = flashbackSessions.find((session) => session.id === selectedFlashbackId) || flashbackSessions[0] || null;
  const flashbackSessionIds = flashbackSessions.map((session) => session.id).join("|");
  const flashbackSessionChoices = [
    ...activeFlashbacks,
    ...(flashback && !activeFlashbacks.some((session) => session.id === flashback.id) ? [flashback] : []),
  ];
  const flashbackRules = data.flashback_rules;
  const flashbackDirection = data.flashback_direction;
  const directionMarkets = flashbackDirection?.markets || [];
  const flashbackMinEntry = Number(flashbackRules?.min_entry_usd || 20);
  const flashbackMaxEntry = Number(flashbackRules?.max_entry_usd || 1000);
  const flashbackAmountValue = parseFlashbackEntryAmount(flashbackAmount);
  const flashbackAmountNumber = flashbackAmountValue ?? 0;
  const flashbackAmountIssue = flashbackAmountValue === null
    ? "Enter a valid USD amount with no more than two decimal places."
    : flashbackAmountValue < flashbackMinEntry
      ? `The minimum entry is ${money(flashbackMinEntry)}.`
      : flashbackAmountValue > flashbackMaxEntry
        ? `The maximum entry is ${money(flashbackMaxEntry)}.`
        : flashbackAmountValue > data.wallet.available
          ? "The entry exceeds your available wallet balance."
          : "";
  const flashbackAmountWithinLimits = !flashbackAmountIssue;
  const flashbackSlotAvailability = getFlashbackStartAvailability(activeFlashbacks);
  const canStartSealedReturn = flashbackSlotAvailability.sealed;
  const canStartDirection = flashbackSlotAvailability.direction && directionMarkets.length > 0;
  const canStartAnyFlashback = canStartSealedReturn || canStartDirection;
  const hasActiveSealedReturn = activeFlashbacks.some((session) => session.product_version !== "market-direction-v1");
  const hasActiveDirection = activeFlashbacks.some((session) => session.product_version === "market-direction-v1");
  const flashbackStartBlockedMessage = activeFlashbacks.length >= 2
    ? "Both Flashback contract slots are occupied. Wait for one contract to settle before starting another."
    : hasActiveSealedReturn && !directionMarkets.length
      ? "A Sealed Return is already active, and no Direction markets are currently enabled."
      : !directionMarkets.length
        ? "No Direction markets are currently enabled. Try again when an administrator publishes one."
        : "No Flashback contract type is available to start right now.";
  const flashbackTypeAvailable = flashbackType === "sealed"
    ? canStartSealedReturn
    : flashbackType === "direction" && canStartDirection;
  const flashbackTypeUnavailableMessage = flashbackType === "direction"
    ? !directionMarkets.length
      ? "No Direction markets are currently enabled. Choose another contract type or try again later."
      : hasActiveDirection
        ? "A Direction contract is already active. It must settle before another can start."
        : flashbackStartBlockedMessage
    : hasActiveSealedReturn
      ? "A Sealed Return contract is already active. It must settle before another can start."
      : flashbackStartBlockedMessage;
  const flashbackInCreationFlow = flashbackNewSession || flashbackType !== null || !flashback;
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
  const flashbackReturnRows = flashbackReturnTable(flashbackAmountNumber);
  const flashbackSealedTermsAvailable = flashbackReturnRows.length > 0;
  const currentDirectionMultiplier = directionMultiplier(flashbackAmountNumber);
  const canConfirmFlashback = flashbackAmountWithinLimits
    && flashbackTypeAvailable
    && (flashbackType !== "sealed" || flashbackSealedTermsAvailable)
    && (flashbackType !== "direction"
      || (Boolean(flashbackDirectionChoice) && Boolean(flashbackDirectionMarket) && currentDirectionMultiplier > 0));
  const sealedReturn = flashback?.product_version === "sealed-return-v2";
  const flashbackSettlement = flashbackSettlementPresentation(flashback || {});
  const sealedEntropyRefund = flashbackSettlement.isEntropyRefund;
  useEffect(() => {
    setSelectedFlashbackId((current) => flashbackSessions.some((session) => session.id === current)
      ? current
      : flashbackSessions[0]?.id || null);
  }, [flashbackSessionIds]);
  useEffect(() => {
    if (view !== "flashback" || flashbackType !== "direction") return;
    const target = !flashbackDirectionMarket
      ? flashbackMarketStepRef.current
      : !flashbackDirectionChoice
        ? flashbackCallStepRef.current
        : flashbackEntryStepRef.current;
    target?.focus();
  }, [flashbackDirectionChoice, flashbackDirectionMarket, flashbackType, view]);
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
    tick();
    const countdown = window.setInterval(tick, 1_000);
    return () => {
      window.clearInterval(countdown);
    };
  }, [activeCountdownSession?.expires_at, activeCountdownSession?.id, activeCountdownSession?.product_version, view]);
  useResourcePoller(
    async (_token, signal) => {
      const snapshot = await request("/v1/flashback", { signal });
      return snapshot?.session && typeof snapshot.session === "object"
        ? snapshot
        : undefined;
    },
    (snapshot) => onActionResult("/v1/flashback/refresh", {}, snapshot),
    3_000,
    shouldPollFlashbackStatus(view === "flashback", flashbackSessions),
    `flashback:${flashbackSessionIds}`,
    (error) => logDeskFailure("bots.flashback-refresh", error),
    pollingWorkspace,
  );
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
    setMemecoinAssets(["DOGE", "SHIB", "PEPE", "WIF", "BONK"]);
    setMemecoinLeverage(3);
    setMemecoinCadence(300);
    setMemecoinAutoEnabled(false);
    setIncludeTrench(false);
    setMemecoinAssetCategories({ DOGE: "bluechip", SHIB: "bluechip", PEPE: "midcap", WIF: "midcap", BONK: "midcap" });
    const encoded = data.memecoin?.authorization?.settings_json;
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
  }, [selected?.id, selected?.product, data.memecoin?.authorization?.settings_json]);
  useEffect(() => {
    if (!selected || selected.product !== "memecoin") return;
    void refreshMemecoinCatalog().catch((error) => {
      // A label refresh cannot interrupt the existing market or order view.
      logDeskFailure("bots.memecoin-catalog", error);
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
      logDeskFailure("bots.memecoin-catalog", error);
      setBasketPickerError("unavailable");
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
    if (!insight?.available) return "Performance data will appear after enough trades have settled to protect user privacy.";
    return `All-time settled mainnet result: ${insight.positive_position_rate}% of ${insight.completed_positions} completed wallet-funded positions closed positive across ${insight.participant_count} participants. Historical results are not a forecast.`;
  };
  useEffect(() => {
    if (memecoinAssets.length && !memecoinAssets.includes(memecoinMarket)) {
      setMemecoinMarket(memecoinAssets[0]);
    }
  }, [memecoinAssets, memecoinMarket]);
  useResourcePoller(
    async (_token, signal) => request(
      `/v1/memecoin/snapshot?bot_id=${selected?.id}&symbol=${memecoinMarket}`,
      { signal },
    ),
    (snapshot) => {
      if (!snapshot?.partial) {
        setMemecoinSnapshot(snapshot || {});
        return;
      }
      setMemecoinSnapshot((current) => {
        const sameMarket = current.symbol === snapshot.symbol;
        const sameOwnerScope = current.bot_id === snapshot.bot_id && current.environment === snapshot.environment;
        const responseMatchesSelection =
          String(snapshot.bot_id) === String(selected?.id) && snapshot.environment === data.environment;
        const canApplyOwnerData = sameOwnerScope || responseMatchesSelection;
        const positions = Array.isArray(snapshot.positions) ? snapshot.positions : current.positions;
        const events = Array.isArray(snapshot.events) ? snapshot.events : current.events;
        return {
          ...current,
          bot_id: snapshot.bot_id,
          environment: snapshot.environment,
          symbol: snapshot.symbol,
          points: sameMarket && current.points?.length ? current.points : snapshot.points || [],
          candles: sameMarket && current.candles?.length ? current.candles : snapshot.candles || [],
          latest: sameMarket && current.latest ? current.latest : snapshot.latest,
          positions: canApplyOwnerData ? positions : [],
          events: canApplyOwnerData ? events : [],
        };
      });
    },
    5_000,
    Boolean(!flashbackOnly && selected && selected.product === "memecoin"),
    `memecoin:${selected?.id || ""}:${memecoinMarket}`,
    (error) => logDeskFailure("bots.memecoin-snapshot", error),
    "Bots",
  );
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
      .catch((error) => {
        if (cancelled) return;
        logDeskFailure("bots.memecoin-insights", error);
        setMemecoinInsights({});
      });
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
    const durableAction = path === "/v1/bots" || (path === `/v1/bots/${selected.id}/actions` && payload.action === "authorize");
    setReviewError("");
    setPendingActions((current) => ({ ...current, [actionKey]: true }));
    try {
      const response = await request(path, {
        method: "POST",
        body: JSON.stringify(payload),
      }, undefined, durableAction ? 40_000 : undefined);
      onNotice(response.message || "Your changes were saved.");
      // The parent owns the desk snapshot. Apply an authoritative response
      // there rather than reaching across component scope; only responses
      // without a usable projection are reconciled in the background. The
      // completed action should not remain stuck behind a full dashboard load.
      const hasAuthoritativeResult = Boolean(response.bot || response.wallet || response.position || response.session);
      if (hasAuthoritativeResult) {
        onActionResult(path, payload, response);
      }
      // The immediate mutation result is used first, so this control never
      // waits behind a screen-wide reload. A funded authorization also gets a
      // quiet follow-up read: it is the durable source of truth if a proxy or
      // an earlier desk snapshot arrives out of order.
      if (durableAction || !hasAuthoritativeResult) {
        void reload().catch((error) => logDeskFailure("bots.dashboard-reconcile", error));
      }
      return true;
    } catch (error) {
      logDeskFailure("bots.action", error);
      setReviewError("");
      void reload().catch((reloadError) => logDeskFailure("bots.dashboard-reconcile", reloadError));
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
  const beginNewFlashbackSession = () => {
    setFlashbackAmount("20");
    setFlashbackType("direction");
    setFlashbackDirectionMarket("");
    setFlashbackDirectionChoice(null);
    setReviewError("");
    setFlashbackNewSession(true);
  };
  const startFlashback = async () => {
    if (!canConfirmFlashback || flashbackType !== "sealed") return;
    const started = await run("/v1/flashback/start", { amount: flashbackAmountNumber });
    if (started) {
      setFlashbackReview(false);
      setFlashbackNewSession(false);
      setFlashbackType(null);
      setSelectedFlashbackId(null);
      setFlashbackNow(Date.now());
    }
  };
  const startFlashbackDirection = async () => {
    if (!canConfirmFlashback || flashbackType !== "direction" || !flashbackDirectionChoice || !flashbackDirectionMarket) return;
    const started = await run("/v1/flashback/direction/start", { amount: flashbackAmountNumber, market: flashbackDirectionMarket, direction: flashbackDirectionChoice });
    if (started) {
      setFlashbackReview(false);
      setFlashbackNewSession(false);
      setFlashbackType(null);
      setSelectedFlashbackId(null);
      setFlashbackNow(Date.now());
    }
  };
  if (view === "flashback" || flashbackOnly)
    return (
      <DeskLocalized>
      <div className="bot-detail">
        <button className="back-action" onClick={() => {
          if (flashbackInCreationFlow && flashback) {
            setFlashbackNewSession(false);
            setFlashbackType(null);
            setFlashbackDirectionChoice(null);
            setReviewError("");
            return;
          }
          setFlashbackNewSession(false);
          if (flashbackOnly) onLeaveFlashback?.();
          else setView("fleet");
        }}>
          <StateIcon name="arrow-left" /> {flashbackInCreationFlow && flashback
            ? flashback.state === "revealed" ? "Back to result" : "Back to current contract"
            : "Back to Bots"}
        </button>
        <GradientPanel className="detail-hero">
          <div>
            <h2>Flashback</h2>
            <span role="status" aria-live="polite" className={`status-chip ${flashback?.state === "ready_to_reveal" ? "paused" : "running"}`}>
              <i />
              {flashbackInCreationFlow ? "new contract" : flashback?.state === "sealed" ? (directionContract ? "direction active" : sealedReturn ? "sealed return" : "earlier session") : flashback?.state === "ready_to_reveal" ? "finalising" : flashback?.state === "revealed" ? "settled" : "choose a contract"}
            </span>
          </div>
        </GradientPanel>
        {flashbackSessionChoices.length > 1 && <GradientPanel className="compound-panel">
          <h2>Choose a contract</h2>
          <p>Each contract has its own entry, settlement clock, and result. Select one to view its exact outcome.</p>
          <div className="segment-control flashback-session-selector" role="radiogroup" aria-label="Flashback contract" onKeyDown={handleBotChoiceKeyDown}>
            {flashbackSessionChoices.map((session) => {
              const isSelected = session.id === flashback?.id;
              const kind = session.product_version === "market-direction-v1" ? "Direction" : "Sealed Return";
              const status = session.state === "ready_to_reveal"
                ? "Finalising"
                : session.state === "sealed"
                  ? `${Math.max(0, Math.ceil(((session.expires_at || 0) * 1000 - (flashbackNow + flashbackClockOffset)) / 1000))}s left`
                  : "Settled";
              return <button type="button" role="radio" aria-checked={isSelected} tabIndex={isSelected ? 0 : -1} className={isSelected ? "active" : ""} key={session.id} onClick={() => { setSelectedFlashbackId(session.id || null); setFlashbackNewSession(false); setFlashbackType(null); }}>{kind} · {money(Number(session.allocation_usd || 0))} · {status}</button>;
            })}
          </div>
        </GradientPanel>}
        <GradientPanel className="compound-panel">
          <h2>Active Direction</h2>
          <p>One Flashback Direction can be active. It settles automatically on a 30-second contract clock.</p>
          <div className="fact-block">{activeFlashbacks.length ? activeFlashbacks.map((session) => <span key={session.id}><b>DIRECTION · {session.market}/USD · {String(session.direction || "").toUpperCase()}</b><b>{session.state === "sealed" ? `${Math.max(0, Math.ceil(((session.expires_at || 0) * 1000 - (flashbackNow + flashbackClockOffset)) / 1000))}s LEFT` : "SETTLING AUTOMATICALLY"}</b></span>) : <span><b>NO ACTIVE DIRECTION</b><b>READY</b></span>}</div>
          {!flashbackInCreationFlow && activeFlashbacks.length > 0 && canStartAnyFlashback && <button type="button" className="small-action" onClick={beginNewFlashbackSession}>Choose another contract <Plus /></button>}
        </GradientPanel>
        {flashbackInCreationFlow && <>
          {!flashbackType && canStartDirection && <GradientPanel className="compound-panel">
            <h2>Flashback Direction</h2>
            <p>Choose BTC, ETH, SOL, XRP or DOGE and call Higher or Lower for 30 seconds.</p>
            <p><b>At risk:</b> an incorrect call loses the full entry. A tie returns the full entry.</p>
            <button className="small-action" onClick={() => { setFlashbackType("direction"); setFlashbackDirectionMarket(""); setFlashbackDirectionChoice(null); setReviewError(""); }}>
              Choose Direction <ChevronRight />
            </button>
          </GradientPanel>}
          {!flashbackType && !canStartAnyFlashback && <GradientPanel className="compound-panel" role="status">{flashbackStartBlockedMessage}</GradientPanel>}
          {flashbackType && !flashbackTypeAvailable && <GradientPanel className="compound-panel" role="alert">
            <p>{flashbackTypeUnavailableMessage}</p>
            <button className="ghost-action" onClick={() => { setFlashbackType(null); setFlashbackDirectionChoice(null); }}>Choose another type</button>
          </GradientPanel>}
          {flashbackType === "sealed" && canStartSealedReturn && <>
            <GradientPanel className="compound-panel">
              <h2>A sealed return</h2>
              <p>Choose an entry within the published range. Flashback locks its published return table, then keeps the randomly determined return sealed until the reveal window closes. It does not place or simulate a market trade.</p>
              <label className="amount-field">ENTRY AMOUNT (USD)<div className="amount-input"><span>$</span><input type="text" inputMode="decimal" required aria-invalid={!flashbackAmountWithinLimits} aria-describedby="flashback-entry-help" value={flashbackAmount} onChange={(event) => setFlashbackAmount(event.target.value)} aria-label="Sealed Return entry amount" /></div></label>
              <small id="flashback-entry-help">Enter {money(flashbackMinEntry)}–{money(flashbackMaxEntry)} USD, within your available wallet balance.</small>
              {flashbackSealedTermsAvailable
                ? <div className="fact-block">{flashbackTableSummary(flashbackReturnRows).map(([label, value]) => <span key={label}><b>{label}</b><b>{value}</b></span>)}</div>
                : <p className="security-feedback" role="alert">Published return terms are not available for this entry amount. You cannot start until valid terms are available.</p>}
            </GradientPanel>
            <div className="detail-stats"><GradientPanel><span>AMOUNT AT RISK</span><strong>{money(flashbackAmountNumber)}</strong></GradientPanel><GradientPanel><span>REVEAL WINDOW</span><strong>{Number(flashbackRules?.duration_seconds || 30)}s</strong></GradientPanel><GradientPanel><span>MAX RETURN</span><strong>{money(flashbackAmountNumber * Number(flashbackRules?.max_return_multiplier || 3))}</strong></GradientPanel></div>
            <GradientPanel className="compound-panel"><p>The complete entry can be lost. The published table includes the entry in every return, and larger outcomes are rarer. There is no performance fee, and a sealed return cannot be ended early.</p>{flashbackAmountIssue && <p className="security-feedback" role="alert">{flashbackAmountIssue}</p>}<button className="primary-action" disabled={!flashbackAmountWithinLimits || !canStartSealedReturn || !flashbackSealedTermsAvailable} onClick={() => { setReviewError(""); setFlashbackReview(true); }}>Review sealed Flashback <ChevronRight /></button><button className="ghost-action" onClick={() => { setFlashbackType(null); setFlashbackDirectionChoice(null); }}>Choose another type</button></GradientPanel>
          </>}
          {flashbackType === "direction" && canStartDirection && <>
            <GradientPanel className="compound-panel">
              <h2>Flashback Direction</h2>
              <p>Make one 30-second price call. First choose a market, then whether you expect its USD reference price to finish higher or lower.</p>
              <div className="flashback-direction-steps">
                <section className="flashback-direction-step" aria-labelledby="direction-market-step">
                  <div><span>1</span><h3 id="direction-market-step" ref={flashbackMarketStepRef} tabIndex={-1}>Choose a market</h3></div>
                  {flashbackDirectionMarket
                    ? <div className="flashback-direction-summary"><b>{flashbackDirectionMarket}/USD selected</b><button type="button" className="ghost-action" onClick={() => { setFlashbackDirectionMarket(""); setFlashbackDirectionChoice(null); }}>Change market</button></div>
                    : <div className="segment-control" role="radiogroup" aria-label="Flashback Direction market" onKeyDown={handleBotChoiceKeyDown}>{directionMarkets.map((item, index) => <button type="button" role="radio" aria-checked={false} tabIndex={index === 0 ? 0 : -1} key={item.symbol} onClick={() => { setFlashbackDirectionMarket(item.symbol); setFlashbackDirectionChoice(null); }}>{item.symbol}/USD</button>)}</div>}
                </section>
                {flashbackDirectionMarket && <section className="flashback-direction-step" aria-labelledby="direction-call-step">
                  <div><span>2</span><h3 id="direction-call-step" ref={flashbackCallStepRef} tabIndex={-1}>Make your call</h3></div>
                  {flashbackDirectionChoice
                    ? <div className="flashback-direction-summary"><b>{flashbackDirectionChoice === "up" ? "Higher" : "Lower"} selected</b><button type="button" className="ghost-action" onClick={() => setFlashbackDirectionChoice(null)}>Change call</button></div>
                    : <><p>At the 30-second expiry, will {flashbackDirectionMarket}/USD be higher or lower than its entry price?</p>
                      <div className="segment-control direction-call-control" role="radiogroup" aria-label="Flashback Direction choice" onKeyDown={handleBotChoiceKeyDown}><button type="button" role="radio" aria-checked={false} tabIndex={0} className="" onClick={() => setFlashbackDirectionChoice("up")}><b>Higher</b><small>Price finishes above entry</small></button><button type="button" role="radio" aria-checked={false} tabIndex={-1} className="" onClick={() => setFlashbackDirectionChoice("down")}><b>Lower</b><small>Price finishes below entry</small></button></div></>}
                </section>}
                {flashbackDirectionMarket && flashbackDirectionChoice && <section className="flashback-direction-step" aria-labelledby="direction-entry-step">
                  <div><span>3</span><h3 id="direction-entry-step" ref={flashbackEntryStepRef} tabIndex={-1}>Set your entry</h3></div>
                  <label className="amount-field">ENTRY AMOUNT (USD)<div className="amount-input"><span>$</span><input type="text" inputMode="decimal" required aria-invalid={!flashbackAmountWithinLimits} aria-describedby="flashback-entry-help" value={flashbackAmount} onChange={(event) => setFlashbackAmount(event.target.value)} aria-label="Flashback Direction entry amount" /></div></label>
                  <small id="flashback-entry-help">Enter {money(flashbackMinEntry)}–{money(flashbackMaxEntry)} USD, within your available wallet balance.</small>
                  {flashbackAmountIssue && <p className="security-feedback" role="alert">{flashbackAmountIssue}</p>}
                </section>}
              </div>
              {flashbackDirectionMarket && flashbackDirectionChoice && <div className="fact-block"><span>WINDOW <b>{Number(flashbackDirection?.duration_seconds || 30)} SECONDS</b></span><span>CORRECT RETURN <b>{currentDirectionMultiplier.toFixed(2)}×</b></span><span>SETTLEMENT <b>KRAKEN USD MIDPOINT</b></span><span>TIE <b>FULL ENTRY RETURNED</b></span></div>}
            </GradientPanel>
            {flashbackDirectionMarket && flashbackDirectionChoice && <GradientPanel className="compound-panel"><p>Your market and direction are fixed at confirmation. The entry cannot be changed or ended early. There is no performance fee.</p>{currentDirectionMultiplier <= 0 && <p className="security-feedback" role="alert">No published Direction return is available for this entry amount.</p>}<button className="primary-action" disabled={!canConfirmFlashback} onClick={() => { setReviewError(""); setFlashbackReview(true); }}>Review Flashback Direction <ChevronRight /></button><button className="ghost-action" onClick={() => { setFlashbackType(null); setFlashbackDirectionChoice(null); }}>Choose another type</button></GradientPanel>}
          </>}
        </>}
        {flashback?.state === "sealed" && directionContract && !flashbackInCreationFlow && <>
          <div className="detail-stats"><GradientPanel><span>MARKET / CALL</span><strong>{flashback.market}/USD · {String(flashback.direction || "").toUpperCase()}</strong></GradientPanel><GradientPanel><span>SETTLES IN</span><strong>{flashbackRemaining === 0 ? "FINALISING" : flashbackTimeLabel}</strong></GradientPanel><GradientPanel><span>ENTRY</span><strong>{money(Number(flashback.allocation_usd || 0))}</strong></GradientPanel></div>
          <GradientPanel className="compound-panel"><h2>Direction is active</h2><p>The entry reference was captured at confirmation. This live reference helps you follow the move; it is not the settlement quote, which is captured automatically at expiry.</p><div className="fact-block"><span>ENTRY PRICE <b>{formatMarketPrice(Number(flashback.entry_price || 0))}</b></span><span>CURRENT REFERENCE <b>{liveDirectionReference?.price !== undefined ? formatMarketPrice(Number(liveDirectionReference.price)) : "REFRESHING"}</b></span><span>MOVE <b className={liveDirectionReference?.move_percent === undefined ? undefined : liveDirectionReference.move_percent > 0 ? "up" : liveDirectionReference.move_percent < 0 ? "down" : undefined}>{liveDirectionReference?.move_percent === undefined ? "—" : `${liveDirectionReference.move_percent > 0 ? "+" : ""}${liveDirectionReference.move_percent.toFixed(3)}%`}</b></span><span>YOUR CALL <b className={liveDirectionReference?.call_status === "ahead" ? "up" : liveDirectionReference?.call_status === "behind" ? "down" : undefined}>{liveDirectionReference?.call_status === "ahead" ? "AHEAD" : liveDirectionReference?.call_status === "behind" ? "BEHIND" : liveDirectionReference?.call_status === "flat" ? "LEVEL" : "REFRESHING"}</b></span><span>PUBLISHED RETURN <b>{Number((flashback.payout_table as Record<string, unknown>)?.multiplier || 0).toFixed(2)}×</b></span><span>PRICE SOURCE <b>{liveDirectionReference?.source || flashback.entry_source || "KRAKEN"}</b></span></div></GradientPanel>
        </>}
        {flashback?.state === "sealed" && !directionContract && !flashbackInCreationFlow && <>
          <div className="detail-stats">
            <GradientPanel><span>ENTRY</span><strong>{money(Number(flashback.allocation_usd || 0))}</strong></GradientPanel>
            <GradientPanel><span>REVEAL WINDOW</span><strong>{sealedReturn && flashbackRemaining === 0 ? "FINALISING" : flashbackTimeLabel}</strong></GradientPanel>
            <GradientPanel><span>STATUS</span><strong>SEALED</strong></GradientPanel>
          </div>
          <GradientPanel className="compound-panel">
            <h2>{sealedReturn ? "Return is sealed" : "Earlier session"}</h2>
            <p>{sealedReturn ? "The return table and entry are committed. The future external entropy source is used only after the reveal window ends, and TradeMemo reveals the result automatically at expiry." : "This session was created before the current sealed-return product. It will complete at its scheduled reveal time; early settlement is no longer available."}</p>
            {sealedReturn ? <div className="fact-block">
              <span>COMMITMENT <b>{String(flashback.commitment || "").slice(0, 16)}…</b></span>
              <span>MAX RETURN <b>{Number(flashbackRules?.max_return_multiplier || 3).toFixed(2)}×</b></span>
              {flashbackTableSummary(Array.isArray(flashback.payout_table) ? flashback.payout_table : []).map(([label, value]) => <span key={label}><b>{label}</b><b>{value}</b></span>)}
            </div> : <div className="fact-block"><span>COMMITMENT <b>{String(flashback.commitment || "").slice(0, 16)}…</b></span><span>STATUS <b>HISTORICAL TERMS</b></span></div>}
          </GradientPanel>
        </>}
        {flashback?.state === "ready_to_reveal" && !flashbackInCreationFlow && <>
          <GradientPanel className="compound-panel">
            <h2>Finalising your result</h2>
            <p>The reveal window has closed. TradeMemo is automatically applying the committed result.</p>
            <div className="fact-block"><span>ENTRY <b>{money(Number(flashback.allocation_usd || 0))}</b></span><span>COMMITMENT <b>{String(flashback.commitment || "").slice(0, 16)}…</b></span></div>
          </GradientPanel>
        </>}
        {flashback?.state === "revealed" && !flashbackInCreationFlow && <>
          {directionContract ? <>
            <div className="detail-stats"><GradientPanel><span>MARKET / CALL</span><strong>{flashback.market}/USD · {String(flashback.direction || "").toUpperCase()}</strong></GradientPanel><GradientPanel><span>RETURNED</span><strong>{money(Number(flashback.return_usd || 0))}</strong></GradientPanel><GradientPanel><span>NET CHANGE</span><strong className={Number(flashback.user_net_usd || 0) >= 0 ? "up" : "down"}>{money(Number(flashback.user_net_usd || 0))}</strong></GradientPanel></div>
            <GradientPanel className="compound-panel flashback-reveal"><h2>Flashback Direction settled</h2><div className="fact-block"><span>ENTRY PRICE <b>{Number(flashback.entry_price || 0).toFixed(8)}</b></span><span>SETTLEMENT PRICE <b>{Number(flashback.exit_price || 0).toFixed(8)}</b></span><span>OUTCOME <b>{flashback.close_reason === "tie_refund" ? "TIE · ENTRY RETURNED" : flashback.close_reason === "reference_unavailable_refund" ? "REFERENCE UNAVAILABLE · ENTRY RETURNED" : Number(flashback.user_net_usd || 0) > 0 ? "CORRECT" : "INCORRECT"}</b></span><span>RETURN <b>{Number(flashback.payout_multiplier || 0).toFixed(2)}×</b></span><span>REFERENCE <b>{flashback.exit_source || "KRAKEN"}</b></span><span>FEE <b>$0.00</b></span></div><button className="small-action" onClick={beginNewFlashbackSession}>Choose another contract <Plus /></button></GradientPanel>
          </> : sealedReturn ? <>
            <div className="detail-stats">
              <GradientPanel><span>OUTCOME</span><strong>{sealedEntropyRefund ? flashbackSettlement.outcome : Number(flashback.payout_multiplier || 0) === 0 ? "FULL LOSS" : `${Number(flashback.payout_multiplier || 0).toFixed(2)}×`}</strong></GradientPanel>
              <GradientPanel><span>RETURNED</span><strong>{money(Number(flashback.return_usd || 0))}</strong></GradientPanel>
              <GradientPanel><span>NET CHANGE</span><strong className={Number(flashback.user_net_usd || 0) >= 0 ? "up" : "down"}>{money(Number(flashback.user_net_usd || 0))}</strong></GradientPanel>
            </div>
            <GradientPanel className="compound-panel flashback-reveal">
              <h2>Flashback revealed</h2>
              <div className="fact-block">
                <span>ENTRY <b>{money(Number(flashback.allocation_usd || 0))}</b></span>
                <span>{sealedEntropyRefund ? "SETTLEMENT" : "RETURN"} <b>{sealedEntropyRefund ? flashbackSettlement.settlement : `${Number(flashback.payout_multiplier || 0).toFixed(2)}×`}</b></span>
                <span>FEE <b>$0.00</b></span>
                <span>ENTROPY SOURCE <b>{flashback.market || "—"}/USD · {flashback.exit_source || "—"}</b></span>
                <span>VERIFY HASH <b>{String(flashback.entropy_hash || "").slice(0, 16)}…</b></span>
                <span>COMMITMENT <b>{String(flashback.commitment || "").slice(0, 16)}…</b></span>
              </div>
              <p>{sealedEntropyRefund ? flashbackSettlement.explanation : "The revealed nonce, commitment, and external entropy hash preserve the sealed rules for this session."}</p>
              <button className="small-action" onClick={beginNewFlashbackSession}>Choose another contract <Plus /></button>
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
              <button className="small-action" onClick={beginNewFlashbackSession}>Choose another contract <Plus /></button>
            </GradientPanel>
          </>}
        </>}
        {recentFlashbackSessions.length > 0 && <GradientPanel className="compound-panel">
          <h2>Recent Directions</h2>
          <p>Read-only settlement records from this account.</p>
          <div className="flashback-history-list">
            {recentFlashbackSessions.map((session) => <button type="button" key={session.id} onClick={() => { setSelectedFlashbackId(session.id || null); setFlashbackNewSession(false); setFlashbackType(null); }}>
              <span><b>{session.market}/USD · {String(session.direction || "").toUpperCase()}</b><small>{session.close_reason === "tie_refund" ? "Tie · entry returned" : session.close_reason === "reference_unavailable_refund" ? "Reference unavailable · entry returned" : Number(session.user_net_usd || 0) > 0 ? "Correct" : "Incorrect"}</small></span>
              <strong className={Number(session.user_net_usd || 0) >= 0 ? "up" : "down"}>{money(Number(session.user_net_usd || 0))}</strong>
            </button>)}
          </div>
        </GradientPanel>}
        {flashbackReview && <AccessibleDialog label={flashbackType === "direction" ? "Review Flashback Direction" : "Review Flashback"} onClose={() => setFlashbackReview(false)} dismissible={!isActionPending(flashbackType === "direction" ? "flashback:direction:start" : "flashback:start")}>
          <h2>{flashbackType === "direction" ? "Confirm Flashback Direction?" : "Start a sealed Flashback?"}</h2>
          {flashbackType === "direction" ? <><p>TradeMemo will lock {money(flashbackAmountNumber)} on {flashbackDirectionMarket}/USD · {String(flashbackDirectionChoice || "").toUpperCase()} for 30 seconds. A correct direction returns {money(flashbackAmountNumber * currentDirectionMultiplier)} ({currentDirectionMultiplier.toFixed(2)}×); an incorrect direction loses the full entry. An exact tie returns the full entry. Settlement uses the Kraken USD midpoint. There is no performance fee.</p><div className="fact-block"><span>AVAILABLE AFTER <b>{money(Math.max(0, data.wallet.available - flashbackAmountNumber))}</b></span><span>AMOUNT AT RISK <b>{money(flashbackAmountNumber)}</b></span><span>SETTLEMENT <b>AUTOMATIC</b></span></div></> : <><p>TradeMemo will lock {money(flashbackAmountNumber)} for {Number(flashbackRules?.duration_seconds || 30)} seconds and commit the published return table before the result is sealed. Your entire entry is at risk; the highest total return is {money(flashbackAmountNumber * Number(flashbackRules?.max_return_multiplier || 3))}. There is no performance fee.</p><div className="fact-block"><span>AVAILABLE AFTER <b>{money(Math.max(0, data.wallet.available - flashbackAmountNumber))}</b></span><span>AMOUNT AT RISK <b>{money(flashbackAmountNumber)}</b></span><span>RESULT <b>SEALED</b></span></div></>}
          {!flashbackTypeAvailable && <p className="security-feedback" role="alert">{flashbackTypeUnavailableMessage}</p>}
          {!flashbackAmountWithinLimits && <p className="security-feedback" role="alert">{flashbackAmountIssue}</p>}
          {flashbackType === "sealed" && !flashbackSealedTermsAvailable && <p className="security-feedback" role="alert">Published return terms are not available for this entry amount.</p>}
          {flashbackType === "direction" && currentDirectionMultiplier <= 0 && <p className="security-feedback" role="alert">No published Direction return is available for this entry amount.</p>}
          {reviewError && <p className="security-feedback" role="alert">{reviewError}</p>}
          <button className="primary-action" disabled={isActionPending(flashbackType === "direction" ? "flashback:direction:start" : "flashback:start") || !canConfirmFlashback} aria-busy={isActionPending(flashbackType === "direction" ? "flashback:direction:start" : "flashback:start")} onClick={() => void (flashbackType === "direction" ? startFlashbackDirection() : startFlashback())}>{isActionPending(flashbackType === "direction" ? "flashback:direction:start" : "flashback:start") ? "Starting…" : flashbackType === "direction" ? "Confirm Flashback Direction" : "Start sealed Flashback"} <StateIcon name="check" /></button>
          <button className="ghost-action" disabled={isActionPending(flashbackType === "direction" ? "flashback:direction:start" : "flashback:start")} onClick={() => setFlashbackReview(false)}>Go back</button>
        </AccessibleDialog>}
      </div>
      </DeskLocalized>
    );
  if (view === "create")
    return (
      <DeskLocalized>
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
            selected={product === "memecoin"}
            onClick={() => setProduct("memecoin")}
          />
          <BotProductCard
            name="Synthetic Indices"
            description="Automated synthetic index strategy"
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
          <span>AVAILABLE TO ALLOCATE</span>
          <strong>{money(data.wallet.available)}</strong>
        </div>
        <p className="minimum-hint">
          Minimum allocation is $20.00. Your allocation cannot exceed your
          available balance.
        </p>
        <fieldset className="initial-compound-choice">
          <legend>Profit handling</legend>
          <p>Choose where net realized profit goes after high-water-mark fees. You can change this later.</p>
          <div className="initial-compound-options" role="radiogroup" aria-label="Initial profit handling" onKeyDown={handleBotChoiceKeyDown}>
            {[
              [0, "Release gains", "Net profit returns to your available balance."],
              [50, "Split gains", "Half returns to your balance; half stays in bot capital."],
              [100, "Recompound gains", "Net profit stays in the bot as capital."],
            ].map(([percent, title, description]) => (
              <button key={percent} type="button" role="radio" aria-checked={initialCompoundPercent === percent} tabIndex={initialCompoundPercent === percent ? 0 : -1} className={initialCompoundPercent === percent ? "active" : ""} onClick={() => setInitialCompoundPercent(percent as number)}>
                <strong>{percent}% · {title}</strong><small>{description}</small>
              </button>
            ))}
          </div>
        </fieldset>
        <button
          className="primary-action"
          disabled={
            Number(amount) < 20 || Number(amount) > data.wallet.available
          }
          onClick={() => { setReviewError(""); setSyntheticRiskAcknowledged(false); setReview(true); }}
        >
          Review allocation <ChevronRight />
        </button>
        {review && (
          <AccessibleDialog label="Confirm allocation" onClose={() => setReview(false)} dismissible={!isActionPending("bot:create")}>
              <span className="eyebrow">FINAL REVIEW</span>
              <h2>Confirm allocation</h2>
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
                  COMPOUNDING <b>{initialCompoundPercent}%</b>
                </span>
                {product === "memecoin" && <span>STATUS <b>AUTHORIZATION REQUIRED</b></span>}
                {product === "synthetic" && <span>AUTO EXECUTION <b>{data.environment === "mainnet" ? "ON AFTER CREATION" : "NOT AVAILABLE IN TESTNET"}</b></span>}
              </div>
              {product === "memecoin" && <p>Results use live market data and settle within this Memecoin allocation.</p>}
              {product === "synthetic" && data.environment === "mainnet" && <label className="toggle-row">
                <span>I understand Synthetic Auto will use 100% of this funded allocation as 1:1 trade margin. Price movement, spread, and tier fees can reduce my allocation; Auto may place orders without asking each time, and returns are not guaranteed.</span>
                <input type="checkbox" checked={syntheticRiskAcknowledged} disabled={isActionPending("bot:create")} onChange={(event) => setSyntheticRiskAcknowledged(event.target.checked)} />
                <i aria-hidden="true" />
              </label>}
              {product === "synthetic" && data.environment === "mainnet" && <p>Auto starts with this full allocation. Future Synthetic top-ups are also available to Auto.</p>}
              {reviewError && <p className="security-feedback" role="alert">{reviewError}</p>}
              <button
                className="primary-action"
                disabled={isActionPending("bot:create") || (product === "synthetic" && data.environment === "mainnet" && !syntheticRiskAcknowledged)}
                aria-busy={isActionPending("bot:create")}
                onClick={async () => {
                  const created = await run("/v1/bots", {
                    product,
                    amount: Number(amount),
                    compound_percent: initialCompoundPercent,
                    ...(product === "synthetic" && data.environment === "mainnet" ? { live_risk_acknowledged: syntheticRiskAcknowledged } : {}),
                  });
                  if (created) {
                    setReview(false);
                    setView("fleet");
                  }
                }}
              >
                {isActionPending("bot:create") ? `Creating ${productLabel} automation…` : "Create automation"} <Zap />
              </button>
              <button className="ghost-action" disabled={isActionPending("bot:create")} onClick={() => setReview(false)}>
                Go back
              </button>
          </AccessibleDialog>
        )}
      </div>
      </DeskLocalized>
    );
    if (view === "detail" && selected) {
      const paused = selected.state === "paused";
      const awaitingAuthorization = selected.product === "memecoin" && selected.state === "awaiting_authorization";
      const isClosing = selected.state === "closing";
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
      <DeskLocalized>
      <div className="bot-detail">
        <button className="back-action" onClick={() => setView("fleet")}>
          <StateIcon name="arrow-left" /> Fleet overview
        </button>
        <GradientPanel className="detail-hero">
          <div>
            <span className="eyebrow">{selected.name.toUpperCase()} BOT</span>
            <h2>{selected.name}</h2>
            <span className={`status-chip ${paused || awaitingAuthorization || isClosing ? "paused" : "running"}`}>
              <i />
              {isClosing ? "closing protected positions" : awaitingAuthorization ? "authorization required" : paused ? "paused" : "active"}
            </span>
          </div>
        </GradientPanel>
        <div className="detail-stats">
          <GradientPanel>
            <span>ALLOCATION</span>
            <strong>{money(selected.capital_usd)}</strong>
          </GradientPanel>
          <GradientPanel>
            <span>COMPOUNDING</span>
            <strong>{`${selected.compound_percent}%`}</strong>
          </GradientPanel>
          <GradientPanel>
            <span>HIGH-WATER MARK</span>
            <strong>{money(Number(selected.hwm_usd ?? selected.capital_usd))}</strong>
          </GradientPanel>
        </div>
        {selected.product === "memecoin" && (
          <GradientPanel className="compound-panel memecoin-market-panel">
            {!isClosing && <section className="memecoin-authorization" aria-label="Memecoin bot authorization and strategy controls">
            {awaitingAuthorization ? (
              <>
                <div className="memecoin-authorization-heading">
                  <h3>Authorize your funded Memecoin bot</h3>
                  <span className="status-chip paused"><i />Not active</span>
                </div>
                <p>Only your Memecoin allocation is at risk. Results use live market data and settle within that allocation. Trench Mode checks fresh launches only after a same-network DEX quote and liquidity review; it cannot prevent rugs, taxes, freezes, or rapid loss.</p>
                <div className="activity-row" role="status">
                  <div className="activity-info">
                    <strong>Automatic entries are off by default.</strong>
                    <small>Choose the markets and risk controls below. Turn Automatic entries on if you want the bot to open positions after authorization; otherwise, you can place manual orders separately.</small>
                  </div>
                </div>
              </>
            ) : (
              <>
                <span className="eyebrow">MEMECOIN STRATEGY CONTROLS</span>
                <p>These controls apply to future automatic entries. Existing positions keep their recorded risk limits; manual orders always require a separate review.</p>
              </>
            )}
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
            <div className="memecoin-authorization-actions">
              <button type="button" className={memecoinAutoEnabled ? "small-action active" : "small-action"} aria-label="Automatic Memecoin entries" aria-pressed={memecoinAutoEnabled} onClick={() => setMemecoinAutoEnabled((current) => !current)}>Automatic entries: {memecoinAutoEnabled ? "On" : "Off"}</button>
              <button type="button" className={includeTrench ? "small-action active" : "small-action"} aria-label="Include Trench Mode" aria-pressed={includeTrench} disabled={includeTrench && memecoinAssets.some((asset) => (memecoinAssetCategories[asset] || "microcap") === "microcap")} title={includeTrench && memecoinAssets.some((asset) => (memecoinAssetCategories[asset] || "microcap") === "microcap") ? "Remove new-launch markets before turning Trench Mode off." : undefined} onClick={() => setIncludeTrench((current) => !current)}>Include Trench Mode: {includeTrench ? "On" : "Off"}</button>
            </div>
            {awaitingAuthorization && (
              <label className="memecoin-authorization-consent">
                <input
                  type="checkbox"
                  checked={Boolean(acceptedMemecoinAuthorizations[selected.id])}
                  onChange={(event) => setAcceptedMemecoinAuthorizations((current) => ({ ...current, [selected.id]: event.target.checked }))}
                />
                <span>I have reviewed the funded Memecoin Bot Beta risks above and want to authorize this bot.</span>
              </label>
            )}
            <button
              className="primary-action"
              disabled={isActionPending(`bot:${selected.id}:authorize`) || memecoinAssets.length === 0 || (awaitingAuthorization && !acceptedMemecoinAuthorizations[selected.id])}
              aria-busy={isActionPending(`bot:${selected.id}:authorize`)}
              onClick={() => run(`/v1/bots/${selected.id}/actions`, { action: "authorize", accepted: awaitingAuthorization && Boolean(acceptedMemecoinAuthorizations[selected.id]), settings: { basket: "eligible_strategy", assets: memecoinAssets, auto_enabled: memecoinAutoEnabled, include_trench: includeTrench, cadence_seconds: savedCadence, leverage: savedLeverage } })}
            >
              {isActionPending(`bot:${selected.id}:authorize`) ? "Saving…" : awaitingAuthorization ? (memecoinAutoEnabled ? "Authorize and enable Auto" : "Authorize bot") : "Save strategy controls"} <StateIcon name="check" />
            </button>
            </section>}
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
                        : <small>{entryType === "automatic" ? "Auto exit" : "Manual exit"} · Margin {money(position.margin_usd)} · P&amp;L <b className={Number(position.realized_pnl || 0) >= 0 ? "up" : "down"}>{Number(position.realized_pnl || 0) >= 0 ? "+" : ""}{money(Number(position.realized_pnl || 0))}</b>{position.close_reason ? ` · ${formatSettlementExitReason(position.close_reason, Number(position.realized_pnl || 0))}` : ""}</small>}
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
              {selected.state === "running" && (
                <button
                  className="small-action"
                  disabled={isActionPending(`memecoin-order:${selected.id}`)}
                  onClick={() => setMemecoinOrder({
                    direction: "long",
                    amount: "20",
                    idempotencyKey: createMemecoinOrderIdempotencyKey(data.user.id, selected.id),
                  })}
                >
                  Review manual order <ChevronRight />
                </button>
              )}
            </GradientPanel>
          )}
          {!isClosing && (
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
          <div className="detail-actions">
            {!isClosing && <>
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
          {!isClosing && <button
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
            {!isClosing && <button
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
              <div className="amount-input">
                <span>$</span>
                <input value={memecoinOrder.amount} onChange={(event) => setMemecoinOrder((current) => current ? { ...current, amount: event.target.value.replace(/[^0-9.]/g, "") } : current)} inputMode="decimal" aria-label="Memecoin order margin" />
              </div>
              <div className="fact-block">
                <span>MARKET <b>{memecoinMarketLabel(memecoinMarket)}</b></span>
                <span>LEVERAGE <b>{savedLeverage}×</b></span>
                <span>CADENCE <b>{manualCadence === 60 ? "1 MINUTE" : manualCadence === 300 ? "5 MINUTES" : "15 MINUTES"}</b></span>
                <span>FUNDING <b>WALLET ALLOCATION</b></span>
              </div>
              {reviewError && <p className="security-feedback" role="alert">{reviewError}</p>}
              <button
                className="primary-action"
                disabled={isActionPending(`memecoin-order:${selected.id}`) || Number(memecoinOrder.amount) <= 0}
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
                    funding_source: "wallet",
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
              <p>Only markets currently passing TradeMemo eligibility checks appear here. A selected market is checked again for a fresh price, liquidity, and risk limits before any order opens.</p>
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
              {basketPickerError && <div role="status"><button type="button" className="small-action" onClick={() => void openBasketPicker()}>Reload markets</button></div>}
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
        </DeskLocalized>
    );
  }
  const deployedCapital = displayBots.reduce((sum, bot) => sum + bot.capital_usd, 0);
  return (
    <DeskLocalized>
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
        </div>
      </div>
      {displayBots.length ? (
        <div className="fleet-bot-grid">
          {displayBots.map((bot) => {
            const status = bot.state.replace(/_/g, " ");
            const statusTone = bot.state === "running" ? "running" : "paused";
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
              : latestMemecoinEngine
                ? Number(latestMemecoinEngine.net_realized || 0) - Number(latestMemecoinEngine.fee_usd || 0)
                : Number(latestMemecoinSettlement?.realized_pnl ?? 0);
            const recentMemecoinRuns = data.engine.filter((run) => Number(run.bot_id) === Number(bot.id));
            const settledPnl = isSynthetic
              ? realizedSynthetic
              : recentMemecoinRuns.length
                ? recentMemecoinRuns.reduce((total, run) => total + Number(run.net_realized || 0) - Number(run.fee_usd || 0), 0)
                : latestSettlementPnl;
            const hasSettledPnl = isSynthetic
              ? Boolean(latestSyntheticSettlement)
              : recentMemecoinRuns.length > 0 || Boolean(latestMemecoinSettlement);
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
                  <span className="eyebrow">ALLOCATION</span>
                  <strong className="fleet-amount">
                    {money(bot.capital_usd)}
                  </strong>
                </div>
              </div>
              <div className="fleet-metrics">
                <div>
                  <span>{isSynthetic ? "EXECUTION" : "COMPOUND"}</span>
                  <strong>{isSynthetic ? `Auto ${syntheticExecution === "AUTO" ? "on" : "off"}` : `${bot.compound_percent}%`}</strong>
                </div>
                <div>
                  <span>{isSynthetic ? "ACTIVE AUTO ORDER" : "LATEST SETTLEMENT"}</span>
                  <strong className={isSynthetic ? (autoPosition ? "up" : "down") : statusTone === "running" ? "up" : "down"}>
                    {isSynthetic ? autoPosition ? `${autoPosition.market} · ${String(autoPosition.direction || "").toUpperCase()} · ${money(Number(autoPosition.margin_usd || 0))}` : "No Auto order open" : latestSettlement ? `${settlementMarket} · ${String(settlementDirection || "").toUpperCase()} · ${latestSettlementPnl >= 0 ? "+" : "−"}${money(Math.abs(latestSettlementPnl))}` : "No settled positions"}
                  </strong>
                </div>
                <div>
                  <span>{isSynthetic ? "LATEST SETTLEMENT" : "RECENT CUSTOMER NET"}</span>
                  <strong className={latestSettlement ? (latestSettlementPnl >= 0 ? "up" : "down") : hasSettledPnl && settledPnl < 0 ? "down" : "up"}>
                    {isSynthetic ? latestSettlement ? `${settlementMarket} · ${String(settlementDirection || "").toUpperCase()} · ${latestSettlementPnl >= 0 ? "+" : "−"}${money(Math.abs(latestSettlementPnl))}` : "No settled positions" : hasSettledPnl ? `${settledPnl >= 0 ? "+" : "−"}${money(Math.abs(settledPnl))}` : "No settled positions"}
                  </strong>
                  {latestSettlement && <small>{formatSettlementExitReason(settlementReason, latestSettlementPnl)}</small>}
                </div>
              </div>
              <div className="fleet-bot-actions">
                <span className="compound-chip">
                  {isSynthetic ? hasSettledPnl ? `${settledPnl >= 0 ? "ALL SETTLED P&L +" : "ALL SETTLED P&L −"}${money(Math.abs(settledPnl))}` : "NO SETTLED POSITIONS" : `COMPOUND ${bot.compound_percent}%`}
                </span>
                {bot.state === "awaiting_authorization" && <span className="memecoin-fleet-prompt">Funded, but not active. Review setup to start the bot.</span>}
                <button
                  className={bot.state === "awaiting_authorization" ? "primary-action" : "small-action"}
                  onClick={() => {
                    setSelectedId(bot.id);
                    setView("detail");
                  }}
                >
                  {bot.state === "awaiting_authorization" ? "Review setup" : "Open detail"} <ChevronRight />
                </button>
              </div>
            </GradientPanel>
            );
          })}
        </div>
      ) : (
        <>
          <EmptyBots onLaunch={() => setView("create")} />
        </>
      )}
      {displayBots.some((bot) => bot.state === "paused") && (
        <GradientPanel className="bot-card">
          <img
            src="/illustrations/engine-paused.png"
            alt="Paused automation"
            className="illustration-engine-paused"
            decoding="async"
          />
          <div>
            <span className="eyebrow">BOT PAUSED</span>
            <h2>One or more bots are paused</h2>
            <p>
              Paused bots keep their allocation but do not open new positions
              until you resume them.
            </p>
          </div>
        </GradientPanel>
      )}
    </div>
    </DeskLocalized>
  );
}
