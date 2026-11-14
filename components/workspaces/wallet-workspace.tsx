"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AccessibleDialog } from "../accessible-dialog";
import { useDeskSelector, type DeskStore } from "../../lib/desk-store";
import type { DeskState } from "../../lib/desk-types";
import { translateDeskPhrase } from "../../lib/desk-i18n";
import { useDeskLanguage } from "../desk-language";
import { useResourcePoller } from "./use-resource-poller";
import {
  activityAmountDisplay,
  activityLabel,
  activityTone,
  ChevronRight,
  Download,
  GradientPanel,
  History,
  isFlashbackEntryLock,
  isNonFinancialActivity,
  money,
  PaymentMark,
  Send,
  ShieldCheck,
  signedActivityAmount,
  StateIcon,
  StateSwapIcon,
  StepRail,
  type LiveDashboard,
  Zap,
} from "../tradepulse-shell";

type DepositRouteOption = {
  asset: string;
  chain: string;
  network: string;
  confirmations: number;
  available: boolean;
};

const depositStatusLabel = (
  t: (phrase: string) => string,
  status: string,
) => {
  const labels: Record<string, string> = {
    watching: "Monitoring",
    pending: "Pending",
    confirming: "Confirming deposit",
    pending_dust: "Below minimum",
    confirmed_pending_sweep: "Processing deposit",
    sweeping: "Processing deposit",
    sweep_confirming: "Processing deposit",
    processing: "Processing deposit",
    failed_manual_review: "Under review",
    under_review: "Under review",
    credited_and_closed: "Credited",
    failed: "Failed",
    expired: "Expired",
  };
  const normalized = status.toLowerCase();
  return t(labels[normalized] || normalized.replaceAll("_", " "));
};

const depositAssetNames: Record<string, string> = {
  USDT: "Tether USD",
  USDC: "USD Coin",
  ETH: "Ether",
  BNB: "BNB",
  MATIC: "Polygon",
  SOL: "Solana",
};

const depositNetworkNames: Record<string, string> = {
  ERC20: "Ethereum",
  BEP20: "BNB Chain",
  BASE: "Base",
  ARBITRUM: "Arbitrum",
  POLYGON: "Polygon",
  SPL: "Solana",
  TON: "TON",
  ETH_SEPOLIA: "Ethereum Sepolia",
  BNB_TESTNET: "BNB Smart Chain Testnet",
  BASE_SEPOLIA: "Base Sepolia",
  ARB_SEPOLIA: "Arbitrum Sepolia",
  POLYGON_AMOY: "Polygon Amoy",
  SOL_DEVNET: "Solana Devnet",
};

const terminalDepositStatuses = new Set([
  "credited_and_closed",
  "quarantined",
  "failed_manual_review",
  "failed",
  "expired",
]);

export function WalletWorkspace({
  store,
  poll,
  request,
  environment,
  onWalletUpdate,
  onNotice,
  initialView = "overview",
}: {
  store: DeskStore;
  poll: () => Promise<LiveDashboard>;
  request: (path: string, options?: RequestInit, environment?: "mainnet" | "testnet") => Promise<any>;
  environment: "mainnet" | "testnet";
  onWalletUpdate: (update: {
    wallet?: Partial<LiveDashboard["wallet"]>;
    withdrawal?: LiveDashboard["withdrawals"][number];
    deposits?: LiveDashboard["deposits"];
  }) => void;
  onNotice: (message: string) => void;
  initialView?: "overview" | "deposit" | "withdraw" | "history" | "activity" | "gas";
}) {
  const data = useDeskSelector(
    store,
    (state: DeskState) => state.resources.dashboard as LiveDashboard | null,
  );
  useResourcePoller(
    async () => poll(),
    (next) => store.applyResource("dashboard", next, Date.now()),
    15_000,
    true,
  );
  if (!data) return null;
  return (
    <WalletWorkspaceBody
      data={data}
      request={request}
      environment={environment}
      onWalletUpdate={onWalletUpdate}
      onNotice={onNotice}
      initialView={initialView}
    />
  );
}

function WalletWorkspaceBody({
  data,
  request,
  environment,
  onWalletUpdate,
  onNotice,
  initialView = "overview",
}: {
  data: LiveDashboard;
  request: (path: string, options?: RequestInit, environment?: "mainnet" | "testnet") => Promise<any>;
  environment: "mainnet" | "testnet";
  onWalletUpdate: (update: {
    wallet?: Partial<LiveDashboard["wallet"]>;
    withdrawal?: LiveDashboard["withdrawals"][number];
    deposits?: LiveDashboard["deposits"];
  }) => void;
  onNotice: (message: string) => void;
  initialView?: "overview" | "deposit" | "withdraw" | "history" | "activity" | "gas";
}) {
  const language = useDeskLanguage();
  const t = useCallback(
    (phrase: string, replacements?: Record<string, string | number>) =>
      translateDeskPhrase(language, phrase, replacements),
    [language],
  );
  const [view, setView] = useState<
    "overview" | "deposit" | "withdraw" | "history" | "activity" | "gas"
  >("overview");
  useEffect(() => {
    setView(initialView);
  }, [initialView]);
  const [step, setStep] = useState(0);
  const [asset, setAsset] = useState("");
  const [chain, setChain] = useState("");
  const [expectedAmount, setExpectedAmount] = useState("");
  const [depositRoutes, setDepositRoutes] = useState<DepositRouteOption[]>([]);
  const [depositRoutesLoading, setDepositRoutesLoading] = useState(false);
  const [depositRoutesError, setDepositRoutesError] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [intent, setIntent] = useState<
    LiveDashboard["deposits"][number] | null
  >(null);
  const [depositPending, setDepositPending] = useState(false);
  const [withdrawAsset, setWithdrawAsset] = useState("USDT");
  const [withdrawChain, setWithdrawChain] = useState("ERC20");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawCode, setWithdrawCode] = useState("");
  const [reviewWithdrawal, setReviewWithdrawal] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState("");
  const [submittedWithdrawal, setSubmittedWithdrawal] = useState<{
    asset: string;
    chain: string;
    amount: number;
  } | null>(null);
  const [balancesVisible, setBalancesVisible] = useState(true);
  const [walletPending, setWalletPending] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<
    "all" | "deposit" | "withdraw" | "bot"
  >("all");
  const requestRef = useRef(request);
  const walletUpdateRef = useRef(onWalletUpdate);
  useEffect(() => {
    requestRef.current = request;
    walletUpdateRef.current = onWalletUpdate;
  }, [request, onWalletUpdate]);
  useEffect(() => {
    if (!intent || terminalDepositStatuses.has(intent.status.toLowerCase())) {
      setQrDataUrl("");
      return;
    }
    let cancelled = false;
    void request(`/v1/deposits/${intent.id}/qr`, {}, environment)
      .then((result) => {
        if (!cancelled) setQrDataUrl(String(result.data_url || ""));
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [environment, intent?.id, request]);
  useEffect(() => {
    const trackedStatuses = new Set([
      "watching",
      "confirming",
      "pending_dust",
      "under_review",
      "processing",
      "confirmed_pending_sweep",
      "sweeping",
      "sweep_confirming",
    ]);
    if (!intent?.watch_enabled || !trackedStatuses.has(intent.status.toLowerCase())) return;
    let cancelled = false;
    const refreshDepositStatus = () => {
      void requestRef.current("/v1/dashboard", {}, environment)
        .then((snapshot: LiveDashboard) => {
          const updatedIntent = snapshot.deposits.find((row) => row.id === intent.id);
          if (cancelled || !updatedIntent) return;
          setIntent(updatedIntent);
          walletUpdateRef.current({
            wallet: snapshot.wallet,
            deposits: snapshot.deposits,
          });
        })
        .catch(() => undefined);
    };
    refreshDepositStatus();
    const timer = window.setInterval(refreshDepositStatus, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [environment, intent?.id, intent?.status, intent?.watch_enabled]);
  const withdrawNetworks = [
    ["ERC20", "Ethereum"],
    ["BEP20", "BNB Chain"],
    ["BASE", "Base"],
    ["ARBITRUM", "Arbitrum"],
    ["POLYGON", "Polygon"],
    ["SPL", "Solana"],
  ];
  const loadDepositRoutes = useCallback(async () => {
    setDepositRoutesLoading(true);
    setDepositRoutesError("");
    try {
      const result = await request("/v1/deposits/routes", {}, environment);
      if (
        result.environment !== environment ||
        !Array.isArray(result.routes) ||
        result.routes.some(
          (route: DepositRouteOption) =>
            !route ||
            typeof route.asset !== "string" ||
            typeof route.chain !== "string" ||
            typeof route.network !== "string" ||
            typeof route.confirmations !== "number" ||
            typeof route.available !== "boolean",
        )
      ) {
        throw new Error(t("Deposit network options did not match {environment}. Try again.", { environment }));
      }
      setDepositRoutes(result.routes);
    } catch (error) {
      setDepositRoutes([]);
      setDepositRoutesError(
        error instanceof Error ? error.message : t("Deposit network options could not be loaded. Try again."),
      );
    } finally {
      setDepositRoutesLoading(false);
    }
  }, [environment, request, t]);
  useEffect(() => {
    if (view !== "deposit") return;
    setAsset("");
    setChain("");
    setExpectedAmount("");
    setIntent(null);
    setStep(0);
    void loadDepositRoutes();
  }, [environment, loadDepositRoutes, view]);
  const listedDepositAssets = [...new Set(depositRoutes.map((route) => route.asset))];
  const preferredDepositAssets =
    environment === "testnet"
      ? ["ETH", "BNB", "SOL", "MATIC"]
      : ["USDT", "USDC"];
  const depositAssets = [
    ...preferredDepositAssets.filter((item) => listedDepositAssets.includes(item)),
    ...listedDepositAssets.filter((item) => !preferredDepositAssets.includes(item)),
  ];
  const depositNetworks = depositRoutes.filter((route) => route.asset === asset);
  const activeDeposits = data.deposits.filter(
    (route) => !terminalDepositStatuses.has(route.status.toLowerCase()),
  );
  const depositClosed = intent?.status.toLowerCase() === "credited_and_closed";
  const depositNetworkName = (network: string) => {
    const name =
      depositRoutes.find((route) => route.chain === network)?.network ||
      depositNetworkNames[network] ||
      network;
    return t(name);
  };
  const showOverview = () => {
    setView("overview");
    setStep(0);
    setIntent(null);
    setDepositPending(false);
    setReviewWithdrawal(false);
    setSubmittedWithdrawal(null);
  };
  const isEvmAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value);
  const isSolanaAddress = (value: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
  const isWithdrawalAddress = (value: string) =>
    withdrawChain === "SPL" ? isSolanaAddress(value) : isEvmAddress(value);
  const filteredLedger = data.ledger.filter((entry) => {
    if (historyFilter === "all") return true;
    const kind = entry.kind.toLowerCase();
    if (historyFilter === "deposit") return kind.includes("deposit");
    if (historyFilter === "withdraw") return kind.includes("withdraw");
    return (
      kind.includes("bot") || kind.includes("trade") || kind.includes("engine")
    );
  });
  const createRoute = async () => {
    if (depositPending || !asset || !chain) return;
    const selectedRoute = depositRoutes.find(
      (route) => route.asset === asset && route.chain === chain,
    );
    if (!selectedRoute?.available) {
      onNotice(
        selectedRoute
          ? t("{network} is under maintenance. Choose another network or retry the options later.", { network: selectedRoute.network })
          : t("That {environment} deposit route is no longer available. Reload the network options and choose another route.", { environment }),
      );
      await loadDepositRoutes();
      setStep(1);
      return;
    }
    setDepositPending(true);
    try {
      const result = await request("/v1/deposits/routes", {
        method: "POST",
        body: JSON.stringify({
          asset,
          chain,
          expected_amount: expectedAmount || null,
        }),
      }, environment);
      setIntent(result.intent);
      setStep(2);
      onNotice(
        t("Deposit address created. Send only the selected asset on the selected network."),
      );
    } catch (error) {
      onNotice(
        error instanceof Error
          ? error.message
          : t("A deposit address could not be created. Choose another network or try again."),
      );
    } finally {
      setDepositPending(false);
    }
  };
  const submitWithdrawal = async () => {
    if (walletPending) return;
    setWithdrawalError("");
    setWalletPending(true);
    try {
      const result = await request("/v1/withdrawals", {
        method: "POST",
        body: JSON.stringify({
          asset: withdrawAsset,
          chain: withdrawChain,
          address: withdrawAddress,
          amount: Number(withdrawAmount),
          security_code: withdrawCode,
        }),
      });
      onWalletUpdate({
        wallet: result.wallet || {
          available: Math.max(0, data.wallet.available - Number(withdrawAmount)),
          locked: data.wallet.locked + Number(withdrawAmount),
        },
        withdrawal: result.withdrawal || {
          id: String(result.withdrawal_id || `pending-${Date.now()}`),
          asset: withdrawAsset,
          chain: withdrawChain,
          address: withdrawAddress,
          amount_usd: Number(withdrawAmount),
          status: "pending_admin_release",
        },
      });
      onNotice(
        t("Withdrawal {id} is queued for review.", {
          id: String(result.withdrawal_id || "request").slice(0, 8),
        }),
      );
      setSubmittedWithdrawal({
        asset: withdrawAsset,
        chain: withdrawChain,
        amount: Number(withdrawAmount),
      });
      setWithdrawAddress("");
      setWithdrawAmount("");
      setWithdrawCode("");
      setReviewWithdrawal(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("The withdrawal request could not be created. Check the details and try again.");
      setWithdrawalError(message);
      onNotice(message);
    } finally {
      setWalletPending(false);
    }
  };
  if (view === "deposit")
    return (
      <div className="wallet-flow">
        <button className="back-action" onClick={showOverview}>
          <StateIcon name="arrow-left" /> {t("Wallet overview")}
        </button>
        <StepRail current={step} />
        <GradientPanel className="flow-card">
          <div className="flow-title">
            <div>
              <span className="eyebrow">{t("DEPOSIT / ONE-TIME ADDRESS")}</span>
              <h2>
                {step === 0
                  ? t("Choose an asset")
                  : step === 1
                    ? t("Choose a network")
                    : t("Send {asset} to TradePulse", { asset })}
              </h2>
            </div>
            <span className="secure-chip">
              <StateIcon name="lock" /> {t("PROTECTED")}
            </span>
          </div>
          {step === 0 && (
            <div className="choice-grid">
              {depositRoutesLoading && <p role="status">{t("Loading {environment} deposit assets…", { environment })}</p>}
              {depositRoutesError && (
                <div role="alert">
                  <p>{depositRoutesError}</p>
                  <button type="button" className="small-action" onClick={() => void loadDepositRoutes()}>
                    {t("Retry network options")}
                  </button>
                </div>
              )}
              {!depositRoutesLoading && !depositRoutesError && depositAssets.length === 0 && (
                <p role="status">{t("No deposit routes are currently available in {environment}.", { environment })}</p>
              )}
              {!depositRoutesLoading && !depositRoutesError && depositAssets.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={asset === item ? "selected" : ""}
                  onClick={() => {
                    setAsset(item);
                    setChain("");
                    setStep(1);
                  }}
                >
                  <PaymentMark asset={item} />
                  <strong>{item}</strong>
                  <small>{depositAssetNames[item] || item}</small>
                  <ChevronRight />
                </button>
              ))}
            </div>
          )}
          {step === 1 && (
            <>
              <div className="choice-grid">
                {depositNetworks.map((route) => (
                  <button
                    type="button"
                    key={`${route.asset}:${route.chain}`}
                    className={chain === route.chain ? "selected" : ""}
                    disabled={!route.available}
                    onClick={() => {
                      setChain(route.chain);
                      setIntent(null);
                      setStep(2);
                    }}
                  >
                    <PaymentMark asset={route.chain} />
                    <strong>{route.network}</strong>
                    <small>
                      {route.available
                        ? t("{confirmations} confirmations · {asset} only", {
                            confirmations: route.confirmations,
                            asset: route.asset,
                          })
                        : t("Temporarily unavailable · {asset} only", { asset: route.asset })}
                    </small>
                    <ChevronRight />
                  </button>
                ))}
                {depositNetworks.length === 0 && (
                  <p role="status">{t("No {asset} deposit networks are currently available in {environment}.", { asset, environment })}</p>
                )}
              </div>
            </>
          )}
          {step === 2 && !intent && (
            <>
              <div className="minimum-warning">
                <span>✓</span>
                <div>
                  <strong>
                    {asset} on {depositNetworkName(chain)}
                  </strong>
                  <p>{t("Use this network only for the deposit address shown next.")}</p>
                  <button type="button" className="small-action" onClick={() => setStep(1)}>
                    {t("Change network")}
                  </button>
                </div>
              </div>
              <label className="amount-field">
                <span>{t("EXPECTED AMOUNT / OPTIONAL")}</span>
                <input
                  value={expectedAmount}
                  onChange={(event) => setExpectedAmount(event.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </label>
              <button
                type="button"
                className="primary-action"
                disabled={depositPending || !asset || !chain}
                onClick={createRoute}
              >
                {depositPending ? t("Preparing address…") : t("Create deposit address")}{" "}
                {!depositPending && <ChevronRight />}
              </button>
            </>
          )}
          {step === 2 && intent && (
            <>
              {intent.status.toLowerCase() === "credited_and_closed" && (
                <div className="success-state">
                  <img
                    src="/illustrations/deposit-credited.png"
                    alt="Deposit credited into TradePulse"
                    className="deposit-credited-art"
                    decoding="async"
                  />
                  <strong>{t("Deposit credited")}</strong>
                  <small>{t("Your verified transfer is now in your available wallet balance.")}</small>
                </div>
              )}
              {!depositClosed && (
                <>
              {intent.status.toLowerCase() === "pending_dust" && (
                <div className="below-minimum-card">
                  <img
                    src="/illustrations/below-minimum.png"
                    alt="Deposit below the required minimum"
                    className="below-minimum-art"
                    decoding="async"
                  />
                  <div>
                    <strong>{t("Deposit below minimum")}</strong>
                    <small>{t("Send the remaining amount to this same address on the same network.")}</small>
                  </div>
                </div>
              )}
              <div className="qr-placeholder">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Scan ${intent.asset} deposit address`}
                    width={128}
                    height={128}
                  />
                ) : (
                  <div className="qr-grid" />
                )}
                <small>
                  {t("SCAN TO DEPOSIT {asset} ON {network}", {
                    asset: intent.asset,
                    network: depositNetworkName(intent.chain),
                  })}
                </small>
              </div>
              <div className="copy-field">
                <code>{intent.address}</code>
                <button
                  aria-label={t("Copy deposit address")}
                  onClick={async () => {
                    await navigator.clipboard?.writeText(intent.address);
                    setCopiedAddress(true);
                    window.setTimeout(() => setCopiedAddress(false), 1200);
                  }}
                >
                  <StateSwapIcon
                    name={copiedAddress ? "check" : "copy"}
                    swapKey={copiedAddress ? "address-copied" : "address-copy"}
                  />
                </button>
              </div>
              <div className="warning-block">
                <strong>
                  <PaymentMark asset={intent.asset} compact />{" "}
                  {t("Send {asset} on {network} only", {
                    asset: intent.asset,
                    network: depositNetworkName(intent.chain),
                  })}
                </strong>
                <span>
                  {t("This is a one-time deposit address. Another asset or network cannot be credited automatically.")}
                </span>
              </div>
              <button
                className="primary-action"
                disabled={depositPending}
                aria-busy={depositPending}
                onClick={async () => {
                  if (depositPending) return;
                  setDepositPending(true);
                  try {
                    const result = await request(
                      `/v1/deposits/${intent.id}/watch`,
                      { method: "POST", body: "{}" },
                      environment,
                    );
                    setIntent((current) =>
                      current
                        ? {
                            ...current,
                            status: String(result.status || current.status),
                            watch_enabled: Boolean(result.watch_enabled),
                          }
                        : current,
                    );
                    if (result.status === "pending_dust") {
                      onNotice(
                        t("Deposit detected below the minimum. Send the remaining amount to this same address on the same network."),
                      );
                    } else if (result.checked_now && result.status !== "watching") {
                      onNotice(
                        t("Deposit detected. Confirmation is in progress; credit follows after the required on-chain confirmations."),
                      );
                    } else if (result.checked_now) {
                      onNotice(
                        t("No transfer was detected yet. Monitoring remains active for this same address."),
                      );
                    } else {
                      onNotice(
                        t("Monitoring remains active. The network check will continue automatically for this same address."),
                      );
                    }
                  } catch (error) {
                    onNotice(
                      error instanceof DOMException && error.name === "AbortError"
                        ? t("Monitoring could not be confirmed. Your address is unchanged. Retry monitoring from My Deposits; do not send another transfer.")
                        : error instanceof Error
                          ? error.message
                          : t("Deposit tracking could not start. Try again."),
                    );
                  } finally {
                    setDepositPending(false);
                  }
                }}
              >
                {depositPending
                  ? t("Checking deposit…")
                  : intent.watch_enabled
                    ? t("Check deposit now")
                    : t("I made this deposit")} <ChevronRight />
              </button>
              <div className="timeline">
                <span className="eyebrow">{t("DEPOSIT STATUS")}</span>
                {["Detected", "Verified", "Credited"].map((label, index) => {
                  const status = intent.status.toLowerCase();
                  const complete =
                    index === 0
                      ? !["watching", "pending"].includes(status)
                      : index === 1
                        ? [
                            "confirmed_pending_sweep",
                            "sweeping",
                            "sweep_confirming",
                            "processing",
                            "credited_and_closed",
                          ].includes(status)
                        : status === "credited_and_closed";
                  return (
                    <div className="timeline-row" key={label}>
                      <i className={complete ? "active" : ""}>
                        {complete ? "✓" : index + 1}
                      </i>
                      <div>
                        <strong>{t(label)}</strong>
                        <small>
                          {index === 0
                              ? t("Waiting to detect your transfer to this address.")
                            : index === 1
                                ? t("On-chain confirmation is required before a balance credit.")
                                : t("Your available balance updates after the deposit is confirmed.")}
                        </small>
                      </div>
                      <span
                        className={`status-chip ${complete ? "running" : "review"}`}
                      >
                        {t(complete ? "complete" : "pending")}
                      </span>
                    </div>
                  );
                })}
              </div>
                </>
              )}
            </>
          )}
        </GradientPanel>
        {activeDeposits.length > 0 && (
          <GradientPanel className="ledger-card">
            <span className="eyebrow">{t("MY DEPOSITS")}</span>
            {activeDeposits.map((route) => (
              <div className="ledger-row" key={route.id}>
                <div>
                  <strong>
                    <PaymentMark asset={route.asset} compact /> {route.asset} /{" "}
                    {depositNetworkName(route.chain)}
                  </strong>
                  <small>
                    <PaymentMark asset={route.asset} compact />{" "}
                    {depositNetworkName(route.chain)} · {route.address}
                  </small>
                </div>
                <span
                  className={`activity-status ${route.status.includes("fail") ? "review" : "complete"}`}
                >
                  {depositStatusLabel(t, route.status)}
                </span>
                <button
                  className="small-action"
                  onClick={() => {
                    setIntent(route);
                    setAsset(route.asset);
                    setChain(route.chain);
                    setStep(2);
                  }}
                >
                  {t("Open")}
                </button>
              </div>
            ))}
          </GradientPanel>
        )}
      </div>
    );
  if (view === "withdraw" && submittedWithdrawal)
    return (
      <div className="wallet-flow">
        <button className="back-action" onClick={showOverview}>
          <StateIcon name="arrow-left" /> {t("Wallet overview")}
        </button>
        <StepRail current={2} />
        <GradientPanel className="flow-card">
          <div className="success-state">
            <img
              src="/illustrations/withdrawal-sent.png"
              alt={t("Withdrawal queued")}
              className="withdrawal-sent-art"
              decoding="async"
            />
            <strong>{t("Withdrawal queued")}</strong>
            <small>
              {t("{amount} {asset} on {network} is reserved for review.", {
                amount: money(submittedWithdrawal.amount),
                asset: submittedWithdrawal.asset,
                network: submittedWithdrawal.chain,
              })}
            </small>
          </div>
          <button className="primary-action" onClick={showOverview}>
            {t("Back to wallet")} <ChevronRight />
          </button>
          <button className="ghost-action" onClick={() => setView("history")}>
            {t("View withdrawal history")}
          </button>
        </GradientPanel>
      </div>
    );
  if (view === "withdraw")
    return (
      <div className="wallet-flow">
        <button className="back-action" onClick={showOverview}>
          <StateIcon name="arrow-left" /> {t("Wallet overview")}
        </button>
        <StepRail current={2} />
        <GradientPanel className="flow-card">
          <div className="flow-title">
            <div>
              <span className="eyebrow">{t("WITHDRAW")}</span>
              <h2>{t("Send funds safely")}</h2>
            </div>
            <span className="secure-chip">
              <ShieldCheck /> {t("SECURE")}
            </span>
          </div>
          <div className="withdrawable-summary">
            <div>
              <span>{t("Withdrawable now")}</span>
              <strong>{money(data.wallet.available)}</strong>
            </div>
            <div>
              <span>{t("Locked in bots")}</span>
              <strong>{money(data.wallet.locked)}</strong>
            </div>
            <small>
              {t("Only available wallet balance can be withdrawn. Check every destination character before continuing.")}
            </small>
          </div>
          <label className="amount-field">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <PaymentMark asset={withdrawAsset} compact />{" "}
              {t("ASSET · {asset}", { asset: withdrawAsset })}
            </span>
            <select
              value={withdrawAsset}
              onChange={(event) => setWithdrawAsset(event.target.value)}
            >
              <option>USDT</option>
              <option>USDC</option>
            </select>
          </label>
          <label className="amount-field">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <PaymentMark asset={withdrawChain} compact />{" "}
              {t("NETWORK · {network}", {
                network: withdrawNetworks.find(([value]) => value === withdrawChain)?.[1] || withdrawChain,
              })}
            </span>
            <select
              value={withdrawChain}
              onChange={(event) => setWithdrawChain(event.target.value)}
            >
              {withdrawNetworks.map(([value, label]) => (
                <option value={value} key={value}>
                  {t(label)}
                </option>
              ))}
            </select>
          </label>
          <label className="amount-field">
            <span>{t("DESTINATION ADDRESS")}</span>
            <input
              value={withdrawAddress}
              onChange={(event) =>
                setWithdrawAddress(event.target.value.replace(/\s/g, ""))
              }
              placeholder={t("Paste the full destination address")}
              autoComplete="off"
            />
          </label>
          {data.whitelist.filter((route) => route.chain === withdrawChain)
            .length > 0 && (
            <div className="saved-destinations">
              <span className="field-caption">{t("SAVED DESTINATIONS")}</span>
              {data.whitelist
                .filter((route) => route.chain === withdrawChain)
                .map((route) => {
                  const cooling =
                    Number(route.cooling_until || 0) * 1000 > Date.now();
                  return (
                    <button
                      type="button"
                      className="saved-destination"
                      key={route.id}
                      disabled={cooling}
                      onClick={() => setWithdrawAddress(route.address)}
                    >
                      <span>{route.nickname}</span>
                      <small>
                        {route.address.slice(0, 8)}…{route.address.slice(-6)}{" "}
                        {cooling ? `· ${t("cooling")}` : ""}
                      </small>
                      <ChevronRight />
                    </button>
                  );
                })}
            </div>
          )}
          <label className="amount-field">
            <span>{t("AMOUNT / USD")}</span>
            <input
              value={withdrawAmount}
              onChange={(event) =>
                setWithdrawAmount(event.target.value.replace(/[^0-9.]/g, ""))
              }
              inputMode="decimal"
              placeholder="0.00"
            />
          </label>
          <label className="amount-field">
            <span>{t("SIX-DIGIT SECURITY CODE")}</span>
            <input
              type="password"
              value={withdrawCode}
              onChange={(event) =>
                setWithdrawCode(
                  event.target.value.replace(/\D/g, "").slice(0, 6),
                )
              }
              inputMode="numeric"
              placeholder="••••••"
            />
          </label>
          <button
            className="primary-action"
            disabled={
              walletPending ||
              !withdrawAddress ||
              !isWithdrawalAddress(withdrawAddress) ||
              Number(withdrawAmount) <= 0 ||
              Number(withdrawAmount) > data.wallet.available ||
              withdrawCode.length !== 6
            }
            onClick={() => { setWithdrawalError(""); setReviewWithdrawal(true); }}
          >
            {t("Review withdrawal")} <ChevronRight />
          </button>
        </GradientPanel>
        {reviewWithdrawal && (
          <AccessibleDialog label={t("Verify before sending")} onClose={() => setReviewWithdrawal(false)} dismissible={!walletPending}>
                <span className="eyebrow">{t("WITHDRAWAL REVIEW")}</span>
                <h2>{t("Verify before sending")}</h2>
              <div className="mono-review">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <PaymentMark asset={withdrawAsset} compact />
                  <PaymentMark asset={withdrawChain} compact />
                  {withdrawAsset} / {withdrawChain}
                </span>
                <code>{withdrawAddress}</code>
                <span>{t("AMOUNT / {amount}", { amount: money(Number(withdrawAmount)) })}</span>
              </div>
              <p>
                {t("Withdrawal requests are reviewed before release. Confirm only when the address and network are correct.")}
              </p>
              {withdrawalError && <p className="security-feedback" role="alert">{withdrawalError}</p>}
              <button className="primary-action" disabled={walletPending} aria-busy={walletPending} onClick={submitWithdrawal}>
                {walletPending ? t("Submitting…") : t("Confirm withdrawal")} <Send />
              </button>
              <button
                className="ghost-action"
                disabled={walletPending}
                onClick={() => setReviewWithdrawal(false)}
              >
                {t("Go back")}
              </button>
          </AccessibleDialog>
        )}
      </div>
    );
  if (view === "history")
    return (
      <div className="ledger-screen">
        <button className="back-action" onClick={showOverview}>
          <StateIcon name="arrow-left" /> {t("Wallet overview")}
        </button>
        <div className="ledger-header">
          <div>
            <span className="eyebrow">{t("WALLET / HISTORY")}</span>
            <h2>{t("Transaction history")}</h2>
          </div>
        </div>
        <div className="filter-chips">
          {(["all", "deposit", "withdraw", "bot"] as const).map((filter) => (
            <button
              key={filter}
              className={historyFilter === filter ? "active" : ""}
              onClick={() => setHistoryFilter(filter)}
            >
              {filter === "all"
                ? t("All")
                : filter === "deposit"
                  ? t("Deposits")
                  : filter === "withdraw"
                    ? t("Withdrawals")
                    : t("Bot activity")}
            </button>
          ))}
        </div>
        <GradientPanel className="ledger-card">
          {filteredLedger.length ? (
            filteredLedger.map((entry, index) => {
              const amount = signedActivityAmount(entry.kind, entry.status, entry.amount_usd);
              const isNonFinancial = isNonFinancialActivity(entry.kind);
              return (
              <div className="ledger-row" key={`${entry.created_at}-${index}`}>
                <div>
                  <strong>{t(activityLabel(entry.kind, entry.status, amount))}</strong>
                  <small>
                    {isFlashbackEntryLock(entry.kind) ? t("Entry locked until the sealed result is revealed") : isNonFinancial ? t("Strategy controls saved · no balance change") : `${entry.asset} / ${t(entry.status)}`}
                  </small>
                </div>
                <span
                  className={`activity-status ${activityTone(entry.kind, entry.status, amount)}`}
                >
                  {t(entry.status)}
                </span>
                <code className={isNonFinancial ? undefined : amount > 0 ? "mint" : amount < 0 ? "down" : undefined}>
                  {isNonFinancial ? "—" : activityAmountDisplay(amount)}
                </code>
              </div>
              );
            })
          ) : (
            <div className="empty-wallet-state">
              <img src="/illustrations/empty-wallet.png" alt={t("No wallet activity yet")} />
              <strong>{t("No wallet activity yet")}</strong>
              <small>
                {t("Your verified deposits, withdrawals, and bot allocations will appear here.")}
              </small>
            </div>
          )}
        </GradientPanel>
      </div>
    );
  if (view === "activity")
    return (
      <div className="ledger-screen">
        <button className="back-action" onClick={showOverview}>
          <StateIcon name="arrow-left" /> {t("Wallet overview")}
        </button>
        <div className="ledger-header">
          <div>
            <span className="eyebrow">{t("WALLET / ACTIVITY")}</span>
            <h2>{t("Activity")}</h2>
          </div>
        </div>
        <GradientPanel className="ledger-card">
          {[...data.engine, ...data.ledger].length ? (
            [
              ...data.engine.map((entry) => ({
                kind: entry.status,
                asset: "Trading",
                amount_usd: entry.net_realized,
                status: entry.status,
                created_at: entry.created_at,
              })),
              ...data.ledger,
            ]
              .sort((a, b) => b.created_at - a.created_at)
              .map((entry, index) => {
                const amount = signedActivityAmount(entry.kind, entry.status, entry.amount_usd);
                const isNonFinancial = isNonFinancialActivity(entry.kind);
                return (
                <div
                  className="ledger-row"
                  key={`${entry.created_at}-${index}`}
                >
                  <div>
                    <strong>{t(activityLabel(entry.kind, entry.status, amount))}</strong>
                    <small>
                      {isFlashbackEntryLock(entry.kind) ? t("Entry locked until the sealed result is revealed") : isNonFinancial ? t("Strategy controls saved · no balance change") : `${entry.asset} / ${t(entry.status)}`}
                    </small>
                  </div>
                  <span
                    className={`activity-status ${activityTone(entry.kind, entry.status, amount)}`}
                  >
                    {t(entry.status)}
                  </span>
                  <code className={isNonFinancial ? undefined : amount > 0 ? "mint" : amount < 0 ? "down" : undefined}>
                    {isNonFinancial ? "—" : activityAmountDisplay(amount)}
                  </code>
                </div>
                );
              })
          ) : (
            <div className="empty-wallet-state">
              <img
                src="/illustrations/empty-wallet.png"
                alt={t("No activity yet")}
              />
              <strong>{t("No activity yet")}</strong>
              <small>{t("Verified transfers and bot events will appear here.")}</small>
            </div>
          )}
        </GradientPanel>
      </div>
    );
  return (
    <div className="wallet-grid">
      <GradientPanel className="wallet-balance-overview">
        <div className="wallet-balance-primary">
          <div className="wallet-balance-heading">
            <h2>{t("Available balance")}</h2>
            <button
              type="button"
              className="visibility"
              aria-label={t(balancesVisible ? "Hide wallet balances" : "Show wallet balances")}
              aria-pressed={balancesVisible}
              onClick={() => setBalancesVisible((visible) => !visible)}
            >
              <StateIcon name={balancesVisible ? "eye" : "eye-off"} size={17} />
            </button>
          </div>
          <strong className="mint">{balancesVisible ? money(data.wallet.available) : "••••••"}</strong>
          <small>{t("Available now")}</small>
        </div>
        <div className="wallet-balance-facts" aria-label={t("Wallet balances")}>
          <div>
            <span>{t("LOCKED")}</span>
            <strong>{balancesVisible ? money(data.wallet.locked) : "••••••"}</strong>
            <small>{t("Active bots")}</small>
          </div>
          <div>
            <span>{t("TOTAL EQUITY")}</span>
            <strong className="mint">{balancesVisible ? money(data.wallet.equity) : "••••••"}</strong>
            <small>{t("Account value")}</small>
          </div>
          <div>
            <span>{t("HIGH-WATER MARK")}</span>
            <strong>{balancesVisible ? money(data.wallet.hwm) : "••••••"}</strong>
            <small>{t("Fee baseline")}</small>
          </div>
        </div>
      </GradientPanel>
      <div className="wallet-actions" role="group" aria-label={t("Wallet actions")}>
        <button onClick={() => setView("deposit")}>
          <span>
            <Download />
          </span>
          <strong>{t("Deposits")}</strong>
          <ChevronRight />
        </button>
        <button onClick={() => setView("withdraw")}>
          <span>
            <Send />
          </span>
          <strong>{t("WITHDRAW")}</strong>
          <ChevronRight />
        </button>
        <button onClick={() => setView("history")}>
          <span>
            <History />
          </span>
          <strong>{t("WALLET / HISTORY")}</strong>
          <ChevronRight />
        </button>
        <button onClick={() => setView("activity")}>
          <span>
            <Zap />
          </span>
          <strong>{t("Activity")}</strong>
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
