"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Bell,
  GradientPanel,
  PulseMark,
  StateIcon,
  X,
  type LiveDashboard,
} from "../tradepulse-shell";

export function DeskWorkspace({
  data,
  request,
  reload,
  onNotice,
}: {
  data: LiveDashboard;
  request: (path: string, options?: RequestInit) => Promise<any>;
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
  const [alertPending, setAlertPending] = useState<string | null>(null);
  const [analystBriefing, setAnalystBriefing] = useState("");
  const [analystMessages, setAnalystMessages] = useState<Array<{ role: "user" | "assistant" | "system"; text: string }>>([]);
  const [analystQuestion, setAnalystQuestion] = useState("");
  const [analystError, setAnalystError] = useState("");
  const [analystLoading, setAnalystLoading] = useState(false);
  const alertErrorId = useId();
  const analystReady = Boolean(data.analyst?.configured);
  const analystUnavailableReason = !analystReady
    ? "The Desk Analyst is being connected. Try again shortly."
    : "";
  const selectionAssetLabel = (asset: string) => {
    const labels = data.memecoin?.market_labels;
    return labels?.[asset] || labels?.[asset.toLowerCase()] || labels?.[asset.toUpperCase()] || "Saved market";
  };
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
    const timer = window.setTimeout(() => void reload(), 1_200);
    return () => window.clearTimeout(timer);
  }, [data.environment, data.memecoin?.market_labels, data.user.id, reload, selection]);
  const createAlert = async () => {
    if (alertPending) return;
    if (!Number.isFinite(Number(threshold)) || Number(threshold) <= 0) {
      setAlertError("Enter a positive price threshold before creating an alert.");
      return;
    }
    setAlertPending("create");
    try {
      await request("/v1/alerts", {
        method: "POST",
        body: JSON.stringify({ asset, operator, threshold: Number(threshold) }),
      });
      setThreshold("");
      setAlertError("");
      void reload().catch(() => undefined);
      onNotice("Price alert created.");
    } catch (error) {
      setAlertError(
        error instanceof Error ? error.message : "Could not create the alert.",
      );
      onNotice(
        error instanceof Error ? error.message : "Could not create the alert.",
      );
    } finally {
      setAlertPending(null);
    }
  };
  const generateAnalystBriefing = async () => {
    if (analystLoading) return;
    const question = analystQuestion.trim();
    if (/\b(escalate|admin support|support ticket)\b/i.test(question)) {
      await escalateAnalystIssue(question);
      return;
    }
    setAnalystLoading(true);
    setAnalystError("");
    try {
      const response = await request("/v1/live-desk/analyst", {
        method: "POST",
        body: JSON.stringify({ question: question || undefined }),
      }, undefined, 25_000);
      const text = typeof response?.briefing?.text === "string" ? response.briefing.text : "";
      if (!text) throw new Error("The analyst did not return a usable briefing.");
      setAnalystBriefing(text);
      setAnalystMessages((messages) => [...messages, ...(question ? [{ role: "user" as const, text: question }] : []), { role: "assistant", text }].slice(-8));
      setAnalystQuestion("");
    } catch (error) {
      setAnalystError(error instanceof Error ? error.message : "The analyst is temporarily unavailable.");
    } finally {
      setAnalystLoading(false);
    }
  };
  const escalateAnalystIssue = async (issue = analystQuestion.trim()) => {
    if (analystLoading || issue.length < 10) {
      setAnalystError("Describe the issue in at least 10 characters so an admin can investigate.");
      return;
    }
    setAnalystLoading(true);
    setAnalystError("");
    try {
      const response = await request("/v1/live-desk/analyst/escalate", { method: "POST", body: JSON.stringify({ issue }) });
      const ticketId = Number(response?.ticket_id);
      const text = Number.isFinite(ticketId) ? `Support ticket TP-${ticketId} is now in the admin queue.` : "Your issue was sent to the admin support queue.";
      setAnalystMessages((messages) => [...messages, { role: "user", text: issue }, { role: "system", text }].slice(-8));
      setAnalystQuestion("");
    } catch (error) {
      setAnalystError(error instanceof Error ? error.message : "The support escalation could not be created.");
    } finally {
      setAnalystLoading(false);
    }
  };
  return (
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
          <div className="selection-empty"><PulseMark size={25} /><p>Choose a Memecoin strategy basket to see its market context here. Live Desk does not infer a selection from wallet activity.</p></div>
        )}
        <div className="analyst-boundary" aria-live="polite">
          <div className="analyst-identity">
            <span className="analyst-mark"><PulseMark size={18} /></span>
            <div><strong>Desk Analyst</strong><small>{analystReady ? "Your account context" : "Connection pending"}</small></div>
          </div>
          <div className="analyst-copy">
            {analystMessages.length ? <div className="analyst-thread">{analystMessages.map((message, index) => <p key={`${message.role}-${index}`} className={`analyst-message analyst-message-${message.role}`}>{message.text}</p>)}</div> : analystBriefing ? <p className="analyst-briefing">{analystBriefing}</p> : <p>{analystUnavailableReason || "Ask anything about your strategy, allocations, what to add or remove, activity, market scenarios, or your account. It will explain its reasoning; you always choose and confirm any action."}</p>}
            {analystError && <p className="analyst-error" role="alert">{analystError}</p>}
            <label className="analyst-question">
              <span>Ask the analyst</span>
              <input
                value={analystQuestion}
                maxLength={2000}
                disabled={!analystReady || analystLoading}
                onChange={(event) => {
                  setAnalystQuestion(event.target.value);
                  if (analystError) setAnalystError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void generateAnalystBriefing();
                }}
                placeholder="What could I add to my strategy, and why?"
              />
            </label>
            <div className="analyst-actions"><button className="small-action analyst-action" disabled={!analystReady || analystLoading} onClick={() => void generateAnalystBriefing()}>{analystLoading ? "Checking context…" : analystQuestion.trim() ? "Send message" : analystBriefing ? "Refresh overview" : "Start conversation"}<StateIcon name="refresh" /></button><button className="small-action analyst-escalate" disabled={analystLoading || analystQuestion.trim().length < 10} onClick={() => void escalateAnalystIssue()}>Escalate to admin</button></div>
          </div>
        </div>
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
            disabled={!Number(threshold) || Number(threshold) <= 0 || alertPending === "create"}
            onClick={createAlert}
          >
            {alertPending === "create" ? "Creating…" : "Create alert"} <Bell />
          </button>
      </GradientPanel>
      <GradientPanel className="active-alerts">
        <div className="section-heading">
          <div>
            <h2>Active price alerts</h2>
          </div>
        </div>
        {data.alerts.length ? (
          data.alerts.map((alert) => (
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
                disabled={alertPending === `remove:${alert.id}`}
                aria-busy={alertPending === `remove:${alert.id}`}
                onClick={async () => {
                  if (alertPending) return;
                  setAlertPending(`remove:${alert.id}`);
                  try {
                    await request(`/v1/alerts/${alert.id}/remove`, {
                      method: "POST",
                      body: "{}",
                    });
                    void reload().catch(() => undefined);
                    onNotice("Alert removed.");
                  } catch (error) {
                    onNotice(
                      error instanceof Error
                        ? error.message
                        : "Could not remove alert.",
                    );
                  } finally {
                    setAlertPending(null);
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
  );
}
