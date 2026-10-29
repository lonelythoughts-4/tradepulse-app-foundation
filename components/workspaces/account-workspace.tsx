"use client";

import { useEffect, useRef, useState } from "react";
import { AccessibleDialog } from "../accessible-dialog";
import {
  avatarOptions,
  ChevronRight,
  GradientPanel,
  NavIcon,
  PulseAvatar,
  Settings,
  ShieldCheck,
  StateIcon,
  StateSwapIcon,
  Wallet,
  X,
  type AvatarId,
} from "./shared-ui";

export type AccountDashboard = {
  user: { first_name?: string; username?: string; tier: string; language_code?: LanguageCode; security_code_set?: boolean };
  notifications: Record<string, boolean>;
  whitelist: Array<{ id: string | number; nickname: string; chain: string; address: string; cooling_until?: number }>;
};

type LanguageCode = "en" | "ru" | "hi" | "es" | "it" | "zh" | "ja" | "ro";

const languages: Array<{ code: LanguageCode; label: string; flag: string }> = [
  { code: "en", label: "English", flag: "locale-en.svg" },
  { code: "ru", label: "Русский", flag: "locale-ru.svg" },
  { code: "hi", label: "हिन्दी", flag: "locale-hi.svg" },
  { code: "es", label: "Español", flag: "locale-es.svg" },
  { code: "it", label: "Italiano", flag: "locale-it.svg" },
  { code: "zh", label: "简体中文", flag: "locale-zh.svg" },
  { code: "ja", label: "日本語", flag: "locale-ja.svg" },
  { code: "ro", label: "Română", flag: "locale-ro.svg" },
];

export function AccountWorkspace({
  data,
  request,
  onNotice,
  avatarId = "orbit",
  onAvatarClick,
  onIdentityUtility,
  openNotificationsRequest = false,
  onNotificationsRequestHandled,
  onOpenHelp,
}: {
  data: AccountDashboard;
  request: (path: string, options?: RequestInit) => Promise<any>;
  onNotice: (message: string) => void;
  avatarId?: AvatarId;
  onAvatarClick?: () => void;
  onIdentityUtility?: () => void;
  openNotificationsRequest?: boolean;
  onNotificationsRequestHandled?: () => void;
  onOpenHelp?: () => void;
}) {
  const [modal, setModal] = useState<
    "" | "code" | "language" | "notifications" | "whitelist" | "reset"
  >("");
  const [code, setCode] = useState("");
  const [currentCode, setCurrentCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [chain, setChain] = useState("ERC20");
  const [nickname, setNickname] = useState("");
  const [address, setAddress] = useState("");
  const [notificationState, setNotificationState] = useState(data.notifications);
  const [securityCodeSet, setSecurityCodeSet] = useState(Boolean(data.user.security_code_set));
  const [language, setLanguage] = useState<LanguageCode>(data.user.language_code || "en");
  const [languageSaving, setLanguageSaving] = useState(false);
  const enabledNotificationCount = ["fills", "fees", "deposits", "hwm_breaks"].filter((key) => Boolean(notificationState[key])).length;
  const [notificationPending, setNotificationPending] = useState<Record<string, boolean>>({});
  const notificationRequestPending = useRef(new Set<string>());
  const [accountPending, setAccountPending] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<{ message: string; error: boolean } | null>(null);
  const modalPending = accountPending;
  useEffect(() => {
    setModalFeedback(null);
    if (modal === "code") {
      setCode("");
      setCurrentCode("");
      setConfirmCode("");
      setShowCode(false);
    }
  }, [modal]);
  useEffect(() => {
    setNotificationState(data.notifications);
  }, [data.notifications]);
  useEffect(() => {
    setSecurityCodeSet(Boolean(data.user.security_code_set));
  }, [data.user.security_code_set]);
  useEffect(() => {
    setLanguage(data.user.language_code || "en");
  }, [data.user.language_code]);
  useEffect(() => {
    if (!openNotificationsRequest) return;
    setModal("notifications");
    onNotificationsRequestHandled?.();
  }, [openNotificationsRequest, onNotificationsRequestHandled]);
  const updateNotification = async (key: string, label: string, enabled: boolean) => {
    if (notificationRequestPending.current.has(key)) return;
    notificationRequestPending.current.add(key);
    setModalFeedback(null);
    const next = !enabled;
    setNotificationState((current) => ({ ...current, [key]: next }));
    setNotificationPending((current) => ({ ...current, [key]: true }));
    try {
      const result = await request("/v1/account/notifications", {
        method: "POST",
        body: JSON.stringify({ name: key, enabled: next }),
      });
      if (result.notifications && typeof result.notifications === "object") {
        setNotificationState((current) => ({ ...current, [key]: Boolean(result.notifications[key]) }));
      }
      const message = `${label} notification ${next ? "enabled" : "disabled"}.`;
      setModalFeedback({ message, error: false });
      onNotice(message);
    } catch (error) {
      setNotificationState((current) => ({ ...current, [key]: enabled }));
      const message = error instanceof Error ? error.message : "Notification setting could not be updated.";
      setModalFeedback({ message, error: true });
      onNotice(message);
    } finally {
      notificationRequestPending.current.delete(key);
      setNotificationPending((current) => {
        const remaining = { ...current };
        delete remaining[key];
        return remaining;
      });
    }
  };
  const chooseLanguage = async (next: LanguageCode) => {
    if (next === language || languageSaving) return;
    setLanguageSaving(true);
    try {
      await request("/v1/account/language", { method: "POST", body: JSON.stringify({ language_code: next }) });
      setLanguage(next);
      onNotice("Language preference saved.");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Language preference could not be saved.");
    } finally {
      setLanguageSaving(false);
    }
  };
  const initials = (data.user.first_name || data.user.username || "U")
    .slice(0, 1)
    .toUpperCase();
  const post = async (
    path: string,
    body: object,
    message: string,
    closeModal = true,
  ): Promise<boolean> => {
    if (accountPending) return false;
    setAccountPending(true);
    setModalFeedback(null);
    try {
      await request(path, { method: "POST", body: JSON.stringify(body) });
      setModalFeedback({ message, error: false });
      onNotice(message);
      // Account controls confirm their own result in this modal. Do not make
      // a security or preference save trigger a full desk refresh and delay
      // the next interaction.
      if (closeModal) setModal("");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Action could not be completed.";
      setModalFeedback({ message, error: true });
      onNotice(message);
      return false;
    } finally {
      setAccountPending(false);
    }
  };
  return (
    <div className="account-screen">
      <div className="screen-title">
        <div>
          <h2>Account settings</h2>
        </div>
        <div className="security-chip">
          <StateIcon name="lock" /> {securityCodeSet ? "CODE SET" : "SET CODE"}
        </div>
      </div>
      <GradientPanel className="profile-card">
        <button className="profile-avatar-button" type="button" onClick={onAvatarClick} aria-label="Review desk identity">
          <PulseAvatar id={avatarId} initials={initials} />
        </button>
        <div>
          <strong>{data.user.first_name || "Telegram user"}</strong>
          <small>{data.user.username ? `@${data.user.username} · ${data.user.tier}` : data.user.tier}</small>
        </div>
        <button className="profile-code-status" type="button" onClick={() => setModal("code")}>
          {securityCodeSet ? "Security code set" : "Set security code"}
          <ChevronRight />
        </button>
      </GradientPanel>
      <div className="account-actions">
        <button className="account-action" onClick={onIdentityUtility || onAvatarClick}>
          <span><PulseAvatar id={avatarId} initials={initials} /></span>
          <div>
            <strong>Desk identity · {avatarOptions.find((option) => option.id === avatarId)?.name}</strong>
            <small>{avatarOptions.find((option) => option.id === avatarId)?.utility} · identity treatment only</small>
          </div>
          <ChevronRight />
        </button>
        <button className="account-action" onClick={() => setModal("code")}>
          <span>
            <ShieldCheck />
          </span>
          <div>
            <strong>Withdrawal security code</strong>
            <small>{securityCodeSet ? "Change code" : "Set code before withdrawing"}</small>
          </div>
          <ChevronRight />
        </button>
        <button className="account-action" onClick={() => setModal("language")}>
          <span><Settings /></span>
          <div>
            <strong>Language preference</strong>
            <small>{languages.find((item) => item.code === language)?.label || "English"}</small>
          </div>
          <ChevronRight />
        </button>
        <button
          className="account-action"
          onClick={() => setModal("notifications")}
        >
          <span>
            <StateSwapIcon
              name={
                enabledNotificationCount > 0
                  ? "bell"
                  : "bell-off"
              }
              swapKey={
                enabledNotificationCount > 0
                  ? "notifications-on"
                  : "notifications-off"
              }
            />
          </span>
          <div>
            <strong>Notifications</strong>
            <small>
              {enabledNotificationCount} of 4 preferences enabled
            </small>
          </div>
          <ChevronRight />
        </button>
        <button
          className="account-action"
          onClick={() => setModal("whitelist")}
        >
          <span>
            <Wallet />
          </span>
          <div>
            <strong>Withdrawal whitelist</strong>
            <small>Manage trusted withdrawal addresses</small>
          </div>
          <ChevronRight />
        </button>
        <button className="account-action" onClick={onOpenHelp}>
          <span>
            <NavIcon name="help" />
          </span>
          <div>
            <strong>Help & support</strong>
            <small>Get account help</small>
          </div>
          <ChevronRight />
        </button>
        <button
          className="account-action danger-row"
          onClick={() => setModal("reset")}
        >
          <span>
            <Settings />
          </span>
          <div>
            <strong>Reset desk preferences</strong>
            <small>Personal settings only</small>
          </div>
          <ChevronRight />
        </button>
      </div>
      {modal && (
        <AccessibleDialog
          className="account-modal"
          label={{ code: securityCodeSet ? "Change security code" : "Set security code", language: "Language preference", notifications: "Notification preferences", whitelist: "Withdrawal whitelist", reset: "Reset desk preferences" }[modal]}
          onClose={() => setModal("")}
          dismissible={!modalPending}
        >
            <button
              className="modal-close"
              aria-label="Close"
              disabled={modalPending}
              onClick={() => setModal("")}
            >
              <X />
            </button>
            {modalFeedback && (
              <p className={modalFeedback.error ? "security-feedback" : undefined} role={modalFeedback.error ? "alert" : "status"}>
                {modalFeedback.message}
              </p>
            )}
            {modal === "code" && (
              <>
                <img
                  src="/illustrations/security-key.png"
                  alt="Security key"
                  className="security-key-art"
                  decoding="async"
                />
                <span className="eyebrow">SECURITY / WITHDRAWALS</span>
                <h2>{securityCodeSet ? "Change security code" : "Set security code"}</h2>
                <p>
                  {securityCodeSet
                    ? "Confirm your current code, then choose and confirm a new one. Never share either code with support or an administrator."
                    : "Create and confirm a six-digit code required to request a withdrawal. Never share it with support or an administrator."}
                </p>
                {securityCodeSet && (
                  <label className="amount-field">
                    <span>1 · CURRENT CODE</span>
                    <div className="secure-code-field">
                      <input
                        type={showCode ? "text" : "password"}
                        value={currentCode}
                        onChange={(event) => setCurrentCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                        inputMode="numeric"
                        autoComplete="current-password"
                        placeholder="••••••"
                      />
                    </div>
                  </label>
                )}
                <label className="amount-field">
                  <span>{securityCodeSet ? "2 · NEW CODE" : "1 · SIX-DIGIT CODE"}</span>
                  <div className="secure-code-field">
                    <input
                      type={showCode ? "text" : "password"}
                      value={code}
                      onChange={(event) =>
                        setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      inputMode="numeric"
                      autoComplete="new-password"
                      placeholder="••••••"
                    />
                    <button
                      type="button"
                      className="code-visibility"
                      aria-label={showCode ? "Hide security code" : "Show security code"}
                      onClick={() => setShowCode((value) => !value)}
                    >
                      <StateSwapIcon
                        name={showCode ? "eye-off" : "eye"}
                        swapKey={showCode ? "code-visible" : "code-hidden"}
                      />
                    </button>
                  </div>
                </label>
                <label className="amount-field">
                  <span>{securityCodeSet ? "3 · CONFIRM NEW CODE" : "2 · CONFIRM CODE"}</span>
                  <div className="secure-code-field">
                    <input
                      type={showCode ? "text" : "password"}
                      value={confirmCode}
                      onChange={(event) => setConfirmCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      inputMode="numeric"
                      autoComplete="new-password"
                      placeholder="••••••"
                    />
                  </div>
                </label>
                <button
                  className="primary-action"
                  disabled={code.length !== 6 || confirmCode !== code || (securityCodeSet && currentCode.length !== 6) || accountPending}
                  aria-busy={accountPending}
                  onClick={async () => {
                    if (code !== confirmCode) {
                      setModalFeedback({ message: "New code and confirmation must match.", error: true });
                      return;
                    }
                    const saved = await post(
                      "/v1/account/security-code",
                      securityCodeSet ? { code, current_code: currentCode } : { code },
                      securityCodeSet ? "Withdrawal security code changed." : "Withdrawal security code saved.",
                    );
                    if (saved) setSecurityCodeSet(true);
                  }}
                >
                  {accountPending ? "Saving…" : securityCodeSet ? "Confirm code change" : "Save security code"} <ShieldCheck />
                </button>
              </>
            )}
            {modal === "language" && (
              <>
                <h2>Language preference</h2>
                <p>Choose the language used for TradePulse messages and future desk activation screens.</p>
                <fieldset className="activation-languages account-language-options" aria-label="Choose language">
                  <div className="language-options">
                    {languages.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        className={`language-option ${language === item.code ? "selected" : ""}`}
                        aria-pressed={language === item.code}
                        disabled={languageSaving}
                        onClick={() => void chooseLanguage(item.code)}
                      >
                        <img className="language-flag" src={`/icons/${item.flag}`} alt="" aria-hidden="true" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              </>
            )}
            {modal === "notifications" && (
              <>
                <span className="eyebrow">ACCOUNT / NOTIFICATIONS</span>
                <h2>Telegram notification preferences</h2>
                <p>These preferences control the account alerts TradePulse sends through Telegram. Required service notices may still be sent.</p>
                  {[
                  ["fills", "Order executions"],
                  ["fees", "Fees charged"],
                  ["deposits", "Deposits"],
                  ["hwm_breaks", "New profit high (high-water mark)"],
                ].map(([key, label]) => {
                  const enabled = Boolean(notificationState[key]);
                  return (
                  <label className="toggle-row" key={key}>
                    <span>
                      {label}
                      <small>{notificationPending[key] ? "Updating…" : "Telegram delivery"}</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={Boolean(notificationPending[key])}
                      aria-busy={Boolean(notificationPending[key])}
                      onChange={() => void updateNotification(key, label, enabled)}
                    />
                    <StateSwapIcon
                      name={enabled ? "bell" : "bell-off"}
                      swapKey={`${key}-${notificationPending[key] ? "saving" : enabled ? "on" : "off"}`}
                      className="notification-toggle-icon"
                    />
                  </label>
                  );
                })}
              </>
            )}
            {modal === "whitelist" && (
              <>
                <span className="eyebrow">WALLET / DESTINATIONS</span>
                <h2>Withdrawal whitelist</h2>
                <p>
                  Save a trusted destination. Always verify the entire address
                  before a withdrawal.
                </p>
                {data.whitelist.length ? (
                  data.whitelist.map((route) => {
                    const cooling =
                      Number(route.cooling_until || 0) * 1000 > Date.now();
                    return (
                      <div className="whitelist-item" key={route.id}>
                        <ShieldCheck />
                        <div>
                          <strong>{route.nickname}</strong>
                          <small>
                            {route.chain} · {route.address}
                          </small>
                        </div>
                        <span
                          className={`status-chip ${cooling ? "paused" : "running"}`}
                        >
                          {cooling ? "cooling" : "ready"}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-wallet-state">
                    <strong>No saved destinations</strong>
                    <small>Add a trusted withdrawal destination below.</small>
                  </div>
                )}
                <label className="amount-field">
                  <span>NETWORK</span>
                  <select
                    value={chain}
                    onChange={(event) => setChain(event.target.value)}
                  >
                    <option value="ERC20">Ethereum</option>
                    <option value="BEP20">BNB Chain</option>
                    <option value="BASE">Base</option>
                    <option value="ARBITRUM">Arbitrum</option>
                    <option value="POLYGON">Polygon</option>
                  </select>
                </label>
                <label className="amount-field">
                  <span>DESTINATION ADDRESS</span>
                  <input
                    value={address}
                    onChange={(event) =>
                      setAddress(event.target.value.replace(/\s/g, ""))
                    }
                    placeholder="Full wallet address"
                  />
                </label>
                <label className="amount-field">
                  <span>ROUTE LABEL</span>
                  <input
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    placeholder="e.g. Personal wallet"
                  />
                </label>
                <button
                  className="primary-action"
                  disabled={!address || !nickname.trim() || accountPending}
                  aria-busy={accountPending}
                  onClick={() =>
                    post(
                      "/v1/account/whitelist",
                      { chain, nickname, address },
                      "Destination saved with the configured cooling period.",
                    )
                  }
                >
                  {accountPending ? "Saving…" : "Save destination"} <ShieldCheck />
                </button>
              </>
            )}
            {modal === "reset" && (
              <>
                <span className="eyebrow">DESK RESET</span>
                <h2>Reset desk preferences?</h2>
                <p>
                  This clears personal desk preferences and alerts only. It
                  cannot change your balance, bots, deposits, withdrawals,
                  security code, trial history, or demo trading credit.
                </p>
                <button
                  className="danger-action"
                  disabled={accountPending}
                  aria-busy={accountPending}
                  onClick={() =>
                    post(
                      "/v1/account/reset",
                      {},
                      "Desk preferences reset. Financial records remain intact.",
                    )
                  }
                >
                  {accountPending ? "Resetting…" : "Reset preferences"} <X />
                </button>
                <button className="ghost-action" disabled={accountPending} onClick={() => setModal("")}>
                  Keep my settings
                </button>
              </>
            )}
        </AccessibleDialog>
      )}
    </div>
  );
}
