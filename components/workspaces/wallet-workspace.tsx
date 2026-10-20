"use client";

import { useEffect, useRef, useState } from "react";

import { AccessibleDialog } from "../accessible-dialog";
import { useDeskSelector, type DeskStore } from "../../lib/desk-store";
import type { DeskState } from "../../lib/desk-types";
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

export function WalletWorkspace({
  store,
  poll,
  request,
  onWalletUpdate,
  onNotice,
  initialView = "overview",
}: {
  store: DeskStore;
  poll: () => Promise<LiveDashboard>;
  request: (path: string, options?: RequestInit) => Promise<any>;
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
      onWalletUpdate={onWalletUpdate}
      onNotice={onNotice}
      initialView={initialView}
    />
  );
}

function WalletWorkspaceBody({
  data,
  request,
  onWalletUpdate,
  onNotice,
  initialView = "overview",
}: {
  data: LiveDashboard;
  request: (path: string, options?: RequestInit) => Promise<any>;
  onWalletUpdate: (update: {
    wallet?: Partial<LiveDashboard["wallet"]>;
    withdrawal?: LiveDashboard["withdrawals"][number];
    deposits?: LiveDashboard["deposits"];
  }) => void;
  onNotice: (message: string) => void;
  initialView?: "overview" | "deposit" | "withdraw" | "history" | "activity" | "gas";
}) {
  const [view, setView] = useState<
    "overview" | "deposit" | "withdraw" | "history" | "activity" | "gas"
  >("overview");
  useEffect(() => {
    setView(initialView);
  }, [initialView]);
  const [step, setStep] = useState(0);
  const [asset, setAsset] = useState("USDT");
  const [chain, setChain] = useState("ERC20");
  const [expectedAmount, setExpectedAmount] = useState("");
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
    if (!intent) {
      setQrDataUrl("");
      return;
    }
    let cancelled = false;
    void request(`/v1/deposits/${intent.id}/qr`)
      .then((result) => {
        if (!cancelled) setQrDataUrl(String(result.data_url || ""));
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [intent?.id]);
  useEffect(() => {
    const trackedStatuses = new Set([
      "watching",
      "confirming",
      "pending_dust",
      "confirmed_pending_sweep",
      "sweeping",
      "sweep_confirming",
    ]);
    if (!intent?.watch_enabled || !trackedStatuses.has(intent.status.toLowerCase())) return;
    let cancelled = false;
    const refreshDepositStatus = () => {
      void requestRef.current("/v1/dashboard")
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
  }, [intent?.id, intent?.status, intent?.watch_enabled]);
  const networks = [
    ["ERC20", "Ethereum"],
    ["BEP20", "BNB Chain"],
    ["BASE", "Base"],
    ["ARBITRUM", "Arbitrum"],
    ["POLYGON", "Polygon"],
    ["SPL", "Solana"],
  ];
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
    setDepositPending(true);
    try {
      const result = await request("/v1/deposits/routes", {
        method: "POST",
        body: JSON.stringify({
          asset,
          chain,
          expected_amount: expectedAmount || null,
        }),
      });
      setIntent(result.intent);
      setStep(2);
      onNotice(
        "Deposit route created. Send only the selected asset on the selected network.",
      );
    } catch (error) {
      onNotice(
        error instanceof Error
          ? error.message
          : "Could not create the deposit route.",
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
        `Withdrawal ${String(result.withdrawal_id || "request").slice(0, 8)} is queued for review.`,
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
      const message = error instanceof Error ? error.message : "Could not create the withdrawal request.";
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
          <StateIcon name="arrow-left" /> Wallet overview
        </button>
        <StepRail current={step} />
        <GradientPanel className="flow-card">
          <div className="flow-title">
            <div>
              <span className="eyebrow">DEPOSIT / ONE-TIME ROUTE</span>
              <h2>
                {step === 0
                  ? "Choose an asset"
                  : step === 1
                    ? "Choose a network"
                    : `Send ${asset} to TradePulse`}
              </h2>
            </div>
            <span className="secure-chip">
              <StateIcon name="lock" /> PROTECTED
            </span>
          </div>
          {step === 0 && (
            <div className="choice-grid">
              {["USDT", "USDC"].map((item) => (
                <button
                  type="button"
                  key={item}
                  className={asset === item ? "selected" : ""}
                  onClick={() => {
                    setAsset(item);
                    setStep(1);
                  }}
                >
                  <PaymentMark asset={item} />
                  <strong>{item}</strong>
                  <small>{item === "USDT" ? "Tether USD" : "USD Coin"}</small>
                  <ChevronRight />
                </button>
              ))}
            </div>
          )}
          {step === 1 && (
            <>
              <div className="choice-grid">
                {networks.map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    className={chain === value ? "selected" : ""}
                    onClick={() => {
                      setChain(value);
                      setIntent(null);
                      setStep(2);
                    }}
                  >
                    <PaymentMark asset={value} />
                    <strong>{label}</strong>
                    <small>Use only this matching network</small>
                    <ChevronRight />
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 2 && !intent && (
            <>
              <div className="minimum-warning">
                <span>✓</span>
                <div>
                  <strong>
                    {asset} on {networks.find(([value]) => value === chain)?.[1] || chain}
                  </strong>
                  <p>Use this matching network for your one-time deposit route.</p>
                  <button type="button" className="small-action" onClick={() => setStep(1)}>
                    Change network
                  </button>
                </div>
              </div>
              <label className="amount-field">
                <span>EXPECTED AMOUNT / OPTIONAL</span>
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
                {depositPending ? "Preparing route…" : "Create secure route"}{" "}
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
                  <strong>Deposit credited</strong>
                  <small>Your verified transfer is now in your available wallet balance.</small>
                </div>
              )}
              {intent.status.toLowerCase() === "pending_dust" && (
                <div className="below-minimum-card">
                  <img
                    src="/illustrations/below-minimum.png"
                    alt="Deposit below the required minimum"
                    className="below-minimum-art"
                    decoding="async"
                  />
                  <div>
                    <strong>Deposit below minimum</strong>
                    <small>Send the remaining amount to this same route to complete the credit.</small>
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
                  SCAN TO DEPOSIT {intent.asset} ON {intent.chain}
                </small>
              </div>
              <div className="copy-field">
                <code>{intent.address}</code>
                <button
                  aria-label="Copy deposit address"
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
                  Send {intent.asset} on {intent.chain} only
                </strong>
                <span>
                  This is a one-time route. Another asset or network cannot be
                  credited automatically.
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
                    );
                    setIntent((current) =>
                      current
                        ? {
                            ...current,
                            status: String(result.status || current.status),
                            watch_enabled: true,
                          }
                        : current,
                    );
                    onNotice(
                      result.detected
                        ? `Transfer detected. Status: ${result.status}. Credit happens after confirmation.`
                        : `Monitoring started. No transfer detected yet; nothing was credited.`,
                    );
                  } catch (error) {
                    onNotice(
                      error instanceof Error
                        ? error.message
                        : "Could not start deposit monitoring.",
                    );
                  } finally {
                    setDepositPending(false);
                  }
                }}
              >
                {depositPending ? "Checking deposit…" : "I made this deposit"} <ChevronRight />
              </button>
              <div className="timeline">
                <span className="eyebrow">DEPOSIT STATUS</span>
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
                            "credited_and_closed",
                          ].includes(status)
                        : status === "credited_and_closed";
                  return (
                    <div className="timeline-row" key={label}>
                      <i className={complete ? "active" : ""}>
                        {complete ? "✓" : index + 1}
                      </i>
                      <div>
                        <strong>{label}</strong>
                        <small>
                          {index === 0
                            ? "Waiting for the selected route to detect your transaction."
                            : index === 1
                              ? "On-chain confirmation is required before a balance credit."
                              : "Your available balance updates after the route is fully settled."}
                        </small>
                      </div>
                      <span
                        className={`status-chip ${complete ? "running" : "review"}`}
                      >
                        {complete ? "complete" : "pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </GradientPanel>
        {data.deposits.length > 0 && (
          <GradientPanel className="ledger-card">
            <span className="eyebrow">MY DEPOSIT ROUTES</span>
            {data.deposits.map((route) => (
              <div className="ledger-row" key={route.id}>
                <div>
                  <strong>
                    {route.asset} / {route.chain}
                  </strong>
                  <small>{route.address}</small>
                </div>
                <span
                  className={`activity-status ${route.status.includes("fail") ? "review" : "complete"}`}
                >
                  {route.status}
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
                  Open
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
          <StateIcon name="arrow-left" /> Wallet overview
        </button>
        <StepRail current={2} />
        <GradientPanel className="flow-card">
          <div className="success-state">
            <img
              src="/illustrations/withdrawal-sent.png"
              alt="Withdrawal queued for secure review"
              className="withdrawal-sent-art"
              decoding="async"
            />
            <strong>Withdrawal queued</strong>
            <small>
              {money(submittedWithdrawal.amount)} {submittedWithdrawal.asset} on{" "}
              {submittedWithdrawal.chain} is reserved for review.
            </small>
          </div>
          <button className="primary-action" onClick={showOverview}>
            Back to wallet <ChevronRight />
          </button>
          <button className="ghost-action" onClick={() => setView("history")}>
            View withdrawal history
          </button>
        </GradientPanel>
      </div>
    );
  if (view === "withdraw")
    return (
      <div className="wallet-flow">
        <button className="back-action" onClick={showOverview}>
          <StateIcon name="arrow-left" /> Wallet overview
        </button>
        <StepRail current={2} />
        <GradientPanel className="flow-card">
          <div className="flow-title">
            <div>
              <span className="eyebrow">WITHDRAW / CROSS-CHECK</span>
              <h2>Send funds safely</h2>
            </div>
            <span className="secure-chip">
              <ShieldCheck /> SECURE
            </span>
          </div>
          <div className="withdrawable-summary">
            <div>
              <span>Withdrawable now</span>
              <strong>{money(data.wallet.available)}</strong>
            </div>
            <div>
              <span>Locked in bots</span>
              <strong>{money(data.wallet.locked)}</strong>
            </div>
            <small>
              Only available wallet balance can be withdrawn. Check every
              destination character before continuing.
            </small>
          </div>
          <label className="amount-field">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <PaymentMark asset={withdrawAsset} compact /> ASSET · {withdrawAsset}
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
              <PaymentMark asset={withdrawChain} compact /> NETWORK · {networks.find(([value]) => value === withdrawChain)?.[1] || withdrawChain}
            </span>
            <select
              value={withdrawChain}
              onChange={(event) => setWithdrawChain(event.target.value)}
            >
              {networks.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="amount-field">
            <span>DESTINATION ADDRESS</span>
            <input
              value={withdrawAddress}
              onChange={(event) =>
                setWithdrawAddress(event.target.value.replace(/\s/g, ""))
              }
              placeholder="Paste the full destination address"
              autoComplete="off"
            />
          </label>
          {data.whitelist.filter((route) => route.chain === withdrawChain)
            .length > 0 && (
            <div className="saved-destinations">
              <span className="field-caption">SAVED DESTINATIONS</span>
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
                        {cooling ? "· cooling" : ""}
                      </small>
                      <ChevronRight />
                    </button>
                  );
                })}
            </div>
          )}
          <label className="amount-field">
            <span>AMOUNT / USD</span>
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
            <span>SIX-DIGIT SECURITY CODE</span>
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
            Review withdrawal <ChevronRight />
          </button>
        </GradientPanel>
        {reviewWithdrawal && (
          <AccessibleDialog label="Verify before sending" onClose={() => setReviewWithdrawal(false)} dismissible={!walletPending}>
              <span className="eyebrow">FINAL CROSS-CHECK</span>
              <h2>Verify before sending</h2>
              <div className="mono-review">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <PaymentMark asset={withdrawAsset} compact />
                  <PaymentMark asset={withdrawChain} compact />
                  {withdrawAsset} / {withdrawChain}
                </span>
                <code>{withdrawAddress}</code>
                <span>AMOUNT / {money(Number(withdrawAmount))}</span>
              </div>
              <p>
                Withdrawal requests are reviewed before release. Confirm only
                when the address and network are correct.
              </p>
              {withdrawalError && <p className="security-feedback" role="alert">{withdrawalError}</p>}
              <button className="primary-action" disabled={walletPending} aria-busy={walletPending} onClick={submitWithdrawal}>
                {walletPending ? "Submitting…" : "Confirm withdrawal"} <Send />
              </button>
              <button
                className="ghost-action"
                disabled={walletPending}
                onClick={() => setReviewWithdrawal(false)}
              >
                Go back
              </button>
          </AccessibleDialog>
        )}
      </div>
    );
  if (view === "history")
    return (
      <div className="ledger-screen">
        <button className="back-action" onClick={showOverview}>
          <StateIcon name="arrow-left" /> Wallet overview
        </button>
        <div className="ledger-header">
          <div>
            <span className="eyebrow">WALLET / HISTORY</span>
            <h2>Ledger history</h2>
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
                ? "All"
                : filter === "deposit"
                  ? "Deposits"
                  : filter === "withdraw"
                    ? "Withdrawals"
                    : "Bot activity"}
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
                  <strong>{activityLabel(entry.kind, entry.status, amount)}</strong>
                  <small>
                    {isFlashbackEntryLock(entry.kind) ? "Entry locked until the sealed result is revealed" : isNonFinancial ? "Strategy controls saved · no balance change" : `${entry.asset} / ${entry.status}`}
                  </small>
                </div>
                <span
                  className={`activity-status ${activityTone(entry.kind, entry.status, amount)}`}
                >
                  {entry.status}
                </span>
                <code className={isNonFinancial ? undefined : amount > 0 ? "mint" : amount < 0 ? "down" : undefined}>
                  {isNonFinancial ? "—" : activityAmountDisplay(amount)}
                </code>
              </div>
              );
            })
          ) : (
            <div className="empty-wallet-state">
              <img src="/illustrations/empty-wallet.png" alt="Empty wallet" />
              <strong>No wallet activity yet</strong>
              <small>
                Your verified deposits, withdrawals, and bot allocations will
                appear here.
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
          <StateIcon name="arrow-left" /> Wallet overview
        </button>
        <div className="ledger-header">
          <div>
            <span className="eyebrow">WALLET / ACTIVITY</span>
            <h2>Activity</h2>
          </div>
        </div>
        <GradientPanel className="ledger-card">
          {[...data.engine, ...data.ledger].length ? (
            [
              ...data.engine.map((entry) => ({
                kind: entry.status,
                asset: "Engine",
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
                    <strong>{activityLabel(entry.kind, entry.status, amount)}</strong>
                    <small>
                      {isFlashbackEntryLock(entry.kind) ? "Entry locked until the sealed result is revealed" : isNonFinancial ? "Strategy controls saved · no balance change" : `${entry.asset} / ${entry.status}`}
                    </small>
                  </div>
                  <span
                    className={`activity-status ${activityTone(entry.kind, entry.status, amount)}`}
                  >
                    {entry.status}
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
                alt="No wallet activity"
              />
              <strong>No activity yet</strong>
              <small>Verified transfers and bot events will appear here.</small>
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
            <h2>Available balance</h2>
            <button
              type="button"
              className="visibility"
              aria-label={balancesVisible ? "Hide wallet balances" : "Show wallet balances"}
              aria-pressed={balancesVisible}
              onClick={() => setBalancesVisible((visible) => !visible)}
            >
              <StateIcon name={balancesVisible ? "eye" : "eye-off"} size={17} />
            </button>
          </div>
          <strong className="mint">{balancesVisible ? money(data.wallet.available) : "••••••"}</strong>
          <small>Available now</small>
        </div>
        <div className="wallet-balance-facts" aria-label="Wallet account state">
          <div>
            <span>LOCKED</span>
            <strong>{balancesVisible ? money(data.wallet.locked) : "••••••"}</strong>
            <small>Active bots</small>
          </div>
          <div>
            <span>TOTAL EQUITY</span>
            <strong className="mint">{balancesVisible ? money(data.wallet.equity) : "••••••"}</strong>
            <small>Account value</small>
          </div>
          <div>
            <span>HIGH-WATER MARK</span>
            <strong>{balancesVisible ? money(data.wallet.hwm) : "••••••"}</strong>
            <small>Fee baseline</small>
          </div>
        </div>
      </GradientPanel>
      <div className="wallet-actions" role="group" aria-label="Wallet actions">
        <button onClick={() => setView("deposit")}>
          <span>
            <Download />
          </span>
          <strong>Deposit</strong>
          <ChevronRight />
        </button>
        <button onClick={() => setView("withdraw")}>
          <span>
            <Send />
          </span>
          <strong>Withdraw</strong>
          <ChevronRight />
        </button>
        <button onClick={() => setView("history")}>
          <span>
            <History />
          </span>
          <strong>History</strong>
          <ChevronRight />
        </button>
        <button onClick={() => setView("activity")}>
          <span>
            <Zap />
          </span>
          <strong>Activity</strong>
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
