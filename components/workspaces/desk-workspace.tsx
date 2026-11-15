"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { WorkspaceDashboard } from "./workspace-dashboard";
import { DeskLocalized } from "../desk-language";
import { Bell, GradientPanel, PulseMark, StateIcon, X } from "./shared-ui";

export function DeskWorkspace({
  data,
  request,
  reload,
  onNotice,
}: {
  data: WorkspaceDashboard;
  request: (path: string, options?: RequestInit, environment?: "mainnet" | "testnet", timeoutMs?: number) => Promise<any>;
  reload: () => Promise<void>;
  onNotice: (message: string) => void;
}) {
  const selection = useMemo(() => {
    const records = [
      data.memecoin?.authorization,
      data.memecoin?.demo_authorization,
    ];
    for (const record of records) {
      try {
        const settings = JSON.parse(record?.settings_json || "{}") as {
          assets?: unknown;
          cadence_seconds?: unknown;
          leverage?: unknown;
          auto_enabled?: unknown;
          include_trench?: unknown;
        };
        const assets = Array.isArray(settings.assets)
          ? settings.assets.filter((asset): asset is string => typeof asset === "string" && asset.trim().length > 0)
          : [];
        if (assets.length) {
          return {
            assets,
            cadence: Number(settings.cadence_seconds) || 300,
            leverage: Number(settings.leverage) || 1,
            automatic: Boolean(settings.auto_enabled),
            trench: Boolean(settings.include_trench),
          };
        }
      } catch {
        // A malformed legacy record is not a market signal. The empty state
        // below keeps the desk useful without inventing a saved selection.
      }
    }
    return null;
  }, [data.memecoin?.authorization?.settings_json, data.memecoin?.demo_authorization?.settings_json]);
  const marketLabelRefreshKey = useRef("");
  const [asset, setAsset] = useState("BTC");
  const [operator, setOperator] = useState("above");
  const [threshold, setThreshold] = useState("");
  const [alertError, setAlertError] = useState("");
  const [alertPending, setAlertPending] = useState<Set<string>>(new Set());
  const [alerts, setAlerts] = useState(data.alerts);
  const alertPendingRef = useRef(new Set<string>());
  const [analystMessages, setAnalystMessages] = useState<Array<{ role: "user" | "assistant" | "system"; text: string }>>([]);
  const [analystQuestion, setAnalystQuestion] = useState("");
  const [analystError, setAnalystError] = useState("");
  const [analystLoading, setAnalystLoading] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const [analystProviderAvailable, setAnalystProviderAvailable] = useState<boolean | null>(null);
  const analystRequestId = useRef(0);
  const analystThreadEndRef = useRef<HTMLDivElement>(null);
  const alertErrorId = useId();
  const beginAlertAction = (key: string) => {
    if (alertPendingRef.current.has(key)) return false;
    const next = new Set(alertPendingRef.current);
    next.add(key);
    alertPendingRef.current = next;
    setAlertPending(next);
    return true;
  };
  const endAlertAction = (key: string) => {
    const next = new Set(alertPendingRef.current);
    next.delete(key);
    alertPendingRef.current = next;
    setAlertPending(next);
  };
  const analystConfigured = Boolean(data.analyst?.configured);
  const selectionAssetLabel = (asset: string) => {
    const labels = data.memecoin?.market_labels;
    return labels?.[asset] || labels?.[asset.toLowerCase()] || labels?.[asset.toUpperCase()] || "Saved market";
  };
  useEffect(() => {
    setAlerts(data.alerts);
  }, [data.alerts]);
  useEffect(() => {
    analystThreadEndRef.current?.scrollIntoView({
      block: "end",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [analystMessages, analystLoading]);
  useEffect(() => {
    if (!selection) return;
    const labels = data.memecoin?.market_labels || {};
    const needsLabels = selection.assets.some((saved) => !labels[saved] && !labels[saved.toLowerCase()] && !labels[saved.toUpperCase()]);
    if (!needsLabels) return;
    // The catalogue is deliberately read off the critical dashboard path.
    // Make one quiet retry after its background warm-up, without unmounting
    // the desk or making the customer refresh the page.
    const key = `${data.user.id}:${data.environment}:${selection.assets.join("|")}`;
    if (marketLabelRefreshKey.current === key) return;
    marketLabelRefreshKey.current = key;
    const timer = window.setTimeout(() => {
      void reload().catch((error) => onNotice(
        error instanceof Error
          ? `Market labels could not be refreshed: ${error.message}`
          : "Market labels could not be refreshed. Try again.",
      ));
    }, 1_200);
    return () => window.clearTimeout(timer);
  }, [data.environment, data.memecoin?.market_labels, data.user.id, reload, selection]);
  const createAlert = async () => {
    if (!Number.isFinite(Number(threshold)) || Number(threshold) <= 0) {
      setAlertError("Enter a positive price threshold before creating an alert.");
      return;
    }
    if (!beginAlertAction("create")) return;
    try {
      const response = await request("/v1/alerts", {
        method: "POST",
        body: JSON.stringify({ asset, operator, threshold: Number(threshold) }),
      });
      const created = response?.alert;
      if (
        !created
        || !Number.isSafeInteger(Number(created.id))
        || Number(created.id) <= 0
        || created.asset !== asset
        || created.operator !== operator
        || Number(created.threshold) !== Number(threshold)
      ) {
        throw new Error("The alert may have been created, but its saved record could not be confirmed. Refresh alerts before retrying.");
      }
      const savedAlert = {
        id: Number(created.id),
        asset: String(created.asset),
        operator: String(created.operator),
        threshold: Number(created.threshold),
      };
      setAlerts((current) => [
        savedAlert,
        ...current.filter((item) => item.id !== savedAlert.id),
      ].slice(0, 20));
      setThreshold("");
      setAlertError("");
      onNotice("Price alert created.");
      void reload().catch((error) => onNotice(error instanceof Error ? error.message : "The alert was created, but the list could not be refreshed."));
    } catch (error) {
      setAlertError(
        error instanceof Error ? error.message : "Could not create the alert.",
      );
      onNotice(
        error instanceof Error ? error.message : "Could not create the alert.",
      );
      void reload().catch((refreshError) => onNotice(refreshError instanceof Error ? refreshError.message : "Could not refresh alerts."));
    } finally {
      endAlertAction("create");
    }
  };
  const generateAnalystBriefing = async () => {
    if (analystLoading || !analystConfigured) return;
    const question = analystQuestion.trim();
    if (!question) return;
    const requestId = ++analystRequestId.current;
    setAnalystLoading(true);
    setAnalystError("");
    try {
      const response = await request("/v1/live-desk/analyst", {
        method: "POST",
        body: JSON.stringify({
          question,
          history: analystMessages
            .filter((message) => message.role !== "system")
            .map(({ role, text }) => ({ role, content: text })),
        }),
      }, undefined, 25_000);
      const text = typeof response?.briefing?.text === "string" ? response.briefing.text : "";
      if (!text) throw new Error("No briefing was available. Try again.");
      if (requestId !== analystRequestId.current) return;
      setAnalystProviderAvailable(true);
      setAnalystMessages((messages) => [...messages, ...(question ? [{ role: "user" as const, text: question }] : []), { role: "assistant" as const, text }].slice(-8));
      setAnalystQuestion("");
    } catch (error) {
      if (requestId !== analystRequestId.current) return;
      setAnalystProviderAvailable(false);
      setAnalystError(error instanceof Error ? error.message : "The AI provider could not answer. Please try again or contact support.");
    } finally {
      if (requestId === analystRequestId.current) setAnalystLoading(false);
    }
  };
  const escalateAnalystIssue = async (issue = analystQuestion.trim()) => {
    if (supportLoading || issue.length < 10) {
      setAnalystError("Add a little more detail so support can investigate.");
      return;
    }
    const requestId = analystRequestId.current;
    setSupportLoading(true);
    setAnalystError("");
    try {
      const response = await request("/v1/live-desk/analyst/escalate", { method: "POST", body: JSON.stringify({ issue }) });
      const ticketId = Number(response?.ticket_id);
      const text = Number.isFinite(ticketId) ? `Support request TP-${ticketId} was sent.` : "Your issue was sent to support.";
      if (requestId !== analystRequestId.current) return;
      setAnalystMessages((messages) => [...messages, { role: "user" as const, text: issue }, { role: "system" as const, text }].slice(-8));
      setAnalystQuestion("");
    } catch (error) {
      if (requestId === analystRequestId.current) {
        setAnalystError(error instanceof Error ? error.message : "The support request could not be sent. Try again.");
      }
    } finally {
      setSupportLoading(false);
    }
  };
  const startNewAnalystConversation = () => {
    analystRequestId.current += 1;
    setAnalystMessages([]);
    setAnalystQuestion("");
    setAnalystError("");
    setAnalystLoading(false);
  };
  return (
    <DeskLocalized>
    <div className="desk-screen">
      <div className="desk-identity">
        <div className="desk-brand-lockup">
          <span className="desk-brand-mark"><PulseMark size={38} /></span>
          <div>
            <h2>Your market context</h2>
          </div>
        </div>
        <div className="desk-feed-state">
          <span className="live-indicator"><i />{data.quote_fresh ? "LIVE DATA" : "CACHED DATA"}</span>
          <span className="mono">{data.quote_age}s</span>
          {!data.quote_fresh && <button className="small-action desk-retry" onClick={() => void reload()}><StateIcon name="refresh" /> Retry feed</button>}
        </div>
      </div>
      <GradientPanel className="selection-intelligence">
        <div className="selection-intelligence-head">
          <div>
            <h2>Your saved strategy</h2>
          </div>
          <span className="selection-state">{selection ? "SAVED STRATEGY" : "NO SAVED STRATEGY"}</span>
        </div>
        {selection ? (
          <>
            <div className="selection-assets" aria-label="Selected memecoin markets">
              {selection.assets.map((item) => <span key={item}>{selectionAssetLabel(item)}</span>)}
            </div>
            <div className="selection-facts">
              <div><span>MARKETS</span><strong>{selection.assets.length}</strong></div>
              <div><span>CADENCE</span><strong>{selection.cadence / 60} min</strong></div>
              <div><span>LEVERAGE CAP</span><strong>{selection.leverage}×</strong></div>
              <div><span>ENTRY MODE</span><strong>{selection.automatic ? "Auto" : "Manual"}</strong></div>
            </div>
            <p className="selection-observation">This briefing follows your saved basket{selection.trench ? " with Trench Mode enabled" : ""}. Market data remains informational; every order still passes its live eligibility and risk checks.</p>
          </>
        ) : (
          <div className="selection-empty"><PulseMark size={25} /><p>Choose a saved Memecoin basket to see its market context here.</p></div>
        )}
      </GradientPanel>
      <GradientPanel className="analyst-chat-panel">
        <header className="analyst-panel-header">
          <div className="analyst-panel-title">
            <span className="analyst-mark"><PulseMark size={19} /></span>
            <div>
              <h2>Desk Analyst</h2>
              <p>Ask about anything, including trading concepts and strategy trade-offs.</p>
            </div>
          </div>
          <div className="analyst-panel-actions">
            <span className={`analyst-provider-status${!analystConfigured || analystProviderAvailable === false ? " needs-attention" : ""}`} role="status">
              {!analystConfigured ? "Not configured" : analystProviderAvailable === false ? "Provider needs attention" : analystProviderAvailable ? "Available" : "Provider configured"}
            </span>
            <button type="button" className="small-action analyst-new-conversation" onClick={startNewAnalystConversation}>New conversation</button>
          </div>
        </header>
        <div className="analyst-thread" role="log" aria-label="Desk Analyst conversation" aria-live="polite" aria-relevant="additions text">
          {analystMessages.length ? analystMessages.map((message, index) => (
            <article key={`${message.role}-${index}`} className={`analyst-message analyst-message-${message.role}`}>
              <span>{message.role === "user" ? "You" : message.role === "assistant" ? "Desk Analyst" : "Support"}</span>
              <p>{message.text}</p>
            </article>
          )) : (
            <div className="analyst-empty-state">
              <p>Start a conversation on any topic. For current market claims, the analyst can only use data available to TradePulse.</p>
            </div>
          )}
          {analystLoading && <p className="analyst-thinking" role="status">Thinking through your question…</p>}
          <div ref={analystThreadEndRef} />
        </div>
        {analystError && <p className="analyst-error" role="alert">{analystError}</p>}
        {!analystConfigured && <p className="analyst-error" role="status">The AI provider is not configured. Contact support to restore the analyst.</p>}
        <form
          className="analyst-composer"
          onSubmit={(event) => {
            event.preventDefault();
            void generateAnalystBriefing();
          }}
        >
          <label htmlFor="desk-analyst-question">Your message</label>
          <textarea
            id="desk-analyst-question"
            value={analystQuestion}
            maxLength={2000}
            onChange={(event) => {
              setAnalystQuestion(event.target.value);
              if (analystError) setAnalystError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                void generateAnalystBriefing();
              }
            }}
            placeholder="Ask a question or continue the conversation…"
          />
          <div className="analyst-composer-footer">
            <span>Ctrl/Command + Enter to send. AI-generated information is not financial advice.</span>
            <div className="analyst-panel-actions">
              <button
                type="button"
                className="small-action analyst-escalate"
                disabled={supportLoading || analystQuestion.trim().length < 10}
                aria-busy={supportLoading}
                onClick={() => void escalateAnalystIssue()}
              >
                {supportLoading ? "Sending to support…" : "Contact support"}
              </button>
              <button type="submit" className="primary-action analyst-send" disabled={!analystConfigured || analystLoading || !analystQuestion.trim()} aria-busy={analystLoading}>
                {analystLoading ? "Sending…" : "Send message"} <StateIcon name="refresh" />
              </button>
            </div>
          </div>
        </form>
      </GradientPanel>
      <GradientPanel className="alert-card desk-alert-card">
          <h2>Create a price alert</h2>
          <div className="alert-fields">
            <select
              value={asset}
              onChange={(event) => setAsset(event.target.value)}
              aria-label="Price alert asset"
            >
              {Object.keys(data.quotes).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={operator}
              onChange={(event) => setOperator(event.target.value)}
              aria-label="Price alert condition"
            >
              <option>above</option>
              <option>below</option>
            </select>
            <input
              value={threshold}
              onChange={(event) => {
                setThreshold(event.target.value);
                if (alertError) setAlertError("");
              }}
              inputMode="decimal"
              aria-label="Price alert threshold in US dollars"
              aria-invalid={Boolean(alertError)}
              aria-describedby={alertError ? alertErrorId : undefined}
              placeholder="Price"
            />
          </div>
          {alertError && (
            <p id={alertErrorId} className="alert-input-error" role="alert">
              <StateIcon name="alert-triangle" />
              {alertError}
            </p>
          )}
          <div className="parsed-preview">
            <span>Alert condition</span>
            <code>
              {asset} {operator} {threshold || "…"}
            </code>
          </div>
          <button
            className="primary-action"
            disabled={!Number(threshold) || Number(threshold) <= 0 || alertPending.has("create")}
            onClick={createAlert}
          >
            {alertPending.has("create") ? "Creating…" : "Create alert"} <Bell />
          </button>
      </GradientPanel>
      <GradientPanel className="active-alerts">
        <div className="section-heading">
          <div>
            <h2>Active price alerts</h2>
          </div>
        </div>
        {alerts.length ? (
          alerts.map((alert) => (
            <div className="audit-row" key={alert.id}>
              <span className="alert-pip" />
              <div>
                <strong>
                  {alert.asset} {alert.operator} {alert.threshold}
                </strong>
                <small>Push enabled</small>
              </div>
              <button
                className="icon-button"
                aria-label="Remove alert"
                disabled={alertPending.has(`remove:${alert.id}`)}
                aria-busy={alertPending.has(`remove:${alert.id}`)}
                onClick={async () => {
                  const actionKey = `remove:${alert.id}`;
                  if (!beginAlertAction(actionKey)) return;
                  try {
                    await request(`/v1/alerts/${alert.id}/remove`, {
                      method: "POST",
                      body: "{}",
                    });
                    setAlerts((current) => current.filter((item) => item.id !== alert.id));
                    onNotice("Alert removed.");
                    void reload().catch((error) => onNotice(error instanceof Error ? error.message : "The alert was removed, but the list could not be refreshed."));
                  } catch (error) {
                    onNotice(
                      error instanceof Error
                        ? error.message
                        : "Could not remove alert.",
                    );
                    void reload().catch((refreshError) => onNotice(refreshError instanceof Error ? refreshError.message : "Could not refresh alerts."));
                  } finally {
                    endAlertAction(actionKey);
                  }
                }}
              >
                <X />
              </button>
            </div>
          ))
        ) : (
          <div className="empty-alerts">
            <img
              src="/illustrations/alert-bell.png"
              alt="Alert bell"
              className="alert-bell-art"
            />
            <strong>No active alerts</strong>
            <small>Create an alert to monitor a market condition.</small>
          </div>
        )}
      </GradientPanel>
    </div>
    </DeskLocalized>
  );
}
