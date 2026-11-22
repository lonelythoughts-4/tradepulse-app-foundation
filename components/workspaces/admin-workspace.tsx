"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AccessibleDialog } from "../accessible-dialog";
import { DeskLocalized } from "../desk-language";
import { GradientPanel, Send, ShieldCheck, X } from "./shared-ui";
import { DeskApiError } from "../../lib/desk-api";
import { fundingFeedback, type FundingOutcome } from "../../lib/admin-funding-feedback";
import { getIdempotencyKeyForPayload } from "../../lib/idempotency-key";

const AUTOUSER_SCHEDULE_CONFLICT_MESSAGE =
  "This item changed while you were editing it. The latest schedule is loading.";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function parseAutoUserAmount(value: string) {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 0.01 && amount <= 100_000 ? amount : null;
}

type AutouserScheduleItem = {
  id: string;
  run_id: string;
  source: "event" | "action";
  kind: string;
  status: string;
  scheduled_at: number;
  local_time: string;
  amount_usd: number | null;
  amount_label: string;
  detail: string;
  editable: boolean;
};

type AutouserSchedule = {
  date: string;
  timezone: string;
  items: AutouserScheduleItem[];
};

function autouserScheduleLabel(item: AutouserScheduleItem) {
  const labels: Record<string, string> = {
    deposit: "Simulated Testnet deposit",
    flashback_start: "Flashback Direction entry",
    flashback_reveal: "Flashback Direction reveal",
  };
  return labels[item.kind] || item.kind.replace(/_/g, " ");
}

export type AdminOverview = {
  environment: string;
  members: Array<{ user_id: number; first_name?: string; username?: string }>;
  engine: Array<{
    event_key: string;
    bot_name: string;
    net_realized: number;
    status: string;
  }>;
  settings: Array<{ key: string; value: string }>;
  withdrawals: Array<{
    id: string;
    user_id: number;
    amount_usd: number;
    asset: string;
    chain: string;
    address?: string;
    status: string;
  }>;
  recovery_cases: Array<{
    id: string;
    status: string;
    asset: string;
    network: string;
    user_id: number;
  }>;
  tickets: Array<{
    id: string;
    user_id: number;
    topic?: string;
    body: string;
    status: string;
    username?: string;
    first_name?: string;
    updated_at?: number;
  }>;
  sweep_queue: Array<{
    id: string;
    asset: string;
    chain: string;
    status: string;
  }>;
  chains: Array<{ id: string; name: string; watcher_ready: boolean }>;
  autousers: {
    totals: { total_events?: number; scheduled_events?: number; completed_events?: number; blocked_events?: number; credited_usd?: number; total_actions?: number; scheduled_actions?: number; completed_actions?: number; blocked_actions?: number; completed_flashback_actions?: number; failed_imports?: number };
    runs: Array<{
      id: string;
      status: "scheduled" | "paused" | "cancelled" | "completed";
      import_complete?: number;
      min_amount_usd: number;
      max_amount_usd: number;
      imported_users: number;
      completed_events: number;
      scheduled_events: number;
      blocked_events?: number;
      imported_accounts?: number;
      pending_imports?: number;
      failed_imports?: number;
      next_scheduled_at?: number | null;
      completed_actions?: number;
      scheduled_actions?: number;
      blocked_actions?: number;
      completed_flashback_actions?: number;
      next_action_at?: number | null;
    }>;
    forecast: Array<{ date: string; day?: string; deposits: number; flashbacks?: number; total: number }>;
    issues?: Array<{ issue_type: "event" | "action" | "import"; issue_id: string; run_id: string; kind: string; attempts: number; last_error: string; status: string; user_id: number; created_at: number; retryable: number; issue_count: number }>;
    run_count?: number;
    run_limit?: number;
    run_offset?: number;
    timezone?: string;
  };
  community_cards: {
    config: { group: string; enabled: boolean; stress_test_presentation?: boolean };
    renderer: { ready: boolean; reason: string; version?: string };
    counts: Record<string, number>;
    events: Array<{
      id: string;
      kind: string;
      status: "queued" | "rendering" | "sending" | "sent" | "retry" | "needs_review";
      attempts: number;
      render_error?: string | null;
      telegram_message_id?: number | null;
      created_at: number;
      sent_at?: number | null;
    }>;
  };
  broadcasts: Array<{
    id: string;
    scope: "all" | "user" | "channel" | "group";
    target?: string;
    total_recipients: number;
    sent_count: number;
    failed_count: number;
    status: "queued" | "delivering" | "completed";
    created_at: number;
  }>;
  sweeps_enabled: boolean;
};

export function AdminWorkspace({
  admin,
  environment,
  request,
  reload,
  onEnvironment,
  onNotice,
  onLiveDeskEnabledChange,
}: {
  admin: NonNullable<AdminOverview>;
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
  onLiveDeskEnabledChange: (enabled: boolean) => void;
}) {
  const [target, setTarget] = useState("");
  const [onboardingTarget, setOnboardingTarget] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const fundingIdempotencyKeys = useRef(new Map<string, string>());
  const fundingFormRevision = useRef(0);
  const [settingKey, setSettingKey] = useState("deposit_min_usd");
  const [settingValue, setSettingValue] = useState("");
  const [broadcast, setBroadcast] = useState("");
  const [confirm, setConfirm] = useState("");
  const [broadcastScope, setBroadcastScope] = useState<"all" | "user" | "channel" | "group">("all");
  const [broadcastTarget, setBroadcastTarget] = useState("");
  const [broadcastPending, setBroadcastPending] = useState(false);
  const [adminMember, setAdminMember] = useState("");
  const [signerStatus, setSignerStatus] = useState<
    "checking" | "locked" | "unlocked" | "unavailable"
  >("checking");
  const [signerPin, setSignerPin] = useState("");
  const [signerPending, setSignerPending] = useState(false);
  const [signerError, setSignerError] = useState("");
  const signerSubmitting = useRef(false);
  const [signerStatusRefreshPending, setSignerStatusRefreshPending] = useState(false);
  const signerStatusRefreshSubmitting = useRef(false);
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
    row: AdminOverview["recovery_cases"][number];
    status: "verified" | "treasury_review" | "rejected";
    note: string;
    message: string;
  } | null>(null);
  const [pendingAccountActions, setPendingAccountActions] = useState<Record<"fund" | "onboarding" | "pilot", boolean>>({ fund: false, onboarding: false, pilot: false });
  const accountActionSubmitting = useRef<Record<"fund" | "onboarding" | "pilot", boolean>>({ fund: false, onboarding: false, pilot: false });
  const [fundingOutcome, setFundingOutcome] = useState<FundingOutcome>(null);
  const [autouserFile, setAutouserFile] = useState<File | null>(null);
  const [autouserMinimum, setAutouserMinimum] = useState("");
  const [autouserMaximum, setAutouserMaximum] = useState("");
  const [autouserConfirmed, setAutouserConfirmed] = useState(false);
  const [autouserPending, setAutouserPending] = useState(false);
  const [autouserError, setAutouserError] = useState("");
  const [autouserRunPending, setAutouserRunPending] = useState<Record<string, boolean>>({});
  const [autouserCancelRun, setAutouserCancelRun] = useState<AdminOverview["autousers"]["runs"][number] | null>(null);
  const [autouserPage, setAutouserPage] = useState<AdminOverview["autousers"] | null>(null);
  const [autouserPagePending, setAutouserPagePending] = useState<Record<string, boolean>>({});
  const [autouserScheduleDate, setAutouserScheduleDate] = useState<string | null>(null);
  const [autouserSchedule, setAutouserSchedule] = useState<AutouserSchedule | null>(null);
  const [autouserScheduleLoadPending, setAutouserScheduleLoadPending] = useState<Record<string, boolean>>({});
  const [autouserScheduleLoadError, setAutouserScheduleLoadError] = useState("");
  const [autouserScheduleRefreshError, setAutouserScheduleRefreshError] = useState("");
  const [autouserScheduleTimes, setAutouserScheduleTimes] = useState<Record<string, string>>({});
  const [autouserScheduleSavePending, setAutouserScheduleSavePending] = useState<Record<string, boolean>>({});
  const [autouserScheduleSaveErrors, setAutouserScheduleSaveErrors] = useState<Record<string, string>>({});
  const autouserScheduleRef = useRef<AutouserSchedule | null>(null);
  const autouserScheduleRefreshRef = useRef<(date: string, force?: boolean) => Promise<void>>(async () => {});
  const autouserScheduleRequest = useRef(0);
  const autouserScheduleLoads = useRef(new Map<string, number>());
  const autouserScheduleSaving = useRef(new Set<string>());
  const autouserScheduleRefreshQueued = useRef(new Set<string>());
  const autouserScheduleForceServerTimes = useRef(new Set<string>());
  const [adminHelpOpen, setAdminHelpOpen] = useState(false);
  const [adminTicket, setAdminTicket] = useState<(AdminOverview["tickets"][number] & { messages?: Array<{ id: number; author_role: "user" | "admin"; body: string; created_at: number }> }) | null>(null);
  const [adminTicketReply, setAdminTicketReply] = useState("");
  const [ticketStatusOverrides, setTicketStatusOverrides] = useState<Record<string, string>>({});
  const ticketStatusQueues = useRef(new Map<string, Promise<void>>());
  const ticketStatusVersions = useRef(new Map<string, number>());
  const ticketStatusPending = useRef(new Set<string>());
  const adminTicketRequest = useRef(0);
  const adminReconcileRunning = useRef(false);
  const adminReconcileQueued = useRef(false);
  const fundingFieldId = useId();
  const autouserFileId = useId();
  const autouserMinimumId = useId();
  const autouserMaximumId = useId();
  const autouserErrorId = useId();
  const autouserFileRef = useRef<HTMLInputElement>(null);
  const [withdrawalReview, setWithdrawalReview] = useState<{
    row: AdminOverview["withdrawals"][number];
    action: "approve" | "reject";
    environment: "mainnet" | "testnet";
  } | null>(null);
  const [withdrawalPending, setWithdrawalPending] = useState(false);
  const withdrawalSubmitting = useRef(false);
  const [withdrawalError, setWithdrawalError] = useState("");
  const scheduleReconcile = () => {
    if (adminReconcileRunning.current) {
      adminReconcileQueued.current = true;
      return;
    }
    adminReconcileRunning.current = true;
    void (async () => {
      do {
        adminReconcileQueued.current = false;
        try {
          await reload();
        } catch (error) {
          onNotice(
            error instanceof Error
              ? `The admin action completed, but its overview could not refresh: ${error.message}`
              : "The admin action completed, but its overview could not refresh.",
          );
        }
      } while (adminReconcileQueued.current);
      adminReconcileRunning.current = false;
    })();
  };
  useEffect(() => {
    setAutouserPage(null);
  }, [admin.autousers]);
  useEffect(() => {
    setTicketStatusOverrides((current) => {
      let changed = false;
      const next = { ...current };
      for (const ticket of admin.tickets) {
        if (next[ticket.id] === ticket.status) {
          delete next[ticket.id];
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [admin.tickets]);
  useEffect(() => {
    setTicketStatusOverrides({});
  }, [environment]);
  useEffect(() => {
    setWithdrawalReview(null);
    setWithdrawalError("");
  }, [environment]);
  const reviewWithdrawal = (row: AdminOverview["withdrawals"][number], action: "approve" | "reject") => {
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
      }, environment);
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
    let active = true;
    setSignerStatus("checking");
    setSignerError("");
    request("/v1/admin/signer", {}, environment)
      .then((response) => {
        if (!active) return;
        if (response.status !== "locked" && response.status !== "unlocked") {
          throw new Error("The signer returned an invalid status.");
        }
        setSignerStatus(response.status);
      })
      .catch((error) => {
        if (!active) return;
        setSignerStatus("unavailable");
        setSignerError(
          error instanceof Error
            ? error.message
            : "Protected signer status is unavailable.",
        );
      });
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
    return () => { active = false; };
  }, [environment]);
  const unlockSigner = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (signerSubmitting.current || !signerPin.trim()) return;
    signerSubmitting.current = true;
    setSignerPending(true);
    setSignerError("");
    const pin = signerPin;
    setSignerPin("");
    try {
      const response = await request(
        "/v1/admin/signer",
        {
          method: "POST",
          body: JSON.stringify({ action: "unlock", pin }),
        },
        environment,
        20_000,
      );
      if (response.status !== "unlocked") {
        throw new Error("The signer did not confirm that it was unlocked.");
      }
      setSignerStatus("unlocked");
      onNotice("Protected signer unlocked. Signer-backed operations can proceed.");
    } catch (error) {
      setSignerError(
        error instanceof Error
          ? error.message
          : "Could not unlock the protected signer.",
      );
    } finally {
      signerSubmitting.current = false;
      setSignerPending(false);
    }
  };
  const lockSigner = async () => {
    if (signerSubmitting.current) return;
    signerSubmitting.current = true;
    setSignerPending(true);
    setSignerError("");
    setSignerPin("");
    try {
      const response = await request(
        "/v1/admin/signer",
        {
          method: "POST",
          body: JSON.stringify({ action: "lock" }),
        },
        environment,
        20_000,
      );
      if (response.status !== "locked") {
        throw new Error("The signer did not confirm that it was locked.");
      }
      setSignerStatus("locked");
      onNotice("Protected signer locked.");
    } catch (error) {
      setSignerError(
        error instanceof Error ? error.message : "Could not lock the protected signer.",
      );
    } finally {
      signerSubmitting.current = false;
      setSignerPending(false);
    }
  };
  const refreshSignerStatus = async () => {
    if (signerStatusRefreshSubmitting.current) return;
    signerStatusRefreshSubmitting.current = true;
    setSignerStatusRefreshPending(true);
    setSignerStatus("checking");
    setSignerError("");
    try {
      const response = await request("/v1/admin/signer", {}, environment);
      if (response.status !== "locked" && response.status !== "unlocked") {
        throw new Error("The signer returned an invalid status.");
      }
      setSignerStatus(response.status);
    } catch (error) {
      setSignerStatus("unavailable");
      setSignerError(
        error instanceof Error
          ? error.message
          : "Protected signer status is unavailable.",
      );
    } finally {
      signerStatusRefreshSubmitting.current = false;
      setSignerStatusRefreshPending(false);
    }
  };
  const validTarget = /^@?[A-Za-z0-9_]{5,32}$/.test(adminMember) || /^\d+$/.test(adminMember);
  const validFunding = /^\d+$/.test(target) && Number(amount) > 0 && Boolean(reason.trim());
  const normalizedOnboardingTarget = onboardingTarget.trim();
  const validOnboardingTarget =
    /^\d+$/.test(normalizedOnboardingTarget) ||
    /^@?[A-Za-z][A-Za-z0-9_]{4,31}$/.test(normalizedOnboardingTarget);
  const fundingState = fundingFeedback(pendingAccountActions.fund, fundingOutcome);
  const adminTicketOpenKey = adminTicket ? `support:${adminTicket.id}:open` : "";
  const adminTicketReplyKey = adminTicket ? `support:${adminTicket.id}:reply` : "";
  const adminTicketLoading = Boolean(adminTicket && pendingAdminActions[adminTicketOpenKey]);
  const broadcastNeedsTarget = broadcastScope !== "all";
  const validBroadcastTarget = broadcastScope === "user"
    ? (/^\d+$/.test(broadcastTarget) || /^@[A-Za-z0-9_]{5,32}$/.test(broadcastTarget))
    : (/^@[A-Za-z0-9_]{5,32}$/.test(broadcastTarget) || /^-?\d{5,20}$/.test(broadcastTarget));
  const broadcastConfirmed = confirm.trim().toUpperCase() === "SEND ALL";
  const canSendBroadcast = Boolean(broadcast.trim()) && !broadcastPending && (!broadcastNeedsTarget || validBroadcastTarget) && (broadcastScope !== "all" || broadcastConfirmed);
  const isAdminActionPending = (key: string) => Boolean(pendingAdminActions[key]);
  const liveDeskEnabled = admin.settings.find((setting) => setting.key === "live_desk_enabled")?.value !== "false";
  const post = async (
    path: string,
    body: object,
    message: string,
    actionKey = path,
    onSuccess?: (response: Record<string, unknown>) => void,
    useResponseMessage = false,
  ) => {
    if (isAdminActionPending(actionKey)) return false;
    setPendingAdminActions((current) => ({ ...current, [actionKey]: true }));
    try {
      const response = await request(path, { method: "POST", body: JSON.stringify(body) });
      onSuccess?.(response);
      scheduleReconcile();
      onNotice(
        useResponseMessage && typeof response.message === "string"
          ? response.message
          : message,
      );
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
  const closeAdminTicket = () => {
    adminTicketRequest.current += 1;
    setAdminTicket(null);
  };
  const openAdminTicket = async (ticket: AdminOverview["tickets"][number]) => {
    const actionKey = `support:${ticket.id}:open`;
    if (isAdminActionPending(actionKey)) return;
    const requestId = ++adminTicketRequest.current;
    setAdminTicket({ ...ticket, messages: [] });
    setAdminTicketReply("");
    setPendingAdminActions((current) => ({ ...current, [actionKey]: true }));
    try {
      const response = await request(`/v1/admin/tickets/${ticket.id}`);
      if (requestId !== adminTicketRequest.current) return;
      setAdminTicket({ ...(response.ticket || ticket), messages: Array.isArray(response.messages) ? response.messages : [] });
    } catch (error) {
      if (requestId === adminTicketRequest.current) {
        setAdminTicket(null);
        onNotice(error instanceof Error ? error.message : "Could not load the support conversation.");
      }
    } finally {
      setPendingAdminActions((current) => {
        const next = { ...current };
        delete next[actionKey];
        return next;
      });
    }
  };
  const refreshAdminTicket = async (ticketId: string, requestId: number) => {
    try {
      const response = await request(`/v1/admin/tickets/${ticketId}`);
      if (requestId === adminTicketRequest.current && adminTicket?.id === ticketId) {
        setAdminTicket({
          ...(response.ticket || adminTicket),
          messages: Array.isArray(response.messages) ? response.messages : [],
        });
      }
    } catch (error) {
      if (requestId === adminTicketRequest.current && adminTicket?.id === ticketId) {
        onNotice(
          error instanceof Error
            ? `Reply sent, but the conversation could not refresh: ${error.message}`
            : "Reply sent, but the conversation could not refresh.",
        );
      }
    }
  };
  const updateTicketStatus = (
    ticket: AdminOverview["tickets"][number],
    status: "in_progress" | "closed",
  ) => {
    const action = status === "closed" ? "close" : "take";
    const actionKey = `support:${ticket.id}:${action}`;
    if (ticketStatusPending.current.has(actionKey)) return;
    ticketStatusPending.current.add(actionKey);
    const version = (ticketStatusVersions.current.get(ticket.id) || 0) + 1;
    ticketStatusVersions.current.set(ticket.id, version);
    setTicketStatusOverrides((current) => ({ ...current, [ticket.id]: status }));
    setAdminTicket((current) => current?.id === ticket.id ? { ...current, status } : current);
    setPendingAdminActions((current) => ({ ...current, [actionKey]: true }));
    const message = status === "closed"
      ? `Ticket TP-${ticket.id} closed.`
      : `Ticket TP-${ticket.id} moved to in progress.`;
    const previous = ticketStatusQueues.current.get(ticket.id) || Promise.resolve();
    const operation = previous.then(async () => {
      try {
        const response = await request(`/v1/admin/tickets/${ticket.id}`, {
          method: "POST",
          body: JSON.stringify({ status }),
        });
        const savedTicket = response.ticket;
        const savedStatus = typeof savedTicket === "object"
          && savedTicket !== null
          && "status" in savedTicket
          && typeof savedTicket.status === "string"
          ? savedTicket.status
          : status;
        if (ticketStatusVersions.current.get(ticket.id) === version) {
          setTicketStatusOverrides((current) => ({ ...current, [ticket.id]: savedStatus }));
          setAdminTicket((current) => current?.id === ticket.id
            ? { ...current, status: savedStatus }
            : current);
        }
        scheduleReconcile();
        onNotice(message);
      } catch (error) {
        if (ticketStatusVersions.current.get(ticket.id) === version) {
          setTicketStatusOverrides((current) => {
            const next = { ...current };
            delete next[ticket.id];
            return next;
          });
          setAdminTicket((current) => current?.id === ticket.id
            ? { ...current, status: ticket.status }
            : current);
        }
        onNotice(error instanceof Error ? error.message : "Ticket status update failed.");
        scheduleReconcile();
      } finally {
        ticketStatusPending.current.delete(actionKey);
        setPendingAdminActions((current) => {
          const next = { ...current };
          delete next[actionKey];
          return next;
        });
      }
    });
    ticketStatusQueues.current.set(ticket.id, operation);
    void operation.then(() => {
      if (ticketStatusQueues.current.get(ticket.id) === operation) {
        ticketStatusQueues.current.delete(ticket.id);
      }
    });
  };
  const runAccountAction = async (
    action: "fund" | "onboarding" | "pilot",
    path: string,
    body: object,
    message: string,
    useResponseMessage = false,
  ) => {
    if (accountActionSubmitting.current[action]) return;
    accountActionSubmitting.current[action] = true;
    setPendingAccountActions((current) => ({ ...current, [action]: true }));
    try {
      await post(path, body, message, path, undefined, useResponseMessage);
    } finally {
      accountActionSubmitting.current[action] = false;
      setPendingAccountActions((current) => ({ ...current, [action]: false }));
    }
  };
  const fundUser = async () => {
    if (accountActionSubmitting.current.fund) return;
    accountActionSubmitting.current.fund = true;
    setPendingAccountActions((current) => ({ ...current, fund: true }));
    const fundingPayload = {
      user_id: Number(target),
      amount: Number(amount),
      reason: reason.trim(),
    };
    const fingerprint = JSON.stringify([
      environment,
      fundingPayload.user_id,
      fundingPayload.amount,
      fundingPayload.reason,
    ]);
    const idempotencyKey = getIdempotencyKeyForPayload(
      fundingIdempotencyKeys.current,
      `admin-fund:${environment}`,
      fingerprint,
    );
    const formRevision = fundingFormRevision.current;
    try {
      const response = await request("/v1/admin/fund", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(fundingPayload),
      }, environment);
      const outcome: FundingOutcome = response.applied ? "applied" : "already-recorded";
      if (formRevision === fundingFormRevision.current) setFundingOutcome(outcome);
      fundingIdempotencyKeys.current.delete(fingerprint);
      scheduleReconcile();
      onNotice(response.message || (outcome === "applied" ? "Funding applied." : "An equivalent funding action was already recorded."));
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Funding could not be recorded.");
    } finally {
      accountActionSubmitting.current.fund = false;
      setPendingAccountActions((current) => ({ ...current, fund: false }));
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
  const reviewRecovery = (row: AdminOverview["recovery_cases"][number], status: "verified" | "treasury_review" | "rejected", note: string, message: string) => {
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
    if (autouserPending) return;
    const minimum = parseAutoUserAmount(autouserMinimum);
    const maximum = parseAutoUserAmount(autouserMaximum);
    if (!autouserFile) {
      setAutouserError("Choose a CSV, TSV, TXT, or JSON file no larger than 5 MB.");
      return;
    }
    if (!minimum || !maximum) {
      setAutouserError("Enter deposit amounts from $0.01 to $100,000.00, using no more than two decimal places.");
      return;
    }
    if (maximum < minimum) {
      setAutouserError("The maximum deposit must be at least the minimum deposit.");
      return;
    }
    if (!autouserConfirmed) {
      setAutouserError("Confirm that this run creates testnet-only simulated activity.");
      return;
    }
    setAutouserError("");
    setAutouserPending(true);
    try {
      const form = new FormData();
      form.append("file", autouserFile);
      form.append("min_amount", String(minimum));
      form.append("max_amount", String(maximum));
      form.append("confirmed", "true");
      // The API accepts only the durable import queue here. Account setup and
      // activity expansion happen independently on the server, so a large
      // upload never leaves this browser control stuck on a long request.
      const result = await request("/v1/admin/autousers/runs", { method: "POST", body: form }, "testnet", 60_000);
      setAutouserFile(null);
      if (autouserFileRef.current) autouserFileRef.current.value = "";
      onNotice(result.message || "Auto-user testnet deposit run scheduled.");
      scheduleReconcile();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Auto-user run could not be scheduled.";
      setAutouserError(message);
      onNotice(message);
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
      return true;
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Auto-user run could not be updated.");
      return false;
    } finally {
      setAutouserRunPending((current) => {
        const next = { ...current };
        delete next[actionKey];
        return next;
      });
    }
  };
  const retryAutouserIssue = async (issue: NonNullable<AdminOverview["autousers"]["issues"]>[number]) => {
    const issueKey = `retry:${issue.issue_type}:${issue.issue_id}`;
    if (autouserRunPending[issueKey]) return;
    setAutouserRunPending((current) => ({ ...current, [issueKey]: true }));
    try {
      const path = issue.issue_type === "import"
        ? `/v1/admin/autousers/runs/${encodeURIComponent(issue.run_id)}/retry-import`
        : `/v1/admin/autousers/issues/${issue.issue_type}/${encodeURIComponent(issue.issue_id)}/retry`;
      const result = await request(path, { method: "POST", body: JSON.stringify({}) }, "testnet");
      onNotice(result.message || "Auto-user issue queued for retry.");
      scheduleReconcile();
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Auto-user issue could not be retried.");
    } finally {
      setAutouserRunPending((current) => {
        const next = { ...current };
        delete next[issueKey];
        return next;
      });
    }
  };
  const loadAutouserPage = async (offset: number, direction: "previous" | "next") => {
    const pageKey = `page:${direction}`;
    if (autouserPagePending[pageKey]) return;
    setAutouserPagePending((current) => ({ ...current, [pageKey]: true }));
    try {
      const limit = Math.max(1, Number(admin.autousers?.run_limit || 12));
      const page = await request(`/v1/admin/autousers/runs?limit=${limit}&offset=${Math.max(0, offset)}`, {}, "testnet");
      setAutouserPage(page);
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Auto-user run history could not be loaded.");
    } finally {
      setAutouserPagePending((current) => {
        const next = { ...current };
        delete next[pageKey];
        return next;
      });
    }
  };
  const applyAutouserSchedule = (response: AutouserSchedule, preserveUnsavedTimes: boolean) => {
    if (preserveUnsavedTimes) {
      const previousTimes = new Map<string, string>();
      const forceServerTimeKeys = new Set<string>();
      for (const item of autouserScheduleRef.current?.items || []) {
        previousTimes.set(`${item.source}:${item.id}`, item.local_time);
      }
      for (const item of response.items) {
        const itemKey = `${item.source}:${item.id}`;
        if (autouserScheduleForceServerTimes.current.delete(itemKey)) {
          forceServerTimeKeys.add(itemKey);
        }
      }
      setAutouserScheduleTimes((current) => {
        const next: Record<string, string> = {};
        for (const item of response.items) {
          const itemKey = `${item.source}:${item.id}`;
          const currentTime = current[itemKey];
          const previousTime = previousTimes.get(itemKey);
          const forceServerTime = forceServerTimeKeys.has(itemKey);
          next[itemKey] = item.editable && !forceServerTime && currentTime !== undefined && currentTime !== previousTime
            ? currentTime
            : item.local_time;
        }
        return next;
      });
    } else {
      const times: Record<string, string> = {};
      for (const item of response.items) {
        times[`${item.source}:${item.id}`] = item.local_time;
      }
      setAutouserScheduleTimes(times);
    }
    autouserScheduleRef.current = response;
    setAutouserSchedule(response);
  };
  const closeAutouserSchedule = () => {
    const date = autouserScheduleDate;
    autouserScheduleRequest.current += 1;
    autouserScheduleRef.current = null;
    autouserScheduleForceServerTimes.current.clear();
    if (date) {
      autouserScheduleLoads.current.delete(date);
      autouserScheduleRefreshQueued.current.delete(date);
      setAutouserScheduleLoadPending((current) => {
        const next = { ...current };
        delete next[date];
        return next;
      });
    }
    setAutouserScheduleDate(null);
    setAutouserSchedule(null);
    setAutouserScheduleLoadError("");
    setAutouserScheduleRefreshError("");
  };
  const openAutouserSchedule = async (date: string) => {
    if (autouserScheduleLoads.current.has(date)) return;
    autouserScheduleRefreshQueued.current.delete(date);
    autouserScheduleForceServerTimes.current.clear();
    const requestId = ++autouserScheduleRequest.current;
    autouserScheduleLoads.current.set(date, requestId);
    setAutouserScheduleDate(date);
    autouserScheduleRef.current = null;
    setAutouserSchedule(null);
    setAutouserScheduleLoadError("");
    setAutouserScheduleRefreshError("");
    setAutouserScheduleTimes({});
    setAutouserScheduleSaveErrors({});
    setAutouserScheduleLoadPending((current) => ({ ...current, [date]: true }));
    try {
      const response = await request(
        `/v1/admin/autousers/schedule?date=${encodeURIComponent(date)}`,
        {},
        "testnet",
      ) as AutouserSchedule;
      if (
        response.date !== date ||
        response.timezone !== "Africa/Lagos" ||
        !Array.isArray(response.items)
      ) {
        throw new Error("The server returned an invalid schedule.");
      }
      if (requestId !== autouserScheduleRequest.current) return;
      applyAutouserSchedule(response, false);
    } catch (error) {
      if (requestId === autouserScheduleRequest.current) {
        setAutouserScheduleLoadError(
          error instanceof Error ? error.message : "The exact schedule could not be loaded.",
        );
      }
    } finally {
      if (autouserScheduleLoads.current.get(date) === requestId) {
        autouserScheduleLoads.current.delete(date);
        if (requestId === autouserScheduleRequest.current) {
          setAutouserScheduleLoadPending((current) => {
            const next = { ...current };
            delete next[date];
            return next;
          });
        }
      }
    }
  };
  const refreshAutouserSchedule = async (date: string, force = false) => {
    const requestId = autouserScheduleRequest.current;
    if (
      autouserScheduleDate !== date ||
      autouserScheduleRef.current?.date !== date
    ) return;
    if (autouserScheduleLoads.current.has(date) || autouserScheduleSaving.current.size > 0) {
      if (force) autouserScheduleRefreshQueued.current.add(date);
      return;
    }
    autouserScheduleRefreshQueued.current.delete(date);
    autouserScheduleLoads.current.set(date, requestId);
    try {
      const response = await request(
        `/v1/admin/autousers/schedule?date=${encodeURIComponent(date)}`,
        {},
        "testnet",
      ) as AutouserSchedule;
      if (
        response.date !== date ||
        response.timezone !== "Africa/Lagos" ||
        !Array.isArray(response.items)
      ) {
        throw new Error("The server returned an invalid schedule.");
      }
      if (requestId !== autouserScheduleRequest.current || autouserScheduleDate !== date) return;
      if (autouserScheduleSaving.current.size > 0) {
        autouserScheduleRefreshQueued.current.add(date);
        return;
      }
      applyAutouserSchedule(response, true);
      setAutouserScheduleRefreshError("");
      setAutouserScheduleSaveErrors((current) => {
        const next = { ...current };
        for (const [itemKey, message] of Object.entries(next)) {
          if (message === AUTOUSER_SCHEDULE_CONFLICT_MESSAGE) delete next[itemKey];
        }
        return next;
      });
    } catch (error) {
      if (requestId === autouserScheduleRequest.current && autouserScheduleDate === date) {
        setAutouserScheduleRefreshError(
          error instanceof Error ? error.message : "The schedule state could not be refreshed.",
        );
      }
    } finally {
      if (autouserScheduleLoads.current.get(date) === requestId) {
        autouserScheduleLoads.current.delete(date);
        if (autouserScheduleRefreshQueued.current.delete(date)) {
          void autouserScheduleRefreshRef.current(date, true);
        }
      }
    }
  };
  autouserScheduleRefreshRef.current = refreshAutouserSchedule;
  useEffect(() => {
    if (!autouserScheduleDate) return;
    const date = autouserScheduleDate;
    const interval = window.setInterval(() => {
      void autouserScheduleRefreshRef.current(date);
    }, 5_000);
    return () => window.clearInterval(interval);
  }, [autouserScheduleDate]);
  const saveAutouserScheduleTime = async (item: AutouserScheduleItem, localTime: string) => {
    const date = autouserScheduleDate;
    const schedule = autouserSchedule;
    const itemKey = `${item.source}:${item.id}`;
    if (!date || !schedule || !item.editable || autouserScheduleSaving.current.has(itemKey)) return;
    autouserScheduleSaving.current.add(itemKey);
    let refreshAfterSave = false;
    const requestId = autouserScheduleRequest.current;
    setAutouserScheduleSavePending((current) => ({ ...current, [itemKey]: true }));
    setAutouserScheduleSaveErrors((current) => {
      const next = { ...current };
      delete next[itemKey];
      return next;
    });
    try {
      await request(
        `/v1/admin/autousers/schedule/${item.source}/${encodeURIComponent(item.id)}/time`,
        {
          method: "POST",
          body: JSON.stringify({ run_id: item.run_id, date, time: localTime }),
        },
        "testnet",
      );
      refreshAfterSave = true;
      if (requestId === autouserScheduleRequest.current) {
        const currentSchedule = autouserScheduleRef.current;
        if (currentSchedule?.date === date) {
          applyAutouserSchedule({
            ...currentSchedule,
            items: currentSchedule.items.map((scheduledItem) =>
              scheduledItem.source === item.source && scheduledItem.id === item.id
                ? { ...scheduledItem, local_time: localTime }
                : scheduledItem,
            ),
          }, true);
        }
        setAutouserScheduleTimes((current) => ({ ...current, [itemKey]: localTime }));
      }
      scheduleReconcile();
      onNotice("Scheduled time updated.");
    } catch (error) {
      const conflict = error instanceof DeskApiError && error.status === 409;
      refreshAfterSave = conflict;
      if (conflict) {
        autouserScheduleForceServerTimes.current.add(itemKey);
        setAutouserScheduleTimes((current) => {
          const next = { ...current };
          delete next[itemKey];
          return next;
        });
      }
      setAutouserScheduleSaveErrors((current) => ({
        ...current,
        [itemKey]: conflict
          ? AUTOUSER_SCHEDULE_CONFLICT_MESSAGE
          : error instanceof Error
            ? error.message
            : "The scheduled time could not be updated.",
      }));
    } finally {
      autouserScheduleSaving.current.delete(itemKey);
      setAutouserScheduleSavePending((current) => {
        const next = { ...current };
        delete next[itemKey];
        return next;
      });
      if (date && requestId === autouserScheduleRequest.current) {
        void refreshAutouserSchedule(date, refreshAfterSave);
      }
    }
  };
  const confirmAutouserCancel = async () => {
    if (!autouserCancelRun || autouserRunPending[`${autouserCancelRun.id}:cancel`]) return;
    if (await updateAutouserRun(autouserCancelRun.id, "cancel")) setAutouserCancelRun(null);
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
  const autouserData = autouserPage || admin.autousers;
  const autouserRunOffset = Number(autouserData?.run_offset || 0);
  const autouserRunLimit = Math.max(1, Number(autouserData?.run_limit || 12));
  const autouserRunCount = Number(autouserData?.run_count ?? autouserData?.runs?.length ?? 0);
  const autouserRuns = autouserData?.runs || [];
  const autouserMinimumValue = parseAutoUserAmount(autouserMinimum);
  const autouserMaximumValue = parseAutoUserAmount(autouserMaximum);
  const autouserInputHint = autouserMinimum && autouserMaximum
    ? autouserMinimumValue === null || autouserMaximumValue === null
      ? "Use amounts from $0.01 to $100,000.00 with whole cents."
      : autouserMaximumValue < autouserMinimumValue
        ? "The maximum deposit must be at least the minimum deposit."
        : "Deposit amounts are valid. Upload a UTF-8 names file no larger than 5 MB."
    : "Deposit amounts must be $0.01–$100,000.00 with whole cents; names files must be UTF-8 and no larger than 5 MB.";
  const canQueueAutouserRun = Boolean(autouserFile) && !autouserPending && autouserConfirmed
    && autouserMinimumValue !== null && autouserMaximumValue !== null
    && autouserMaximumValue >= autouserMinimumValue;
  return (
    <DeskLocalized>
    <div className="admin-screen">
      {autouserScheduleDate && <AccessibleDialog
        className="autouser-schedule-dialog"
        label={`Scheduled testnet activity for ${autouserScheduleDate}`}
        onClose={closeAutouserSchedule}
      >
        <div className="autouser-schedule-header">
          <div className="autouser-schedule-title">
            <h2>Scheduled activity · {autouserScheduleDate}</h2>
            <p>These are testnet-only entries. Times use Africa/Lagos; you can change the time of day, but not the date, amount, or activity type. Items already processing or due within one minute are locked.</p>
          </div>
          <div className="autouser-schedule-header-actions">
            <span className="status-chip">TESTNET · AFRICA/LAGOS</span>
            <button className="small-action" onClick={closeAutouserSchedule}>Close</button>
          </div>
        </div>
        {autouserScheduleRefreshError && autouserSchedule && (
          <p className="security-feedback" role="status" aria-live="polite">
            Schedule state could not refresh. Showing the last loaded state; another refresh will retry automatically. {autouserScheduleRefreshError}
          </p>
        )}
        {autouserScheduleLoadPending[autouserScheduleDate] ? (
          <p role="status" aria-live="polite">Loading exact schedule…</p>
        ) : autouserScheduleLoadError ? (
          <div>
            <p className="security-feedback" role="alert">{autouserScheduleLoadError}</p>
            <button className="small-action" onClick={() => void openAutouserSchedule(autouserScheduleDate)}>Retry loading times</button>
          </div>
        ) : !autouserSchedule ? (
          <p role="alert">The schedule response was empty. Close this window and reopen the day to try again.</p>
        ) : autouserSchedule.items.length === 0 ? (
          <p role="status">No pending testnet activity remains on this day.</p>
        ) : (
          autouserSchedule.items.map((item) => {
            const itemKey = `${item.source}:${item.id}`;
            const label = autouserScheduleLabel(item);
            const timeValue = autouserScheduleTimes[itemKey] ?? item.local_time;
            const savePending = Boolean(autouserScheduleSavePending[itemKey]);
            return (
              <div className="autouser-schedule-item" key={itemKey}>
                <div className="admin-row autouser-schedule-row">
                  <div className="autouser-schedule-details">
                    <strong>
                      {label}
                      {item.amount_usd !== null && ` · ${item.amount_label} ${money(item.amount_usd)}`}
                    </strong>
                    <small className="mono">
                      {item.status === "processing"
                        ? "PROCESSING · TIME LOCKED"
                        : item.editable
                          ? "QUEUED · TIME EDITABLE"
                          : "QUEUED · LESS THAN ONE MINUTE TO RUN"}
                      {" / RUN "}{item.run_id.slice(0, 8)}
                      {item.detail && ` / ${item.detail}`}
                    </small>
                  </div>
                  <div className="autouser-schedule-edit">
                    <label className="autouser-schedule-time">
                      Time · {autouserSchedule.timezone}
                      <input
                        type="time"
                        step={60}
                        value={timeValue}
                        disabled={!item.editable || savePending}
                        aria-label={`Time in ${autouserSchedule.timezone} for ${label}`}
                        onChange={(event) => setAutouserScheduleTimes((current) => ({
                          ...current,
                          [itemKey]: event.target.value,
                        }))}
                      />
                    </label>
                    <button
                      className="small-action"
                      disabled={!item.editable || savePending || !timeValue || timeValue === item.local_time}
                      aria-busy={savePending}
                      onClick={() => void saveAutouserScheduleTime(item, timeValue)}
                    >
                      {savePending ? "Saving…" : "Save time"}
                    </button>
                  </div>
                </div>
                {autouserScheduleSaveErrors[itemKey] && (
                  <small className="security-feedback" role="alert">{autouserScheduleSaveErrors[itemKey]}</small>
                )}
              </div>
            );
          })
        )}
      </AccessibleDialog>}
      {autouserCancelRun && <AccessibleDialog label="Confirm auto-user run cancellation" onClose={() => setAutouserCancelRun(null)} dismissible={!autouserRunPending[`${autouserCancelRun.id}:cancel`]}>
        <span className="eyebrow">TESTNET RUN / DESTRUCTIVE ACTION</span>
        <h2>Cancel this auto-user run?</h2>
        <p>Run {autouserCancelRun.id.slice(0, 8)} will stop scheduling activity. Any open event positions will be handled by the existing safe-close process; already completed history remains unchanged.</p>
        <div className="admin-actions">
          <button className="danger-action" disabled={Boolean(autouserRunPending[`${autouserCancelRun.id}:cancel`])} aria-busy={Boolean(autouserRunPending[`${autouserCancelRun.id}:cancel`])} onClick={() => void confirmAutouserCancel()}>
            {autouserRunPending[`${autouserCancelRun.id}:cancel`] ? "Cancelling…" : "Confirm cancellation"}
          </button>
          <button className="ghost-action" disabled={Boolean(autouserRunPending[`${autouserCancelRun.id}:cancel`])} onClick={() => setAutouserCancelRun(null)}>Keep run</button>
        </div>
      </AccessibleDialog>}
      {adminHelpOpen && <AccessibleDialog label="Admin control room guide" onClose={() => setAdminHelpOpen(false)}>
        <h2>Control room guide</h2>
        <p>Use this workspace to review and act on the selected environment. Mainnet changes affect live operations; testnet changes affect isolated testing only.</p>
        <div className="admin-help-list">
          <div><strong>Movement queues</strong><span>Review confirmed deposits, withdrawal approvals, recovery cases, and their audit trail before acting.</span></div>
          <div><strong>Account operations</strong><span>Reset onboarding by Telegram ID or @username. Funding still requires a numeric ID; all actions apply only to the named account.</span></div>
          <div><strong>Runtime controls</strong><span>Settings update shared product rules. Save one value at a time and recheck the result before making another change.</span></div>
          <div><strong>Channel gate</strong><span>Onboarding requires membership in the fixed @TradememoLab official channel. The gate cannot be disabled or redirected.</span></div>
        </div>
        <button className="primary-action" onClick={() => setAdminHelpOpen(false)}>Close guide</button>
      </AccessibleDialog>}
      {adminTicket && <AccessibleDialog className="admin-ticket-dialog" label={`Support ticket TP-${adminTicket.id}`} onClose={closeAdminTicket}>
        <button className="modal-close" aria-label="Close" onClick={closeAdminTicket}><X /></button>
        <span className="eyebrow">SUPPORT CONVERSATION</span>
        <h2>TP-{adminTicket.id} · {adminTicket.topic || "General"}</h2>
        <p className="mono">USER {adminTicket.user_id} · {adminTicket.status.replace("_", " ")}</p>
        {adminTicketLoading ? (
          <p role="status" aria-live="polite">Loading conversation…</p>
        ) : (
          <div className="support-thread-messages" aria-label={`Messages for support ticket ${adminTicket.id}`}>
            {(adminTicket.messages || []).map((message) => <div className={`support-message ${message.author_role}`} key={message.id}>
              <strong>{message.author_role === "admin" ? "Admin" : "User"}</strong><p>{message.body}</p>
            </div>)}
          </div>
        )}
        {!adminTicketLoading && adminTicket.status !== "closed" && <>
          <label className="amount-field">Reply to user
            <textarea maxLength={1500} value={adminTicketReply} onChange={(event) => setAdminTicketReply(event.target.value)} placeholder="Write a clear, account-safe reply." rows={4} />
          </label>
          <button className="primary-action" disabled={adminTicketReply.trim().length < 2 || isAdminActionPending(adminTicketReplyKey)} aria-busy={isAdminActionPending(adminTicketReplyKey)} onClick={async () => {
            const ticketId = adminTicket.id;
            const actionKey = `support:${ticketId}:reply`;
            const reply = adminTicketReply.trim();
            if (isAdminActionPending(actionKey)) return;
            const requestId = adminTicketRequest.current;
            setPendingAdminActions((current) => ({ ...current, [actionKey]: true }));
            try {
              const response = await request(`/v1/admin/tickets/${ticketId}/messages`, {
                method: "POST",
                body: JSON.stringify({ message: reply }),
              });
              const savedTicket = response.ticket;
              const savedStatus = typeof savedTicket === "object"
                && savedTicket !== null
                && "status" in savedTicket
                && typeof savedTicket.status === "string"
                ? savedTicket.status
                : "in_progress";
              setAdminTicket((current) => requestId === adminTicketRequest.current && current?.id === ticketId
                ? {
                    ...current,
                    status: savedStatus,
                    messages: [
                      ...(current.messages || []),
                      { id: -Date.now(), author_role: "admin", body: reply, created_at: Math.floor(Date.now() / 1000) },
                    ],
                  }
                : current);
              if (requestId === adminTicketRequest.current) setAdminTicketReply("");
              onNotice(`Reply sent on TP-${ticketId}.`);
              scheduleReconcile();
              void refreshAdminTicket(ticketId, requestId);
            } catch (error) {
              onNotice(error instanceof Error ? error.message : "Could not send the support reply.");
            } finally {
              setPendingAdminActions((current) => {
                const next = { ...current };
                delete next[actionKey];
                return next;
              });
            }
          }}>{isAdminActionPending(adminTicketReplyKey) ? "Sending…" : "Send reply"} <Send /></button>
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
      <section className="admin-table signer-control" aria-labelledby="signer-control-title">
        <div className="signer-control-header">
          <div className="signer-control-title">
            <h3 id="signer-control-title">Protected signer</h3>
            <p>
              Unlocking keeps the signing key available in server memory for
              signer-backed operations. It does not send funds.
            </p>
          </div>
          <span
            className="signer-control-status"
            data-state={signerStatus}
            role="status"
            aria-live="polite"
          >
            {signerStatus === "checking"
              ? "Checking status…"
              : signerStatus === "unavailable"
                ? "Unavailable"
                : signerStatus === "unlocked"
                  ? "Unlocked"
                  : "Locked"}
          </span>
        </div>
        {signerStatus === "locked" && (
          <form className="signer-control-form" onSubmit={(event) => void unlockSigner(event)}>
            <label className="amount-field">
              Signer unlock PIN
              <input
                type="password"
                name="signer-unlock-pin"
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                maxLength={1024}
                value={signerPin}
                onChange={(event) => setSignerPin(event.target.value)}
                disabled={signerPending}
              />
            </label>
            <button
              className="primary-action"
              type="submit"
              disabled={signerPending || !signerPin.trim()}
              aria-busy={signerPending}
            >
              {signerPending ? "Unlocking signer…" : "Unlock signer"}
            </button>
          </form>
        )}
        {signerStatus === "unlocked" && (
          <div className="signer-control-unavailable">
            <p className="signer-control-note">
              The signer is unlocked in memory. Lock it as soon as this task is complete.
            </p>
            <button
              className="danger-action"
              type="button"
              disabled={signerPending}
              aria-busy={signerPending}
              onClick={() => void lockSigner()}
            >
              {signerPending ? "Locking signer…" : "Lock signer"}
            </button>
          </div>
        )}
        {signerStatus === "unavailable" && (
          <div className="signer-control-unavailable">
            <p className="signer-control-note" role="alert">
              {signerError || "The signer service is unavailable. Check the server service before retrying."}
            </p>
            <button
              className="text-action"
              type="button"
              disabled={signerStatusRefreshPending}
              aria-busy={signerStatusRefreshPending}
              onClick={() => void refreshSignerStatus()}
            >
              {signerStatusRefreshPending ? "Checking…" : "Retry signer status"}
            </button>
          </div>
        )}
        {signerError && signerStatus !== "unavailable" && (
          <p className="signer-control-note" role="alert">{signerError}</p>
        )}
      </section>
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
        <details className="admin-category" open>
          <summary><strong>Review queues</strong><span>Sweeps, withdrawals, recovery, and support</span></summary>
          <div className="admin-category-grid">
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
            admin.tickets.map((ticket) => {
              const status = ticketStatusOverrides[ticket.id] || ticket.status;
              const openKey = `support:${ticket.id}:open`;
              const takeKey = `support:${ticket.id}:take`;
              const closeKey = `support:${ticket.id}:close`;
              return (
              <div className="admin-row" key={ticket.id}>
                <div>
                  <strong>TP-{ticket.id} / {ticket.topic || "General"}</strong>
                  <small className="mono">
                    USER {ticket.user_id} / {ticket.first_name || ticket.username || "Telegram user"} / {status}
                  </small>
                  <small>{ticket.body}</small>
                </div>
                <button
                  className="small-action"
                  onClick={() => void openAdminTicket(ticket)}
                  disabled={isAdminActionPending(openKey)}
                  aria-busy={isAdminActionPending(openKey)}
                >
                  {isAdminActionPending(openKey) ? "Opening…" : "Open conversation"}
                </button>
                {(status === "open" || isAdminActionPending(takeKey)) && (
                  <button
                    className="small-action"
                    disabled={isAdminActionPending(takeKey)}
                    aria-busy={isAdminActionPending(takeKey)}
                    onClick={() => updateTicketStatus(ticket, "in_progress")}
                  >
                    {isAdminActionPending(takeKey) ? "Taking…" : "Take"}
                  </button>
                )}
                {(status !== "closed" || isAdminActionPending(closeKey)) && (
                  <button
                    className="small-action"
                    disabled={isAdminActionPending(closeKey)}
                    aria-busy={isAdminActionPending(closeKey)}
                    onClick={() => updateTicketStatus(ticket, "closed")}
                  >
                    {isAdminActionPending(closeKey) ? "Closing…" : "Close"}
                  </button>
                )}
              </div>
              );
            })
          ) : (
            <p>No support tickets.</p>
          )}
        </GradientPanel>
          </div>
        </details>
        <details className="admin-category">
          <summary><strong>Accounts and community</strong><span>Account actions, event cards, and testnet activity</span></summary>
          <div className="admin-category-grid">
        <GradientPanel className="admin-table">
          <span className="eyebrow">ACCOUNT OPERATIONS</span>
          <h2>Fund or reset onboarding</h2>
          <label className="amount-field" htmlFor={`${fundingFieldId}-user`}>Telegram user ID</label>
          <input
            id={`${fundingFieldId}-user`}
            value={target}
            aria-label="Telegram user ID"
            onChange={(e) => { fundingFormRevision.current += 1; setTarget(e.target.value.replace(/\D/g, "")); setFundingOutcome(null); }}
            placeholder="Telegram user ID"
            inputMode="numeric"
          />
          <label className="amount-field" htmlFor={`${fundingFieldId}-amount`}>Credit amount in USD</label>
          <input
            id={`${fundingFieldId}-amount`}
            value={amount}
            aria-label="Credit amount in USD"
            onChange={(e) => { fundingFormRevision.current += 1; setAmount(e.target.value); setFundingOutcome(null); }}
            placeholder="Credit amount / USD"
            inputMode="decimal"
          />
          <label className="amount-field" htmlFor={`${fundingFieldId}-reason`}>Funding reason</label>
          <input
            id={`${fundingFieldId}-reason`}
            value={reason}
            aria-label="Funding reason"
            onChange={(e) => { fundingFormRevision.current += 1; setReason(e.target.value); setFundingOutcome(null); }}
            placeholder="Funding reason"
          />
          <p className="security-feedback" role="status">
            {!/^[0-9]+$/.test(target)
              ? "Funding requires a numeric Telegram user ID."
              : !validFunding
                ? "Funding also needs a positive USD amount and a clear reason."
                : fundingState.status}
          </p>
          <label className="amount-field" htmlFor={`${fundingFieldId}-onboarding-user`}>User to reset · Telegram ID or @username</label>
          <input
            id={`${fundingFieldId}-onboarding-user`}
            value={onboardingTarget}
            aria-label="User to reset onboarding by Telegram ID or username"
            aria-describedby={`${fundingFieldId}-onboarding-help`}
            onChange={(event) => setOnboardingTarget(event.target.value)}
            placeholder="@username or numeric Telegram ID"
            autoCapitalize="none"
            autoComplete="off"
            maxLength={33}
          />
          <p className="security-feedback" id={`${fundingFieldId}-onboarding-help`} role="status">
            Resets channel verification, onboarding progress, and Terms acceptance, and invalidates existing browser sessions and sign-in links. Admin access, balances, security, and account history are retained.
          </p>
          <div className="admin-actions">
            <button
              className="small-action"
              disabled={!validFunding || pendingAccountActions.fund}
              aria-busy={pendingAccountActions.fund}
              onClick={() => void fundUser()}
            >
              {fundingState.buttonLabel}
            </button>
            <button
              className="danger-action"
              disabled={!validOnboardingTarget || pendingAccountActions.onboarding}
              aria-busy={pendingAccountActions.onboarding}
              onClick={() =>
                void runAccountAction(
                  "onboarding",
                  "/v1/admin/onboarding/reset",
                  { target: normalizedOnboardingTarget },
                  "Onboarding reset; existing browser sessions and sign-in links revoked.",
                  true,
                )
              }
            >
              {pendingAccountActions.onboarding ? "Resetting…" : "Reset onboarding"}
            </button>
          </div>
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">COMMUNITY EVENT CARDS</span>
          <h2>Dedicated activity feed</h2>
          <p>Posts confirmed activity to <strong>@TradememoLab</strong>. Deposits, top-ups, withdrawals, Flashback, and big-win cards all use topic 2.</p>
          <p className="mono">
            {admin.community_cards?.renderer?.ready ? "RENDERER READY" : "RENDERER UNAVAILABLE"} / {admin.community_cards?.config?.enabled ? "PUBLICATION ON" : "PUBLICATION OFF"} / {admin.community_cards?.config?.stress_test_presentation ? "DEMO STRESS FORMAT" : "TEST LABELS"}
          </p>
          <small>{admin.community_cards?.renderer?.reason || "Renderer status unavailable."}</small>
          <small className="mono">FIXED CHANNEL  @TradememoLab / FINANCIAL + FLASHBACK TOPIC 2</small>
          <div className="admin-actions">
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
              onClick={() => void post("/v1/admin/community-cards/stress-test-presentation", { enabled: !admin.community_cards?.config?.stress_test_presentation }, admin.community_cards?.config?.stress_test_presentation ? "Testnet cards will show their test label." : "Testnet cards will use the customer card presentation.", "community:presentation")}
            >
              {isAdminActionPending("community:presentation") ? "Updating…" : admin.community_cards?.config?.stress_test_presentation ? "Use test labels" : "Match customer cards"}
            </button>
            <button
              className="small-action"
              disabled={!admin.community_cards?.config?.group || !admin.community_cards?.renderer?.ready || isAdminActionPending("community:test")}
              aria-busy={isAdminActionPending("community:test")}
              onClick={() => void post("/v1/admin/community-cards/test", {}, "Simulated Testnet deposit card queued for topic 2.", "community:test")}
            >
              {isAdminActionPending("community:test") ? "Queuing…" : "Send simulated deposit test"}
            </button>
          </div>
          <small>One $1 simulated Testnet deposit-style card goes to topic 2. It creates no deposit intent, balance, or ledger change, and does not enable activity publication.</small>
          {!admin.community_cards?.config?.enabled && (
            <small className="mono">LIVE CUSTOMER ACTIVITY REMAINS OFF UNTIL PUBLICATION IS ENABLED</small>
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
          <h2>Simulated deposits + Flashback Direction</h2>
          <p>
            Import a UTF-8 <span className="mono">.csv</span>, <span className="mono">.tsv</span>, <span className="mono">.txt</span>, or <span className="mono">.json</span> name list. Every account and event in this section is synthetic Testnet data only; it cannot fund or message real customer accounts.
          </p>
          <div className="admin-row">
            <div>
              <strong>Duplicates stay protected</strong>
              <small>Names already in an active run are skipped. Cancelled or completed history stays intact; a fresh run creates new synthetic accounts.</small>
            </div>
          </div>
          <div className="admin-row">
            <div>
              <strong>Deposits fund Flashback Direction</strong>
              <small>Each account receives simulated Testnet deposits and eligible accounts run Flashback Direction. No real wallet funding or customer notification is created.</small>
            </div>
          </div>
          <p className="mono">TESTNET LEDGER ONLY / NO MAINNET FUNDING / NO REAL CUSTOMER MESSAGES / AUTO-USER ACTIVITY CARDS ONLY</p>
          <label className="amount-field" htmlFor={autouserFileId}>Auto-user names file</label>
          <input
            ref={autouserFileRef}
            id={autouserFileId}
            type="file"
            accept=".csv,.tsv,.txt,.json,text/csv,text/tab-separated-values,text/plain,application/json"
            aria-describedby={autouserError ? autouserErrorId : undefined}
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              if (!file) {
                setAutouserFile(null);
                return;
              }
              const extension = file.name.toLowerCase().split(".").pop();
              if (!extension || !["csv", "tsv", "txt", "json"].includes(extension)) {
                setAutouserFile(null);
                event.currentTarget.value = "";
                setAutouserError("Choose a CSV, TSV, TXT, or JSON file.");
                return;
              }
              if (file.size > 5 * 1024 * 1024) {
                setAutouserFile(null);
                event.currentTarget.value = "";
                setAutouserError("The names file is larger than 5 MB. Split it into smaller uploads.");
                return;
              }
              setAutouserFile(file);
              setAutouserError("");
            }}
          />
          <label className="amount-field" htmlFor={autouserMinimumId}>Minimum testnet deposit in USD
            <input id={autouserMinimumId} value={autouserMinimum} inputMode="decimal" aria-describedby={autouserError ? autouserErrorId : undefined} onChange={(event) => { setAutouserMinimum(event.target.value); setAutouserError(""); }} placeholder="Minimum / USD" />
          </label>
          <label className="amount-field" htmlFor={autouserMaximumId}>Maximum testnet deposit in USD
            <input id={autouserMaximumId} value={autouserMaximum} inputMode="decimal" aria-describedby={autouserError ? autouserErrorId : undefined} onChange={(event) => { setAutouserMaximum(event.target.value); setAutouserError(""); }} placeholder="Maximum / USD" />
          </label>
          <small>{autouserInputHint}</small>
          <label className="check-confirm">
            <input type="checkbox" checked={autouserConfirmed} onChange={(event) => { setAutouserConfirmed(event.target.checked); setAutouserError(""); }} />
            I understand this schedules simulated Testnet deposits and Flashback Direction only—not real transfers.
          </label>
          <button className="primary-action" disabled={!canQueueAutouserRun} aria-busy={autouserPending} onClick={() => void submitAutouserRun()}>
            {autouserPending ? "Queuing Testnet run…" : "Queue Testnet run"}
          </button>
          {autouserError && <small id={autouserErrorId} className="security-feedback" role="alert">{autouserError}</small>}
          <div className="admin-row">
            <div>
              <strong>{Number(autouserData?.totals?.scheduled_events || 0).toLocaleString()} simulated deposits queued</strong>
              <small className="mono">{Number(autouserData?.totals?.completed_events || 0).toLocaleString()} simulated funding events complete / {Number(autouserData?.totals?.completed_flashback_actions || 0).toLocaleString()} Flashback steps complete / {Number(autouserData?.totals?.blocked_events || 0).toLocaleString() + Number(autouserData?.totals?.blocked_actions || 0).toLocaleString()} waiting safely / {Number(autouserData?.totals?.failed_imports || 0).toLocaleString()} import rows needing retry</small>
              {(autouserData?.forecast || []).length > 0 && <small className="mono">UPCOMING ACTIVITY ({autouserData?.timezone || "Africa/Lagos"}): {autouserData?.forecast?.[0]?.date} → {autouserData?.forecast?.[Math.min((autouserData?.forecast?.length || 1) - 1, 13)]?.date} / {Math.min((autouserData?.forecast || []).length, 14)} ACTIVE DAYS SHOWN</small>}
            </div>
          </div>
          {(autouserData?.forecast || []).slice(0, 14).map((day) => (
            <div className="admin-row" key={day.date}>
              <div>
                <strong>{day.date} / {Number(day.total || 0).toLocaleString()} planned steps</strong>
                <small className="mono">{Number(day.deposits || 0).toLocaleString()} simulated deposits / {Number(day.flashbacks || 0).toLocaleString()} Flashback Direction steps</small>
              </div>
              <div className="admin-actions">
                {environment === "testnet" ? (
                  <button
                    className="small-action"
                    disabled={Boolean(autouserScheduleLoadPending[day.date])}
                    aria-busy={Boolean(autouserScheduleLoadPending[day.date])}
                    onClick={() => void openAutouserSchedule(day.date)}
                  >
                    {autouserScheduleLoadPending[day.date] ? "Loading times…" : "View exact times"}
                  </button>
                ) : (
                  <small className="mono">Switch to Testnet to view times</small>
                )}
              </div>
            </div>
          ))}
          <h3>Run history</h3>
          {autouserRuns.map((run) => (
            <div className="admin-row" key={run.id}>
              <div>
                <strong>{run.status === "paused" && !run.import_complete ? "importing" : run.status.replace("_", " ")} / {run.id.slice(0, 8)}</strong>
                <small className="mono">{run.status === "paused" && !run.import_complete ? `${Number(run.imported_accounts || 0).toLocaleString()}/${Number(run.imported_users || 0).toLocaleString()} accounts prepared / ${Number(run.pending_imports || 0).toLocaleString()} remaining / ${Number(run.failed_imports || 0).toLocaleString()} rows need retry` : `${Number(run.completed_events || 0).toLocaleString()} simulated funding events complete / ${Number(run.completed_flashback_actions || 0).toLocaleString()} Flashback steps complete / ${Number(run.scheduled_actions || 0).toLocaleString()} actions queued`}</small>
              </div>
              <div className="admin-actions">
                {run.status === "scheduled" && <button className="small-action" disabled={Boolean(autouserRunPending[`${run.id}:pause`])} aria-busy={Boolean(autouserRunPending[`${run.id}:pause`])} onClick={() => void updateAutouserRun(run.id, "pause")}>{autouserRunPending[`${run.id}:pause`] ? "Pausing…" : "Pause"}</button>}
                {run.status === "paused" && Boolean(run.import_complete) && <button className="small-action" disabled={Boolean(autouserRunPending[`${run.id}:resume`])} aria-busy={Boolean(autouserRunPending[`${run.id}:resume`])} onClick={() => void updateAutouserRun(run.id, "resume")}>{autouserRunPending[`${run.id}:resume`] ? "Resuming…" : "Resume"}</button>}
                {(run.status === "scheduled" || run.status === "paused") && <button className="small-action" disabled={Boolean(autouserRunPending[`${run.id}:cancel`])} onClick={() => setAutouserCancelRun(run)}>{autouserRunPending[`${run.id}:cancel`] ? "Cancelling…" : "Review cancel"}</button>}
              </div>
            </div>
          ))}
          <div className="admin-row">
            <small className="mono">{autouserRunCount === 0 ? "No auto-user runs yet." : `Showing ${autouserRunOffset + 1}–${Math.min(autouserRunOffset + autouserRuns.length, autouserRunCount)} of ${autouserRunCount} runs`}</small>
            <div className="admin-actions">
              <button className="small-action" disabled={autouserRunOffset <= 0 || Boolean(autouserPagePending["page:previous"])} aria-busy={Boolean(autouserPagePending["page:previous"])} onClick={() => void loadAutouserPage(Math.max(0, autouserRunOffset - autouserRunLimit), "previous")}>{autouserPagePending["page:previous"] ? "Loading…" : "Previous runs"}</button>
              <button className="small-action" disabled={autouserRunOffset + autouserRuns.length >= autouserRunCount || Boolean(autouserPagePending["page:next"])} aria-busy={Boolean(autouserPagePending["page:next"])} onClick={() => void loadAutouserPage(autouserRunOffset + autouserRunLimit, "next")}>{autouserPagePending["page:next"] ? "Loading…" : "More runs"}</button>
            </div>
          </div>
          {(autouserData?.issues || []).length > 0 && <>
            <h3>Auto-retry and blocked issues</h3>
            {(autouserData.issues || []).map((issue) => {
              const issueKey = `retry:${issue.issue_type}:${issue.issue_id}`;
              return <div className="admin-row" key={`${issue.issue_type}:${issue.issue_id}`}>
                <div>
                  <strong>{issue.kind.replace(/_/g, " ")} / run {issue.run_id.slice(0, 8)}{issue.issue_count > 1 ? ` / ${issue.issue_count} rows` : ""}</strong>
                  <small className="mono">{issue.retryable ? "READY FOR MANUAL RETRY" : "AUTOMATIC RETRY OR OPERATOR REVIEW"} / ATTEMPT {issue.attempts} / {issue.last_error}</small>
                </div>
                {Boolean(issue.retryable) && <button className="small-action" disabled={Boolean(autouserRunPending[issueKey])} aria-busy={Boolean(autouserRunPending[issueKey])} onClick={() => void retryAutouserIssue(issue)}>{autouserRunPending[issueKey] ? "Retrying…" : "Retry issue"}</button>}
              </div>;
            })}
          </>}
        </GradientPanel>
          </div>
        </details>
        <details className="admin-category">
          <summary><strong>System controls and activity</strong><span>Runtime settings, markets, notices, treasury, and settlements</span></summary>
          <div className="admin-category-grid">
        <GradientPanel className="admin-table">
          <span className="eyebrow">CUSTOMER NAVIGATION</span>
          <h2>Live Desk tab</h2>
          <p>Hide the Live Desk tab from desktop and mobile navigation while the feature is being updated. Existing alerts and saved data are unchanged.</p>
          <div className="admin-row">
            <div>
              <strong>Current visibility</strong>
              <small className="mono">{liveDeskEnabled ? "VISIBLE" : "HIDDEN"}</small>
            </div>
            <button
              className="small-action"
              disabled={isAdminActionPending("feature:live_desk_enabled")}
              aria-busy={isAdminActionPending("feature:live_desk_enabled")}
              onClick={() => {
                const nextEnabled = !liveDeskEnabled;
                void post(
                  "/v1/admin/settings",
                  { key: "live_desk_enabled", value: nextEnabled ? "true" : "false" },
                  `Live Desk tab ${nextEnabled ? "shown" : "hidden"}.`,
                  "feature:live_desk_enabled",
                  () => onLiveDeskEnabledChange(nextEnabled),
                );
              }}
            >
              {isAdminActionPending("feature:live_desk_enabled")
                ? liveDeskEnabled ? "Hiding Live Desk…" : "Showing Live Desk…"
                : liveDeskEnabled ? "Hide Live Desk tab" : "Show Live Desk tab"}
            </button>
          </div>
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
            <option value="community_url">Community link</option>
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
          <p>Broadcasts reach real customer accounts only. Imported Testnet/auto-user accounts are excluded from “All bot users.”</p>
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
        </details>
      </div>
    </div>
    </DeskLocalized>
  );
}
