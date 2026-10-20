"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AccessibleDialog } from "../accessible-dialog";
import {
  GradientPanel,
  money,
  Send,
  ShieldCheck,
  X,
  type LiveTradePulseAdmin,
} from "../tradepulse-shell";

export function AdminWorkspace({
  admin,
  environment,
  request,
  reload,
  onEnvironment,
  onNotice,
}: {
  admin: NonNullable<LiveTradePulseAdmin>;
  environment: "mainnet" | "testnet";
  request: (
    path: string,
    options?: RequestInit,
    environment?: "mainnet" | "testnet",
    timeoutMs?: number,
  ) => Promise<any>;
  reload: () => Promise<void>;
  onEnvironment: (environment: "mainnet" | "testnet") => Promise<void>;
  onNotice: (message: string) => void;
}) {
  const [target, setTarget] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [settingKey, setSettingKey] = useState("deposit_min_usd");
  const [settingValue, setSettingValue] = useState("");
  const [broadcast, setBroadcast] = useState("");
  const [confirm, setConfirm] = useState("");
  const [broadcastScope, setBroadcastScope] = useState<"all" | "user" | "channel" | "group">("all");
  const [broadcastTarget, setBroadcastTarget] = useState("");
  const [broadcastPending, setBroadcastPending] = useState(false);
  const [adminMember, setAdminMember] = useState("");
  const [vaultChain, setVaultChain] = useState("");
  const [vaultAsset, setVaultAsset] = useState("USDT");
  const [vaultAddress, setVaultAddress] = useState("");
  const [vaultSavePending, setVaultSavePending] = useState(false);
  const [vaults, setVaults] = useState<
    Array<{ chain: string; asset: string; address: string }>
  >([]);
  const [syntheticConfig, setSyntheticConfig] = useState<Record<string, string>>({});
  const [flashbackDirectionConfig, setFlashbackDirectionConfig] = useState("");
  const [flashbackDirectionHistory, setFlashbackDirectionHistory] = useState<Array<{ id: string; market: string; direction: string; state: string; allocation_usd: number; return_usd?: number; user_net_usd?: number; close_reason?: string; settled_at?: number }>>([]);
  const [memecoinConfig, setMemecoinConfig] = useState<Record<string, string>>({});
  const [memecoinMetrics, setMemecoinMetrics] = useState<Record<string, number | boolean>>({});
  const [pendingAdminActions, setPendingAdminActions] = useState<Record<string, boolean>>({});
  const [pendingRecovery, setPendingRecovery] = useState<string | null>(null);
  const [recoveryReview, setRecoveryReview] = useState<{
    row: LiveTradePulseAdmin["recovery_cases"][number];
    status: "verified" | "treasury_review" | "rejected";
    note: string;
    message: string;
  } | null>(null);
  const [pendingAccountActions, setPendingAccountActions] = useState<Record<"fund" | "onboarding" | "pilot", boolean>>({ fund: false, onboarding: false, pilot: false });
  const accountActionSubmitting = useRef<Record<"fund" | "onboarding" | "pilot", boolean>>({ fund: false, onboarding: false, pilot: false });
  const [autouserFile, setAutouserFile] = useState<File | null>(null);
  const [autouserMinimum, setAutouserMinimum] = useState("");
  const [autouserMaximum, setAutouserMaximum] = useState("");
  const [autouserConfirmed, setAutouserConfirmed] = useState(false);
  const [autouserPending, setAutouserPending] = useState(false);
  const [autouserRunPending, setAutouserRunPending] = useState<Record<string, boolean>>({});
  const [communityGroup, setCommunityGroup] = useState("");
  const [adminHelpOpen, setAdminHelpOpen] = useState(false);
  const [adminTicket, setAdminTicket] = useState<(LiveTradePulseAdmin["tickets"][number] & { messages?: Array<{ id: number; author_role: "user" | "admin"; body: string; created_at: number }> }) | null>(null);
  const [adminTicketReply, setAdminTicketReply] = useState("");
  const [adminTicketPending, setAdminTicketPending] = useState(false);
  const fundingFieldId = useId();
  const autouserFileId = useId();
  const autouserFileRef = useRef<HTMLInputElement>(null);
  const [withdrawalReview, setWithdrawalReview] = useState<{
    row: LiveTradePulseAdmin["withdrawals"][number];
    action: "approve" | "reject";
    environment: "mainnet" | "testnet" | "demo";
  } | null>(null);
  const [withdrawalPending, setWithdrawalPending] = useState(false);
  const withdrawalSubmitting = useRef(false);
  const adminReconcileTimer = useRef<number | null>(null);
  const [withdrawalError, setWithdrawalError] = useState("");
  const scheduleReconcile = () => {
    // Do not make a confirmed write compete with an immediate, heavyweight
    // control-room read.  Several quick actions collapse into one quiet
    // reconciliation, while the initiating button becomes available as soon
    // as its own request completes.
    if (adminReconcileTimer.current !== null) return;
    adminReconcileTimer.current = window.setTimeout(() => {
      adminReconcileTimer.current = null;
      void reload().catch(() => undefined);
    }, 900);
  };
  useEffect(() => () => {
    if (adminReconcileTimer.current !== null) {
      window.clearTimeout(adminReconcileTimer.current);
    }
  }, []);
  useEffect(() => {
    setWithdrawalReview(null);
    setWithdrawalError("");
  }, [environment]);
  useEffect(() => {
    setCommunityGroup(admin.community_cards?.config?.group || "");
  }, [admin.community_cards?.config?.group]);
  const reviewWithdrawal = (row: LiveTradePulseAdmin["withdrawals"][number], action: "approve" | "reject") => {
    setWithdrawalError("");
    setWithdrawalReview({ row: { ...row }, action, environment });
  };
  const reviewedWithdrawal = withdrawalReview && admin.withdrawals.find((row) => row.id === withdrawalReview.row.id);
  const canReviewWithdrawal = (status: string, action: "approve" | "reject") =>
    status === "pending_admin_release" || (action === "reject" && status === "approved");
  const withdrawalReviewCurrent = Boolean(withdrawalReview && reviewedWithdrawal &&
    withdrawalReview.environment === environment && canReviewWithdrawal(reviewedWithdrawal.status, withdrawalReview.action) &&
    (["user_id", "amount_usd", "asset", "chain", "address"] as const).every((key) => reviewedWithdrawal[key] === withdrawalReview.row[key]));
  const confirmWithdrawalReview = async () => {
    if (!withdrawalReview || withdrawalSubmitting.current || !withdrawalReviewCurrent ||
      (withdrawalReview.action === "approve" && !withdrawalReview.row.address?.trim())) return;
    withdrawalSubmitting.current = true;
    setWithdrawalPending(true);
    setWithdrawalError("");
    try {
      await request(`/v1/admin/withdrawals/${withdrawalReview.row.id}`, {
        method: "POST",
        body: JSON.stringify({ action: withdrawalReview.action }),
      }, withdrawalReview.environment);
      onNotice(withdrawalReview.action === "approve" ? "Withdrawal approved and logged." : "Withdrawal rejected.");
      setWithdrawalReview(null);
      scheduleReconcile();
    } catch (error) {
      setWithdrawalError(error instanceof Error ? error.message : "Withdrawal action failed. Review the current status before trying again.");
    } finally {
      withdrawalSubmitting.current = false;
      setWithdrawalPending(false);
    }
  };
  useEffect(() => {
    setVaultChain((current) =>
      admin.chains.some((chain) => chain.id === current)
        ? current
        : admin.chains[0]?.id || "",
    );
    request("/v1/admin/vaults")
      .then((response) =>
        setVaults(Array.isArray(response.vaults) ? response.vaults : []),
      )
      .catch(() => setVaults([]));
    request("/v1/admin/synthetic-config")
      .then((response) => setSyntheticConfig(response.settings || {}))
      .catch(() => setSyntheticConfig({}));
    request("/v1/admin/memecoin-config")
      .then((response) => {
        setMemecoinConfig(response.settings || {});
        setMemecoinMetrics(response.metrics || {});
      })
      .catch(() => {
        setMemecoinConfig({});
        setMemecoinMetrics({});
      });
    request("/v1/admin/flashback-direction-config")
      .then((response) => {
        setFlashbackDirectionConfig(JSON.stringify(response.config || {}, null, 2));
        setFlashbackDirectionHistory(Array.isArray(response.sessions) ? response.sessions : []);
      })
      .catch(() => {
        setFlashbackDirectionConfig("");
        setFlashbackDirectionHistory([]);
      });
  }, [environment]);
  const validTarget = /^@?[A-Za-z0-9_]{5,32}$/.test(adminMember) || /^\d+$/.test(adminMember);
  const validCommunityGroup = /^@[A-Za-z0-9_]{5,32}$/.test(communityGroup) || /^-\d{5,20}$/.test(communityGroup);
  const validFunding = /^\d+$/.test(target) && Number(amount) > 0 && Boolean(reason.trim());
  const broadcastNeedsTarget = broadcastScope !== "all";
  const validBroadcastTarget = broadcastScope === "user"
    ? (/^\d+$/.test(broadcastTarget) || /^@[A-Za-z0-9_]{5,32}$/.test(broadcastTarget))
    : (/^@[A-Za-z0-9_]{5,32}$/.test(broadcastTarget) || /^-?\d{5,20}$/.test(broadcastTarget));
  const broadcastConfirmed = confirm.trim().toUpperCase() === "SEND ALL";
  const canSendBroadcast = Boolean(broadcast.trim()) && !broadcastPending && (!broadcastNeedsTarget || validBroadcastTarget) && (broadcastScope !== "all" || broadcastConfirmed);
  const isAdminActionPending = (key: string) => Boolean(pendingAdminActions[key]);
  const post = async (path: string, body: object, message: string, actionKey = path) => {
    if (isAdminActionPending(actionKey)) return false;
    setPendingAdminActions((current) => ({ ...current, [actionKey]: true }));
    try {
      await request(path, { method: "POST", body: JSON.stringify(body) });
      // Reconcile after the mutation without holding the initiating control
      // behind a second request or starting one refresh per button click.
      scheduleReconcile();
      onNotice(message);
      return true;
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Admin action failed.");
      return false;
    } finally {
      setPendingAdminActions((current) => {
        const next = { ...current };
        delete next[actionKey];
        return next;
      });
    }
  };
  const openAdminTicket = async (ticket: LiveTradePulseAdmin["tickets"][number]) => {
    setAdminTicketPending(true);
    try {
      const response = await request(`/v1/admin/tickets/${ticket.id}`);
      setAdminTicket({ ...(response.ticket || ticket), messages: Array.isArray(response.messages) ? response.messages : [] });
      setAdminTicketReply("");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Could not load the support conversation.");
    } finally {
      setAdminTicketPending(false);
    }
  };
  const runAccountAction = async (
    action: "fund" | "onboarding" | "pilot",
    path: string,
    body: object,
    message: string,
  ) => {
    if (accountActionSubmitting.current[action]) return;
    accountActionSubmitting.current[action] = true;
    setPendingAccountActions((current) => ({ ...current, [action]: true }));
    try {
      await post(path, body, message);
    } finally {
      accountActionSubmitting.current[action] = false;
      setPendingAccountActions((current) => ({ ...current, [action]: false }));
    }
  };
  const saveSyntheticConfig = async (settings: Record<string, string>) => {
    const actionKey = `synthetic-config:${Object.keys(settings).sort().join(",")}`;
    if (isAdminActionPending(actionKey)) return;
    setPendingAdminActions((current) => ({ ...current, [actionKey]: true }));
    try {
      const response = await request("/v1/admin/synthetic-config", {
        method: "PUT",
        body: JSON.stringify({ settings }),
      });
      setSyntheticConfig((current) => ({ ...current, ...(response.settings || settings) }));
      onNotice("Synthetic configuration saved and audit logged.");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Could not save synthetic configuration.");
    } finally {
      setPendingAdminActions((current) => {
        const next = { ...current };
        delete next[actionKey];
        return next;
      });
    }
  };
  const saveFlashbackDirectionConfig = async () => {
    const actionKey = "flashback-direction:config";
    if (isAdminActionPending(actionKey)) return;
    setPendingAdminActions((current) => ({ ...current, [actionKey]: true }));
    try {
      const response = await request("/v1/admin/flashback-direction-config", {
        method: "PUT",
        body: flashbackDirectionConfig,
      });
      setFlashbackDirectionConfig(JSON.stringify(response.config || {}, null, 2));
      setFlashbackDirectionHistory(Array.isArray(response.sessions) ? response.sessions : []);
      onNotice("Direction catalog saved. Existing contracts keep their recorded terms.");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Could not save the Direction catalog.");
    } finally {
      setPendingAdminActions((current) => {
        const next = { ...current };
        delete next[actionKey];
        return next;
      });
    }
  };
  const reviewRecovery = (row: LiveTradePulseAdmin["recovery_cases"][number], status: "verified" | "treasury_review" | "rejected", note: string, message: string) => {
    setRecoveryReview({ row: { ...row }, status, note, message });
  };
  const updateRecovery = async (caseId: string, status: string, note: string, message: string) => {
    if (pendingRecovery !== null) return;
    setPendingRecovery(caseId);
    try {
      return await post(`/v1/admin/recovery/${caseId}`, { status, note }, message, `recovery:${caseId}:${status}`);
    } finally {
      setPendingRecovery(null);
    }
  };
  const confirmRecoveryReview = async () => {
    if (!recoveryReview || pendingRecovery) return;
    const saved = await updateRecovery(
      recoveryReview.row.id,
      recoveryReview.status,
      recoveryReview.note,
      recoveryReview.message,
    );
    if (saved) setRecoveryReview(null);
  };
  const submitAutouserRun = async () => {
    if (!autouserFile || autouserPending || !autouserConfirmed || Number(autouserMinimum) <= 0 || Number(autouserMaximum) < Number(autouserMinimum)) return;
    setAutouserPending(true);
    try {
      const form = new FormData();
      form.append("file", autouserFile);
      form.append("min_amount", autouserMinimum);
      form.append("max_amount", autouserMaximum);
      form.append("confirmed", "true");
      // The API accepts only the durable import queue here. Account setup and
      // activity expansion happen independently on the server, so a large
      // upload never leaves this browser control stuck on a long request.
      const result = await request("/v1/admin/autousers/runs", { method: "POST", body: form }, "testnet", 30_000);
      setAutouserFile(null);
      if (autouserFileRef.current) autouserFileRef.current.value = "";
      setAutouserMinimum("");
      setAutouserMaximum("");
      setAutouserConfirmed(false);
      onNotice(result.message || "Auto-user testnet deposit run scheduled.");
      scheduleReconcile();
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Auto-user run could not be scheduled.");
    } finally {
      setAutouserPending(false);
    }
  };
  const updateAutouserRun = async (runId: string, action: "pause" | "resume" | "cancel") => {
    const actionKey = `${runId}:${action}`;
    if (autouserRunPending[actionKey]) return;
    setAutouserRunPending((current) => ({ ...current, [actionKey]: true }));
    try {
      const result = await request(`/v1/admin/autousers/runs/${runId}/actions`, { method: "POST", body: JSON.stringify({ action }) }, "testnet");
      onNotice(result.message || `Auto-user run ${action}d.`);
      scheduleReconcile();
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Auto-user run could not be updated.");
    } finally {
      setAutouserRunPending((current) => {
        const next = { ...current };
        delete next[actionKey];
        return next;
      });
    }
  };
  const sendBroadcast = async () => {
    if (!canSendBroadcast) return;
    setBroadcastPending(true);
    try {
      const result = await request("/v1/admin/broadcast", {
        method: "POST",
        body: JSON.stringify({
          scope: broadcastScope,
          target: broadcastScope === "all" ? "" : broadcastTarget,
          message: broadcast,
          confirmation: confirm,
        }),
      }, environment, 30_000);
      setBroadcast("");
      setConfirm("");
      setBroadcastTarget("");
      onNotice(result.message || "Broadcast queued for delivery.");
      scheduleReconcile();
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Broadcast could not be queued.");
    } finally {
      setBroadcastPending(false);
    }
  };
  return (
    <div className="admin-screen">
      {adminHelpOpen && <AccessibleDialog label="Admin control room guide" onClose={() => setAdminHelpOpen(false)}>
        <h2>Control room guide</h2>
        <p>Use this workspace to review and act on the selected environment. Mainnet changes affect live operations; testnet changes affect isolated testing only.</p>
        <div className="admin-help-list">
          <div><strong>Movement queues</strong><span>Review confirmed deposits, withdrawal approvals, recovery cases, and their audit trail before acting.</span></div>
          <div><strong>Account operations</strong><span>Fund, reset onboarding, or reissue demo access only for the named Telegram account.</span></div>
          <div><strong>Runtime controls</strong><span>Settings update shared product rules. Save one value at a time and recheck the result before making another change.</span></div>
          <div><strong>Channel gates</strong><span>Set the onboarding channel ID and invite link, then enable the gate only after the bot can post and verify membership there.</span></div>
        </div>
        <button className="primary-action" onClick={() => setAdminHelpOpen(false)}>Close guide</button>
      </AccessibleDialog>}
      {adminTicket && <AccessibleDialog className="admin-ticket-dialog" label={`Support ticket TP-${adminTicket.id}`} onClose={() => setAdminTicket(null)} dismissible={!adminTicketPending}>
        <button className="modal-close" aria-label="Close" disabled={adminTicketPending} onClick={() => setAdminTicket(null)}><X /></button>
        <span className="eyebrow">SUPPORT CONVERSATION</span>
        <h2>TP-{adminTicket.id} · {adminTicket.topic || "General"}</h2>
        <p className="mono">USER {adminTicket.user_id} · {adminTicket.status.replace("_", " ")}</p>
        <div className="support-thread-messages" aria-label={`Messages for support ticket ${adminTicket.id}`}>
          {(adminTicket.messages || []).map((message) => <div className={`support-message ${message.author_role}`} key={message.id}>
            <strong>{message.author_role === "admin" ? "Admin" : "User"}</strong><p>{message.body}</p>
          </div>)}
        </div>
        {adminTicket.status !== "closed" && <>
          <label className="amount-field">Reply to user
            <textarea value={adminTicketReply} onChange={(event) => setAdminTicketReply(event.target.value)} placeholder="Write a clear, account-safe reply." rows={4} />
          </label>
          <button className="primary-action" disabled={adminTicketReply.trim().length < 2 || adminTicketPending} onClick={async () => {
            setAdminTicketPending(true);
            try {
              await request(`/v1/admin/tickets/${adminTicket.id}/messages`, { method: "POST", body: JSON.stringify({ message: adminTicketReply.trim() }) });
              await openAdminTicket(adminTicket);
              onNotice(`Reply sent on TP-${adminTicket.id}.`);
              scheduleReconcile();
            } catch (error) { onNotice(error instanceof Error ? error.message : "Could not send the support reply."); }
            finally { setAdminTicketPending(false); }
          }}>{adminTicketPending ? "Sending…" : "Send reply"} <Send /></button>
        </>}
      </AccessibleDialog>}
      <div className="admin-head">
        <div>
          <h2>Operations desk</h2>
        </div>
        <div className="admin-head-actions"><button className="text-action admin-help-trigger" onClick={() => setAdminHelpOpen(true)}>Admin help</button><div className="env-toggle">
          {(["mainnet", "testnet"] as const).map((item) => (
            <button
              className={environment === item ? "active" : ""}
              aria-pressed={environment === item}
              key={item}
              onClick={() => onEnvironment(item)}
            >
              {item}
            </button>
          ))}
        </div></div>
      </div>
      <div className="admin-status-row">
        <div>
          <strong>{environment.toUpperCase()}</strong>
          <span>{admin.sweeps_enabled ? "Sweeps enabled" : "Sweeps disabled"}</span>
        </div>
        <button
          className="small-action"
          disabled={isAdminActionPending("sweeps:toggle")}
          aria-busy={isAdminActionPending("sweeps:toggle")}
          onClick={() =>
            void post("/v1/admin/sweeps/toggle", {}, "Sweep policy updated.", "sweeps:toggle")
          }
        >
          {isAdminActionPending("sweeps:toggle") ? "Updating…" : "Toggle sweeps"}
        </button>
      </div>
      {withdrawalReview && (
        <AccessibleDialog label={withdrawalReview.action === "approve" ? "Review withdrawal approval" : "Review withdrawal rejection"}
          onClose={() => setWithdrawalReview(null)} dismissible={!withdrawalPending}>
          <span className="eyebrow">ADMIN / FINAL CROSS-CHECK</span>
          <h2>{withdrawalReview.action === "approve" ? "Approve this withdrawal?" : "Reject this withdrawal?"}</h2>
          <div className="fact-block">
            <span>ENVIRONMENT <b>{withdrawalReview.environment.toUpperCase()}</b></span>
            <span>USER <b>{withdrawalReview.row.user_id}</b></span>
            <span>AMOUNT <b>{money(withdrawalReview.row.amount_usd)}</b></span>
            <span>ASSET / NETWORK <b>{withdrawalReview.row.asset} / {withdrawalReview.row.chain}</b></span>
            <span>STATUS <b>{reviewedWithdrawal?.status || "No longer in queue"}</b></span>
          </div>
          <div className="mono-review">
            <span>DESTINATION</span><code>{withdrawalReview.row.address || "Destination unavailable — approval is blocked."}</code>
            <span>REFERENCE</span><code>{withdrawalReview.row.id}</code>
          </div>
          {!withdrawalReviewCurrent && <p role="alert">This request changed. Go back and refresh the queue before reviewing it again.</p>}
          {withdrawalError && <p role="alert">{withdrawalError}</p>}
          <button className={withdrawalReview.action === "approve" ? "primary-action" : "danger-action"}
            disabled={withdrawalPending || !withdrawalReviewCurrent || (withdrawalReview.action === "approve" && !withdrawalReview.row.address?.trim())}
            onClick={() => void confirmWithdrawalReview()}>
            {withdrawalPending ? "Submitting…" : withdrawalReview.action === "approve" ? "Confirm approval" : "Confirm rejection"}
          </button>
          <button className="ghost-action" disabled={withdrawalPending} onClick={() => setWithdrawalReview(null)}>Go back</button>
        </AccessibleDialog>
      )}
      {recoveryReview && (
        <AccessibleDialog label="Review recovery update" onClose={() => setRecoveryReview(null)} dismissible={!pendingRecovery}>
          <span className="eyebrow">ADMIN / RECOVERY REVIEW</span>
          <h2>{recoveryReview.status === "verified" ? "Mark recovery verified?" : recoveryReview.status === "treasury_review" ? "Send recovery to Treasury Review?" : "Reject recovery case?"}</h2>
          <div className="fact-block">
            <span>ENVIRONMENT <b>{environment.toUpperCase()}</b></span>
            <span>USER <b>{recoveryReview.row.user_id}</b></span>
            <span>ASSET / NETWORK <b>{recoveryReview.row.asset} / {recoveryReview.row.network}</b></span>
            <span>STATUS <b>{recoveryReview.row.status.replace("_", " ")}</b></span>
          </div>
          <p>{recoveryReview.status === "verified" ? "Confirm that the supporting evidence has been manually checked. This does not move funds." : recoveryReview.status === "treasury_review" ? "This changes the case routing to Treasury Review. It does not move funds." : "This records the rejection and closes this recovery path. Review the evidence before continuing."}</p>
          <button className={recoveryReview.status === "rejected" ? "danger-action" : "primary-action"} disabled={Boolean(pendingRecovery)} aria-busy={Boolean(pendingRecovery)} onClick={() => void confirmRecoveryReview()}>
            {pendingRecovery ? "Updating…" : recoveryReview.status === "verified" ? "Confirm verification" : recoveryReview.status === "treasury_review" ? "Confirm Treasury Review" : "Confirm rejection"}
          </button>
          <button className="ghost-action" disabled={Boolean(pendingRecovery)} onClick={() => setRecoveryReview(null)}>Go back</button>
        </AccessibleDialog>
      )}
      <div className="admin-grid">
        <GradientPanel className="admin-table">
          <div className="section-heading">
            <div>
              <span className="eyebrow">TREASURY SWEEP QUEUE</span>
              <h2>Pending movement</h2>
            </div>
            <span className="mono">{admin.sweep_queue.length} ROWS</span>
          </div>
          {admin.sweep_queue.length ? (
            admin.sweep_queue.map((row) => (
              <div className="admin-row" key={row.id}>
                <div>
                  <strong>
                    {row.asset} / {row.chain}
                  </strong>
                  <small className="mono">
                    {row.id.slice(0, 8)} / {row.status}
                  </small>
                </div>
                <button
                  className="small-action"
                  disabled={isAdminActionPending(`sweep:${row.id}:retry`)}
                  aria-busy={isAdminActionPending(`sweep:${row.id}:retry`)}
                  onClick={() =>
                    void post(
                      `/v1/admin/sweeps/${row.id}`,
                      { action: "retry" },
                      "Sweep retry requested.",
                      `sweep:${row.id}:retry`,
                    )
                  }
                >
                  {isAdminActionPending(`sweep:${row.id}:retry`) ? "Retrying…" : "Retry"}
                </button>
                <button
                  className="small-action"
                  disabled={isAdminActionPending(`sweep:${row.id}:manual`)}
                  aria-busy={isAdminActionPending(`sweep:${row.id}:manual`)}
                  onClick={() =>
                    void post(
                      `/v1/admin/sweeps/${row.id}`,
                      { action: "manual" },
                      "Manual sweep requested.",
                      `sweep:${row.id}:manual`,
                    )
                  }
                >
                  {isAdminActionPending(`sweep:${row.id}:manual`) ? "Requesting…" : "Manual"}
                </button>
              </div>
            ))
          ) : (
            <p>No queued deposits.</p>
          )}
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">WITHDRAWAL APPROVALS</span>
          <h2>High-friction review</h2>
          {admin.withdrawals.length ? (
            admin.withdrawals.map((row) => (
              <div className="admin-row" key={row.id}>
                <div>
                  <strong>
                    {money(row.amount_usd)} {row.asset} / {row.chain}
                  </strong>
                  <small className="mono">
                    USER {row.user_id} / {row.status}
                  </small>
                </div>
                <button
                  className="small-action"
                  disabled={!canReviewWithdrawal(row.status, "approve") || withdrawalPending}
                  onClick={() => reviewWithdrawal(row, "approve")}
                >
                  Approve
                </button>
                <button
                  className="small-action"
                  disabled={!canReviewWithdrawal(row.status, "reject") || withdrawalPending}
                  onClick={() => reviewWithdrawal(row, "reject")}
                >
                  Reject
                </button>
              </div>
            ))
          ) : (
            <p>No pending withdrawals.</p>
          )}
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">RECOVERY CASES</span>
          <h2>Manual recovery</h2>
          {admin.recovery_cases.length ? (
            admin.recovery_cases.map((row) => (
              <div className="admin-row" key={row.id}>
                <div>
                  <strong>
                    RC-{row.id} / {row.asset} / {row.network}
                  </strong>
                  <small className="mono">
                    USER {row.user_id} / {row.status}
                  </small>
                </div>
                {row.status === "submitted" ? (
                  <>
                    <button
                      className="small-action"
                      disabled={pendingRecovery !== null}
                      onClick={() => reviewRecovery(row, "verified", "Marked verified after manual evidence review.", "Recovery marked verified. No funds were moved.")}
                    >
                      Review verification
                    </button>
                    <button
                      className="small-action"
                      disabled={pendingRecovery !== null}
                      onClick={() => reviewRecovery(row, "treasury_review", "Escalated for custody review.", "Recovery sent to Treasury Review.")}
                    >
                      Review for Treasury
                    </button>
                    <button
                      className="small-action"
                      disabled={pendingRecovery !== null}
                      onClick={() => reviewRecovery(row, "rejected", "Rejected after manual evidence review.", "Recovery rejected.")}
                    >
                      Review rejection
                    </button>
                  </>
                ) : row.status === "verified" ? (
                  <>
                    <button
                      className="small-action"
                      disabled={pendingRecovery !== null}
                      onClick={() => reviewRecovery(row, "treasury_review", "Escalated for custody review after evidence verification.", "Recovery sent to Treasury Review.")}
                    >
                      Review for Treasury
                    </button>
                    <button
                      className="small-action"
                      disabled={pendingRecovery !== null}
                      onClick={() => reviewRecovery(row, "rejected", "Rejected after verification review.", "Recovery rejected.")}
                    >
                      Review rejection
                    </button>
                  </>
                ) : row.status === "treasury_review" ? (
                  <button
                    className="small-action"
                    disabled={pendingRecovery !== null}
                    onClick={() => reviewRecovery(row, "rejected", "Rejected during treasury review.", "Recovery rejected.")}
                  >
                    Review rejection
                  </button>
                ) : (
                  <span className="status-chip review">{row.status.replace("_", " ")}</span>
                )}
              </div>
            ))
          ) : (
            <p>No recovery cases.</p>
          )}
        </GradientPanel>
        <GradientPanel className="admin-table">
          <div className="section-heading">
            <div>
              <span className="eyebrow">SUPPORT QUEUE</span>
              <h2>Tracked user requests</h2>
            </div>
            <span className="mono">{admin.tickets.length} ROWS</span>
          </div>
          {admin.tickets.length ? (
            admin.tickets.map((ticket) => (
              <div className="admin-row" key={ticket.id}>
                <div>
                  <strong>TP-{ticket.id} / {ticket.topic || "General"}</strong>
                  <small className="mono">
                    USER {ticket.user_id} / {ticket.first_name || ticket.username || "Telegram user"} / {ticket.status}
                  </small>
                  <small>{ticket.body}</small>
                </div>
                <button className="small-action" onClick={() => void openAdminTicket(ticket)} disabled={adminTicketPending}>
                  Open conversation
                </button>
                {ticket.status === "open" && (
                  <button
                    className="small-action"
                    onClick={() =>
                      post(
                        `/v1/admin/tickets/${ticket.id}`,
                        { status: "in_progress" },
                        `Ticket TP-${ticket.id} moved to in progress.`,
                      )
                    }
                  >
                    Take
                  </button>
                )}
                {ticket.status !== "closed" && (
                  <button
                    className="small-action"
                    onClick={() =>
                      post(
                        `/v1/admin/tickets/${ticket.id}`,
                        { status: "closed" },
                        `Ticket TP-${ticket.id} closed.`,
                      )
                    }
                  >
                    Close
                  </button>
                )}
              </div>
            ))
          ) : (
            <p>No support tickets.</p>
          )}
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">ACCOUNT OPERATIONS</span>
          <h2>Fund or reset a user</h2>
          <label className="amount-field" htmlFor={`${fundingFieldId}-user`}>Telegram user ID</label>
          <input
            id={`${fundingFieldId}-user`}
            value={target}
            aria-label="Telegram user ID"
            onChange={(e) => setTarget(e.target.value.replace(/\D/g, ""))}
            placeholder="Telegram user ID"
            inputMode="numeric"
          />
          <label className="amount-field" htmlFor={`${fundingFieldId}-amount`}>Credit amount in USD</label>
          <input
            id={`${fundingFieldId}-amount`}
            value={amount}
            aria-label="Credit amount in USD"
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Credit amount / USD"
            inputMode="decimal"
          />
          <label className="amount-field" htmlFor={`${fundingFieldId}-reason`}>Funding reason</label>
          <input
            id={`${fundingFieldId}-reason`}
            value={reason}
            aria-label="Funding reason"
            onChange={(e) => setReason(e.target.value)}
            placeholder="Funding reason"
          />
          <p className="security-feedback" role="status">
            {!/^[0-9]+$/.test(target)
              ? "Enter a numeric Telegram user ID to enable onboarding reset."
              : !validFunding
                ? "Funding also needs a positive USD amount and a clear reason."
                : "Funding will be recorded in the selected admin workspace."}
          </p>
          <div className="admin-actions">
            <button
              className="small-action"
              disabled={!validFunding || pendingAccountActions.fund}
              aria-busy={pendingAccountActions.fund}
              onClick={() =>
                void runAccountAction(
                  "fund",
                  "/v1/admin/fund",
                  { user_id: Number(target), amount: Number(amount), reason },
                  "User funded.",
                )
              }
            >
              {pendingAccountActions.fund ? "Funding…" : "Fund user"}
            </button>
            <button
              className="danger-action"
              disabled={!/^\d+$/.test(target) || pendingAccountActions.onboarding}
              aria-busy={pendingAccountActions.onboarding}
              onClick={() =>
                void runAccountAction(
                  "onboarding",
                  "/v1/admin/onboarding/reset",
                  { user_id: Number(target) },
                  "Onboarding reset.",
                )
              }
            >
              {pendingAccountActions.onboarding ? "Resetting…" : "Reset onboarding"}
            </button>
            <button
              className="small-action"
              disabled={environment !== "testnet" || pendingAccountActions.pilot}
              aria-busy={pendingAccountActions.pilot}
              onClick={() =>
                void runAccountAction(
                  "pilot",
                  "/v1/admin/demo/reissue",
                  {},
                  "Your isolated testnet pilot was reset.",
                )
              }
            >
              {pendingAccountActions.pilot ? "Resetting…" : "Reset my testnet pilot"}
            </button>
          </div>
          {environment !== "testnet" && <small className="mono">TESTNET PILOT RESET IS AVAILABLE ONLY IN THE TESTNET ADMIN WORKSPACE.</small>}
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">COMMUNITY EVENT CARDS</span>
          <h2>Dedicated activity feed</h2>
          <p>Posts confirmed activity to a dedicated group only. Treasury audit delivery remains separate; failed, pending, and internal events never publish.</p>
          <p className="mono">
            {admin.community_cards?.renderer?.ready ? "RENDERER READY" : "RENDERER UNAVAILABLE"} / {admin.community_cards?.config?.enabled ? "PUBLICATION ON" : "PUBLICATION OFF"} / {admin.community_cards?.config?.stress_test_presentation ? "DEMO STRESS FORMAT" : "TEST LABELS"}
          </p>
          <small>{admin.community_cards?.renderer?.reason || "Renderer status unavailable."}</small>
          <label className="amount-field">Dedicated Telegram group
            <input
              value={communityGroup}
              aria-label="Dedicated Telegram group ID or username for community cards"
              onChange={(event) => setCommunityGroup(event.target.value.trim())}
              placeholder="@communitygroup or -100…"
            />
          </label>
          <div className="admin-actions">
            <button
              className="small-action"
              disabled={!validCommunityGroup || isAdminActionPending("community:destination")}
              aria-busy={isAdminActionPending("community:destination")}
              onClick={() => void post("/v1/admin/community-cards", { group: communityGroup }, "Dedicated community group saved. Publication is off until checks pass.", "community:destination").then((saved) => {
                if (saved) setCommunityGroup(communityGroup);
              })}
            >
              {isAdminActionPending("community:destination") ? "Saving…" : "Save destination"}
            </button>
            <button
              className="small-action"
              disabled={!admin.community_cards?.config?.group || isAdminActionPending("community:verify")}
              aria-busy={isAdminActionPending("community:verify")}
              onClick={() => void post("/v1/admin/community-cards/verify", {}, "Telegram posting permission confirmed.", "community:verify")}
            >
              {isAdminActionPending("community:verify") ? "Checking…" : "Check permission"}
            </button>
            <button
              className={admin.community_cards?.config?.enabled ? "danger-action" : "primary-action"}
              disabled={isAdminActionPending("community:publication") || (!admin.community_cards?.config?.enabled && (!admin.community_cards?.config?.group || !admin.community_cards?.renderer?.ready))}
              aria-busy={isAdminActionPending("community:publication")}
              onClick={() => void post("/v1/admin/community-cards/enabled", { enabled: !admin.community_cards?.config?.enabled }, admin.community_cards?.config?.enabled ? "Community cards disabled." : "Community cards enabled.", "community:publication")}
            >
              {isAdminActionPending("community:publication") ? "Updating…" : admin.community_cards?.config?.enabled ? "Disable publication" : "Enable publication"}
            </button>
            <button
              className="small-action"
              disabled={!admin.community_cards?.config?.group || isAdminActionPending("community:presentation")}
              aria-busy={isAdminActionPending("community:presentation")}
              onClick={() => void post("/v1/admin/community-cards/stress-test-presentation", { enabled: !admin.community_cards?.config?.stress_test_presentation }, admin.community_cards?.config?.stress_test_presentation ? "Stress-test cards will show their test label." : "Stress-test cards will match customer cards in this dedicated demo group.", "community:presentation")}
            >
              {isAdminActionPending("community:presentation") ? "Updating…" : admin.community_cards?.config?.stress_test_presentation ? "Use test labels" : "Match customer cards"}
            </button>
            <button
              className="small-action"
              disabled={!admin.community_cards?.config?.enabled || !admin.community_cards?.renderer?.ready || isAdminActionPending("community:test")}
              aria-busy={isAdminActionPending("community:test")}
              onClick={() => void post("/v1/admin/community-cards/test", {}, "Test card queued for the dedicated group.", "community:test")}
            >
              {isAdminActionPending("community:test") ? "Queuing…" : "Send test card"}
            </button>
          </div>
          {!admin.community_cards?.config?.enabled && (
            <small className="mono">SET DESTINATION / CHECK TELEGRAM POSTING ACCESS / ENABLE PUBLICATION</small>
          )}
          <div className="admin-row">
            <div>
              <strong>{Number(admin.community_cards?.counts?.queued || 0) + Number(admin.community_cards?.counts?.retry || 0)} waiting / {Number(admin.community_cards?.counts?.sent || 0)} sent</strong>
              <small className="mono">{Number(admin.community_cards?.counts?.needs_review || 0)} NEED MANUAL REVIEW / DELIVERY IS SERIALIZED</small>
            </div>
          </div>
          {(admin.community_cards?.events || []).filter((event) => event.status === "needs_review").slice(0, 5).map((event) => (
            <div className="admin-row" key={event.id}>
              <div>
                <strong>{event.kind.replace(/_/g, " ")} / {event.id.slice(0, 8)}</strong>
                <small className="mono">ATTEMPTS {event.attempts} / {event.render_error || "delivery outcome needs review"}</small>
              </div>
              <button className="small-action" disabled={isAdminActionPending(`community:${event.id}:retry`)} aria-busy={isAdminActionPending(`community:${event.id}:retry`)} onClick={() => void post(`/v1/admin/community-cards/${event.id}/retry`, {}, "Card queued for an explicit retry.", `community:${event.id}:retry`)}>{isAdminActionPending(`community:${event.id}:retry`) ? "Retrying…" : "Retry"}</button>
            </div>
          ))}
          <small>Retry only after checking Telegram: an unknown send outcome can create a duplicate post. Group membership is managed through Telegram’s invite or community flow.</small>
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">AUTO-USER LOAD ACTIVITY</span>
          <h2>Staggered testnet activity</h2>
          <p>
            Import a UTF-8 <span className="mono">.csv</span>, <span className="mono">.tsv</span>, <span className="mono">.txt</span>, or <span className="mono">.json</span> name list. Plain text accepts one name per line; CSV/TSV accepts <span className="mono">first_name, username, user_ref</span>; JSON accepts names or name records.
          </p>
          <div className="admin-row">
            <div>
              <strong>Duplicates stay protected</strong>
              <small>Repeated names in this file or an earlier upload are skipped. Existing test accounts and their scheduled activity remain untouched.</small>
            </div>
          </div>
          <div className="admin-row">
            <div>
              <strong>Activity stays varied</strong>
              <small>Every run has a precomputed daily plan: 5–15 deposits per day, tapering to 2–3 near the end, with varied daytime slots. Follow-on top-ups, withdrawals, Flashbacks, and lifecycle actions continue after funding.</small>
            </div>
          </div>
          <p className="mono">TESTNET LEDGER ONLY / NO CHAIN DEPOSITS / NO CUSTOMER MESSAGES / TESTNET ACTIVITY CARDS ONLY</p>
          <label className="amount-field" htmlFor={autouserFileId}>Auto-user names file</label>
          <input ref={autouserFileRef} id={autouserFileId} type="file" accept=".csv,.tsv,.txt,.json,text/csv,text/tab-separated-values,text/plain,application/json" aria-label="Auto-user names file upload" onChange={(event) => setAutouserFile(event.target.files?.[0] || null)} />
          <label className="amount-field">Minimum testnet deposit in USD
            <input value={autouserMinimum} inputMode="decimal" onChange={(event) => setAutouserMinimum(event.target.value)} placeholder="Minimum / USD" />
          </label>
          <label className="amount-field">Maximum testnet deposit in USD
            <input value={autouserMaximum} inputMode="decimal" onChange={(event) => setAutouserMaximum(event.target.value)} placeholder="Maximum / USD" />
          </label>
          <label className="check-confirm">
            <input type="checkbox" checked={autouserConfirmed} onChange={(event) => setAutouserConfirmed(event.target.checked)} />
            I understand this schedules testnet-only deposit, withdrawal, and top-up activity—not real transfers.
          </label>
          <button className="primary-action" disabled={!autouserFile || autouserPending || !autouserConfirmed || Number(autouserMinimum) <= 0 || Number(autouserMaximum) < Number(autouserMinimum)} onClick={() => void submitAutouserRun()}>
            {autouserPending ? "Queuing activity run…" : "Queue activity run"}
          </button>
          <div className="admin-row">
            <div>
              <strong>{Number(admin.autousers?.totals?.scheduled_events || 0).toLocaleString()} events scheduled</strong>
              <small className="mono">{Number(admin.autousers?.totals?.completed_events || 0).toLocaleString()} money events complete / {Number(admin.autousers?.totals?.completed_actions || 0).toLocaleString()} lifecycle actions complete / {Number(admin.autousers?.totals?.completed_flashback_actions || 0).toLocaleString()} Flashback steps complete / {Number(admin.autousers?.totals?.blocked_events || 0).toLocaleString() + Number(admin.autousers?.totals?.blocked_actions || 0).toLocaleString()} waiting safely</small>
              {(admin.autousers?.forecast || []).length > 0 && <small className="mono">FULL PLAN: {admin.autousers?.forecast?.[0]?.date} → {admin.autousers?.forecast?.[(admin.autousers?.forecast?.length || 1) - 1]?.date} / {(admin.autousers?.forecast || []).length} ACTIVE DAYS</small>}
            </div>
          </div>
          {(admin.autousers?.forecast || []).slice(0, 14).map((day) => (
            <div className="admin-row" key={day.date}>
              <div>
                <strong>{day.date} / {Number(day.total || 0).toLocaleString()} predicted events</strong>
                <small className="mono">{Number(day.deposits || 0).toLocaleString()} deposits / {Number(day.withdrawals || 0).toLocaleString()} withdrawals / {Number(day.topups || 0).toLocaleString()} top-ups / {Number(day.flashbacks || 0).toLocaleString()} Flashback steps / {Number(day.lifecycle || 0).toLocaleString()} lifecycle steps</small>
              </div>
            </div>
          ))}
          {(admin.autousers?.runs || []).slice(0, 5).map((run) => (
            <div className="admin-row" key={run.id}>
              <div>
                <strong>{run.status === "paused" && !run.import_complete ? "importing" : run.status.replace("_", " ")} / {run.id.slice(0, 8)}</strong>
                <small className="mono">{run.status === "paused" && !run.import_complete ? `${Number(run.imported_accounts || 0).toLocaleString()}/${Number(run.imported_users || 0).toLocaleString()} accounts prepared / ${Number(run.pending_imports || 0).toLocaleString()} remaining` : `${Number(run.completed_events || 0).toLocaleString()} money events complete / ${Number(run.completed_actions || 0).toLocaleString()} lifecycle steps complete / ${Number(run.completed_flashback_actions || 0).toLocaleString()} Flashback steps complete / ${Number(run.scheduled_actions || 0).toLocaleString()} lifecycle steps queued / ${Number(run.active_event_bots || 0).toLocaleString()}/${Number(run.event_participants || 0).toLocaleString()} event bots active`}</small>
              </div>
              {run.status === "scheduled" && <button className="small-action" disabled={Boolean(autouserRunPending[`${run.id}:pause`])} aria-busy={Boolean(autouserRunPending[`${run.id}:pause`])} onClick={() => void updateAutouserRun(run.id, "pause")}>{autouserRunPending[`${run.id}:pause`] ? "Pausing…" : "Pause"}</button>}
              {run.status === "paused" && Boolean(run.import_complete) && <button className="small-action" disabled={Boolean(autouserRunPending[`${run.id}:resume`])} aria-busy={Boolean(autouserRunPending[`${run.id}:resume`])} onClick={() => void updateAutouserRun(run.id, "resume")}>{autouserRunPending[`${run.id}:resume`] ? "Resuming…" : "Resume"}</button>}
              {(run.status === "scheduled" || run.status === "paused") && <button className="small-action" disabled={Boolean(autouserRunPending[`${run.id}:cancel`])} aria-busy={Boolean(autouserRunPending[`${run.id}:cancel`])} onClick={() => void updateAutouserRun(run.id, "cancel")}>{autouserRunPending[`${run.id}:cancel`] ? "Cancelling…" : "Cancel"}</button>}
            </div>
          ))}
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">SETTINGS EDITOR</span>
          <h2>Runtime controls</h2>
          <select
            value={settingKey}
            aria-label="Runtime setting"
            onChange={(e) => setSettingKey(e.target.value)}
          >
            <option value="min_bot_investment_usd">Bot minimum</option>
            <option value="deposit_min_usd">Deposit minimum</option>
            <option value="withdraw_min_usd">Withdrawal minimum</option>
            <option value="demo_active_days">Demo duration</option>
            <option value="demo_conversion_percent">Demo trading-credit rate</option>
            <option value="community_url">Community link</option>
            <option value="onboarding_channel_enabled">Onboarding channel gate</option>
            <option value="onboarding_channel_id">Onboarding channel ID</option>
            <option value="onboarding_channel_url">Onboarding channel link</option>
            <option value="popup_ttl_seconds">Popup cleanup seconds</option>
            <option value="flashback_direction_config">Flashback Direction catalog (JSON)</option>
          </select>
          <input
            value={settingValue}
            aria-label="New runtime setting value"
            onChange={(e) => setSettingValue(e.target.value)}
            placeholder={settingKey === "flashback_direction_config" ? '{"version":1,"markets":[{"symbol":"BTC","enabled":true}],"schedule":[...]}' : "New value"}
          />
          <button
            className="primary-action"
            disabled={!settingValue.trim() || isAdminActionPending(`settings:${settingKey}`)}
            aria-busy={isAdminActionPending(`settings:${settingKey}`)}
            onClick={() =>
              void post(
                "/v1/admin/settings",
                { key: settingKey, value: settingValue },
                "Runtime setting saved.",
                `settings:${settingKey}`,
              )
            }
          >
            {isAdminActionPending(`settings:${settingKey}`) ? "Saving…" : "Save rule"}
          </button>
          {admin.settings.slice(0, 5).map((row) => (
            <div className="admin-row" key={row.key}>
              <strong>{row.key}</strong>
              <small className="mono">{row.value}</small>
            </div>
          ))}
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">FLASHBACK DIRECTION</span>
          <h2>Published market catalog</h2>
          <p>Enable only the reviewed Kraken USD pairs. The stored version, market, direction, return, and reference prices are fixed on each new contract; editing this catalog never changes an existing one.</p>
          <label className="amount-field" htmlFor="flashback-direction-config">Catalog and schedule</label>
          <textarea
            id="flashback-direction-config"
            value={flashbackDirectionConfig}
            aria-label="Flashback Direction catalog and schedule"
            onChange={(event) => setFlashbackDirectionConfig(event.target.value)}
            placeholder='{"version":1,"markets":[{"symbol":"BTC","pair":"XBTUSD","enabled":true}],"schedule":[...]}'
          />
          <button className="primary-action" disabled={!flashbackDirectionConfig.trim() || isAdminActionPending("flashback-direction:config")} aria-busy={isAdminActionPending("flashback-direction:config")} onClick={() => void saveFlashbackDirectionConfig()}>
            {isAdminActionPending("flashback-direction:config") ? "Saving catalog…" : "Save Direction catalog"}
          </button>
          <div className="section-heading"><h3>Settlement audit</h3><span>{flashbackDirectionHistory.length} latest</span></div>
          {flashbackDirectionHistory.length ? flashbackDirectionHistory.slice(0, 8).map((session) => (
            <div className="admin-row" key={session.id}>
              <div><strong>{session.market}/USD · {String(session.direction || "").toUpperCase()} · {session.state}</strong><small className="mono">{money(Number(session.allocation_usd || 0))} ENTRY / {money(Number(session.return_usd || 0))} RETURNED / {money(Number(session.user_net_usd || 0))} NET / {session.close_reason || "PENDING"}</small></div>
            </div>
          )) : <p className="mono">NO DIRECTION CONTRACTS HAVE SETTLED OR OPENED.</p>}
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">BROADCAST COMPOSER</span>
          <h2>Send a desk notice</h2>
          <label className="amount-field">Audience
            <select
              value={broadcastScope}
              aria-label="Broadcast audience"
              onChange={(event) => {
                setBroadcastScope(event.target.value as "all" | "user" | "channel" | "group");
                setBroadcastTarget("");
              }}
            >
              <option value="all">All bot users</option>
              <option value="user">One bot user</option>
              <option value="channel">Telegram channel</option>
              <option value="group">Telegram group</option>
            </select>
          </label>
          {broadcastNeedsTarget && (
            <label className="amount-field">
              {broadcastScope === "user" ? "Telegram user ID or @username" : `${broadcastScope === "channel" ? "Channel" : "Group"} @username or chat ID`}
              <input
                value={broadcastTarget}
                aria-label="Broadcast destination"
                onChange={(event) => setBroadcastTarget(event.target.value.trim())}
                placeholder={broadcastScope === "user" ? "Telegram user ID or @username" : "@destination or -100…"}
              />
            </label>
          )}
          <textarea
            value={broadcast}
            aria-label="Operational broadcast message"
            onChange={(e) => setBroadcast(e.target.value)}
            placeholder="Operational message"
            maxLength={3900}
          />
          {broadcastScope === "all" ? (
            <label className="amount-field">Confirm all-user delivery
              <input
                value={confirm}
                aria-label="Broadcast confirmation: type SEND ALL"
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Type SEND ALL to queue all users"
              />
            </label>
          ) : (
            <small className="mono">ONE DESTINATION / DELIVERY IS QUEUED AND RECORDED</small>
          )}
          <button
            className="primary-action"
            disabled={!canSendBroadcast}
            aria-busy={broadcastPending}
            onClick={() => void sendBroadcast()}
          >
            {broadcastPending ? "Queuing broadcast…" : "Queue broadcast"} <Send />
          </button>
          {(admin.broadcasts || []).slice(0, 3).map((row) => (
            <div className="admin-row" key={row.id}>
              <div>
                <strong>{row.scope === "all" ? "All bot users" : row.target || row.scope} / {row.status}</strong>
                <small className="mono">{Number(row.sent_count).toLocaleString()}/{Number(row.total_recipients).toLocaleString()} DELIVERED / {Number(row.failed_count).toLocaleString()} FAILED</small>
              </div>
            </div>
          ))}
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">ADMIN MEMBERS</span>
          <h2>Current access</h2>
          {admin.members.map((member) => (
            <div className="admin-row" key={member.user_id}>
              <strong>{member.first_name || "Telegram user"}</strong>
              <small className="mono">
                {member.username ? `@${member.username}` : member.user_id}
              </small>
            </div>
          ))}
          <input
            value={adminMember}
            aria-label="Administrator Telegram user ID or username"
            onChange={(event) => setAdminMember(event.target.value.trim())}
            placeholder="Telegram user ID or @username"
          />
          <small>
            A username must belong to someone who has already started the bot.
          </small>
          <button
            className="primary-action"
            disabled={!validTarget || isAdminActionPending("admin:member:add")}
            aria-busy={isAdminActionPending("admin:member:add")}
            onClick={() =>
              void post(
                "/v1/admin/members",
                { user_id: adminMember },
                "Administrator access updated.",
                "admin:member:add",
              ).then((saved) => {
                if (saved) setAdminMember("");
              })
            }
          >
            {isAdminActionPending("admin:member:add") ? "Adding…" : "Add administrator"} <ShieldCheck />
          </button>
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">APPROVED VAULT DESTINATIONS</span>
          <h2>Environment-scoped treasury routes</h2>
          <p>
            {environment.toUpperCase()} only. Saving a route here cannot modify
            the other workspace.
          </p>
          <select
            value={vaultChain}
            aria-label="Treasury vault network"
            onChange={(event) => setVaultChain(event.target.value)}
          >
            {admin.chains.map((chain) => (
              <option key={chain.id} value={chain.id}>
                {chain.name}
              </option>
            ))}
          </select>
          <select
            value={vaultAsset}
            aria-label="Treasury vault asset"
            onChange={(event) => setVaultAsset(event.target.value)}
          >
            <option value="USDT">USDT</option>
            <option value="USDC">USDC</option>
          </select>
          <input
            value={vaultAddress}
            aria-label="Approved treasury vault address"
            onChange={(event) =>
              setVaultAddress(event.target.value.replace(/\s/g, ""))
            }
            placeholder="Approved vault address"
          />
          <button
            className="primary-action"
            disabled={!vaultChain || !vaultAsset || !vaultAddress || vaultSavePending}
            aria-busy={vaultSavePending}
            onClick={async () => {
              if (vaultSavePending) return;
              setVaultSavePending(true);
              try {
                await request("/v1/admin/vaults", {
                  method: "POST",
                  body: JSON.stringify({
                    chain: vaultChain,
                    asset: vaultAsset,
                    address: vaultAddress,
                  }),
                });
                setVaultAddress("");
                const response = await request("/v1/admin/vaults");
                setVaults(Array.isArray(response.vaults) ? response.vaults : []);
                onNotice("Approved vault destination saved.");
              } catch (error) {
                onNotice(
                  error instanceof Error
                    ? error.message
                    : "Could not save vault destination.",
                );
              } finally {
                setVaultSavePending(false);
              }
            }}
          >
            {vaultSavePending ? "Saving…" : "Save vault route"} <ShieldCheck />
          </button>
          {vaults.length ? (
            vaults
              .filter((vault) => admin.chains.some((chain) => chain.id === vault.chain))
              .map((vault) => (
                <div className="admin-row" key={`${vault.chain}-${vault.asset}`}>
                  <div>
                    <strong>{vault.asset} / {vault.chain}</strong>
                    <small className="mono">{vault.address}</small>
                  </div>
                  <span className="status-chip running">approved</span>
                </div>
              ))
          ) : (
            <p>No approved routes in this workspace.</p>
          )}
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">SYNTHETIC CONTROLS</span>
          <h2>Live settlement and exposure</h2>
          <p>These controls apply to the shared engine. Mainnet and testnet balances remain isolated.</p>
          <div className="admin-row">
            <div><strong>Live settlement</strong><small className="mono">RESERVE REQUIRED</small></div>
            <button className="small-action" disabled>Unavailable</button>
          </div>
          <div className="admin-row">
            <div><strong>Global entry pause</strong><small className="mono">{syntheticConfig.global_trading_pause === "true" ? "PAUSED" : "OPEN"}</small></div>
            <button className={syntheticConfig.global_trading_pause === "true" ? "small-action" : "danger-action"} disabled={isAdminActionPending("synthetic-config:global_trading_pause")} aria-busy={isAdminActionPending("synthetic-config:global_trading_pause")} onClick={() => void saveSyntheticConfig({ global_trading_pause: syntheticConfig.global_trading_pause === "true" ? "false" : "true" })}>{isAdminActionPending("synthetic-config:global_trading_pause") ? "Updating…" : syntheticConfig.global_trading_pause === "true" ? "Resume" : "Pause"}</button>
          </div>
          <select value="PRINCIPAL" disabled>
            <option value="PRINCIPAL">Principal clearing</option>
          </select>
          {[
            ["per_user_exposure_cap_usd", "User exposure cap"],
            ["per_market_exposure_cap_usd", "Per-market cap"],
            ["global_exposure_cap_usd", "Global cap"],
            ["principal_liquidity_usd", "Principal liquidity"],
            ["fee_bps_explorer", "Explorer fee bps"],
            ["fee_bps_dedicated", "Dedicated fee bps"],
            ["fee_bps_whale", "Whale fee bps"],
          ].map(([key, label]) => (
            <div className="admin-row" key={key}>
              <strong>{label}</strong>
              <input value={syntheticConfig[key] || ""} inputMode="decimal" onChange={(event) => setSyntheticConfig((current) => ({ ...current, [key]: event.target.value }))} onBlur={() => syntheticConfig[key] && saveSyntheticConfig({ [key]: syntheticConfig[key] })} aria-label={label} />
            </div>
          ))}
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">ENGINE SETTLEMENTS</span>
          <h2>Environment-scoped results</h2>
          <p>Completed bot results recorded for this workspace.</p>
          {admin.engine.length ? (
            admin.engine.map((row) => (
              <div className="admin-row" key={row.event_key}>
                <div>
                  <strong>{row.bot_name || "Trading bot"}</strong>
                  <small className="mono">{row.event_key.slice(0, 14)}</small>
                </div>
                <div className="admin-row-value">
                  <strong>{money(row.net_realized)}</strong>
                  <small className="mono">{row.status}</small>
                </div>
              </div>
            ))
          ) : (
            <p>No engine settlements in this workspace.</p>
          )}
        </GradientPanel>
      </div>
    </div>
  );
}


