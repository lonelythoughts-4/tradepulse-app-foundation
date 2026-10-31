"use client";

import { useEffect, useId, useState } from "react";
import {
  ChevronRight,
  GradientPanel,
  Send,
  StateIcon,
} from "./shared-ui";

export type HelpDashboard = {
  community_url: string;
  recovery_cases?: Array<{ id: string | number; asset: string; network: string; status: string }>;
};

export function HelpWorkspace({
  data,
  request,
  onNotice,
}: {
  data: HelpDashboard;
  request: (path: string, options?: RequestInit) => Promise<any>;
  onNotice: (message: string) => void;
}) {
  const [network, setNetwork] = useState("");
  const [asset, setAsset] = useState("");
  const [hash, setHash] = useState("");
  const [address, setAddress] = useState("");
  const [details, setDetails] = useState("");
  const [recoveryPending, setRecoveryPending] = useState(false);
  const [recoveryCases, setRecoveryCases] = useState(data.recovery_cases || []);
  const fieldId = useId();
  const [supportMessage, setSupportMessage] = useState("");
  const [tickets, setTickets] = useState<Array<{ id: string; topic?: string; body: string; status: string; message_count?: number }>>([]);
  const [activeTicket, setActiveTicket] = useState<{ id: string; topic?: string; status: string } | null>(null);
  const [ticketMessages, setTicketMessages] = useState<Array<{ id: number; author_role: "user" | "admin"; body: string; created_at: number }>>([]);
  const [ticketReply, setTicketReply] = useState("");
  const [ticketOpeningId, setTicketOpeningId] = useState<string | null>(null);
  const [ticketCreatePending, setTicketCreatePending] = useState(false);
  const [ticketReplyPending, setTicketReplyPending] = useState(false);
  const loadTickets = async () => {
    const response = await request("/v1/support/tickets");
    setTickets(Array.isArray(response.tickets) ? response.tickets : []);
  };
  const openTicket = async (ticket: { id: string; topic?: string; status: string }, managePending = true, resetReply = true, quiet = false) => {
    if (managePending) setTicketOpeningId(ticket.id);
    try {
      const response = await request(`/v1/support/tickets/${ticket.id}`);
      setActiveTicket(response.ticket || ticket);
      setTicketMessages(Array.isArray(response.messages) ? response.messages : []);
      if (resetReply) setTicketReply("");
    } catch (error) {
      if (!quiet) onNotice(error instanceof Error ? error.message : "Could not load this support request.");
    } finally {
      if (managePending) setTicketOpeningId(null);
    }
  };
  useEffect(() => {
    loadTickets()
      .catch(() => setTickets([]));
  }, []);
  useEffect(() => {
    setRecoveryCases(data.recovery_cases || []);
  }, [data.recovery_cases]);
  useEffect(() => {
    if (!activeTicket || activeTicket.status === "closed") return;
    let cancelled = false;
    const refreshThread = () => {
      if (!cancelled) void openTicket(activeTicket, false, false, true);
    };
    const timer = window.setInterval(refreshThread, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeTicket?.id, activeTicket?.status]);
  return (
    <div className="account-screen">
      <div className="screen-title">
        <div>
          <span className="eyebrow">HELP / SUPPORT</span>
          <h2>Help center</h2>
        </div>
        <button
          className="share-action"
          onClick={() =>
            window.open(data.community_url, "_blank", "noopener,noreferrer")
          }
        >
          Community <StateIcon name="arrow-up-right" />
        </button>
      </div>
      <GradientPanel className="levels-card">
        <span className="eyebrow">COMMON QUESTIONS</span>
        <h2>Clear answers, fast</h2>
        {[
          [
            "Below-minimum deposit",
            "Send the remainder to the same active address.",
          ],
          [
            "Deposit not showing",
            "Use I made this deposit after sending; credit follows on-chain confirmation.",
          ],
          [
            "Withdrawal pending",
            "Funds remain locked until released or rejected.",
          ],
          ["Wrong network", "Do not send more. Submit the transaction below."],
        ].map(([title, body]) => (
          <div className="level-row" key={title}>
            <b>?</b>
            <span>
              <strong>{title}</strong>
              <small>{body}</small>
            </span>
          </div>
        ))}
      </GradientPanel>
      <GradientPanel className="flow-card">
        <img
          src="/illustrations/recovery-lifebuoy.png"
          alt="Recovery support"
          className="recovery-art"
        />
        <span className="eyebrow">WRONG-NETWORK RECOVERY</span>
        <h2>Submit for manual review</h2>
        <div className="alert-fields">
          <div>
            <label className="amount-field" htmlFor={`${fieldId}-network`}>Network</label>
            <input
              id={`${fieldId}-network`}
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              aria-label="Recovery network"
              placeholder="Network"
            />
          </div>
          <div>
            <label className="amount-field" htmlFor={`${fieldId}-asset`}>Asset</label>
            <input
              id={`${fieldId}-asset`}
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              aria-label="Recovery asset"
              placeholder="Asset"
            />
          </div>
        </div>
        <label className="amount-field" htmlFor={`${fieldId}-hash`}>Transaction hash</label>
        <input
          id={`${fieldId}-hash`}
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          aria-label="Recovery transaction hash"
          placeholder="Transaction hash"
        />
        <label className="amount-field" htmlFor={`${fieldId}-address`}>Address sent to</label>
        <input
          id={`${fieldId}-address`}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          aria-label="Address the transfer was sent to"
          placeholder="Address sent to"
        />
        <label className="amount-field" htmlFor={`${fieldId}-details`}>Recovery details, including asset and amount</label>
        <textarea
          id={`${fieldId}-details`}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          aria-label="Recovery details, including asset and amount"
          placeholder="What happened? Include the asset, amount, and any relevant details."
          rows={3}
        />
        <button
          className="primary-action"
          disabled={recoveryPending || !network.trim() || !asset.trim() || !hash.trim() || !address.trim() || details.trim().length < 10}
          onClick={async () => {
            if (recoveryPending) return;
            setRecoveryPending(true);
            try {
              const result = await request("/v1/recovery", {
                method: "POST",
                body: JSON.stringify({
                  network,
                  asset,
                  tx_hash: hash,
                  destination: address,
                  details,
                }),
              });
              setNetwork("");
              setAsset("");
              setHash("");
              setAddress("");
              setDetails("");
              if (result.recovery_case) {
                setRecoveryCases((current) => [
                  result.recovery_case,
                  ...current.filter((recovery) => recovery.id !== result.recovery_case.id),
                ]);
              }
              onNotice("Recovery case submitted for review.");
            } catch (error) {
              onNotice(
                error instanceof Error
                  ? error.message
                  : "Could not submit recovery case.",
              );
            } finally {
              setRecoveryPending(false);
            }
          }}
        >
          {recoveryPending ? "Submitting…" : "Submit recovery case"} <Send />
        </button>
      </GradientPanel>
      <GradientPanel className="flow-card">
        <span className="eyebrow">RECOVERY STATUS</span>
        <h2>Your submitted cases</h2>
        {recoveryCases.length ? (
          <div className="support-ticket-list">
            {recoveryCases.slice(0, 10).map((recovery) => (
              <div className="activity-row" key={recovery.id}>
                <div className="activity-info">
                  <strong>RC-{recovery.id} · {recovery.asset} / {recovery.network}</strong>
                  <small>{recovery.status.replace("_", " ")} · no automatic credit or transfer</small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No recovery cases submitted.</p>
        )}
      </GradientPanel>
      <GradientPanel className="flow-card">
        <span className="eyebrow">SUPPORT</span>
        <h2>Need help with something else?</h2>
        <p>
          Open a tracked request for account, bot, deposit, or withdrawal help.
        </p>
        {tickets.length > 0 && (
          <div className="support-ticket-list">
            {tickets.slice(0, 5).map((ticket) => (
              <button className="activity-row support-ticket-row" type="button" key={ticket.id} onClick={() => void openTicket(ticket)} disabled={ticketOpeningId === ticket.id} aria-busy={ticketOpeningId === ticket.id}>
                <div className="activity-info">
                  <strong>TP-{ticket.id} · {ticket.topic || "General"}</strong>
                  <small>{ticket.status.replace("_", " ")} · {ticket.message_count || 1} message{(ticket.message_count || 1) === 1 ? "" : "s"}</small>
                </div>
                <ChevronRight />
              </button>
            ))}
          </div>
        )}
        <label className="amount-field" htmlFor={`${fieldId}-support`}>Support request details</label>
        <textarea
          id={`${fieldId}-support`}
          value={supportMessage}
          onChange={(event) => setSupportMessage(event.target.value)}
          aria-label="Support request details"
          placeholder="Describe the issue without sharing a security code or private key."
          rows={3}
        />
        <button
          className="primary-action"
          disabled={supportMessage.trim().length < 10 || ticketCreatePending}
          onClick={async () => {
            setTicketCreatePending(true);
            try {
              const result = await request("/v1/support/tickets", {
                method: "POST",
                body: JSON.stringify({
                  topic: "Web help center",
                  message: supportMessage.trim(),
                }),
              });
              setSupportMessage("");
              await Promise.all([
                loadTickets(),
                openTicket({ id: String(result.ticket_id), topic: "Web help center", status: "open" }, false),
              ]);
              onNotice(`Support ticket #${result.ticket_id} opened.`);
            } catch (error) {
              onNotice(
                error instanceof Error
                  ? error.message
                  : "Could not open a support ticket.",
              );
            } finally {
              setTicketCreatePending(false);
            }
          }}
        >
          {ticketCreatePending ? "Opening…" : "Open support ticket"} <Send />
        </button>
      </GradientPanel>
      {activeTicket && (
        <GradientPanel className="flow-card support-thread" aria-live="polite">
          <div className="section-heading support-thread-heading">
            <div className="support-thread-title">
              <span className="eyebrow">SUPPORT THREAD</span>
              <h2>TP-{activeTicket.id} · {activeTicket.topic || "General"}</h2>
            </div>
            <div className="support-thread-meta">
              <span className={`status-chip ${activeTicket.status === "closed" ? "paused" : "running"}`}>{activeTicket.status === "closed" ? "Closed" : "Open"}</span>
              <button type="button" className="small-action" onClick={() => setActiveTicket(null)}>Hide thread</button>
            </div>
          </div>
          <div className="support-thread-messages" aria-label={`Messages for support ticket ${activeTicket.id}`}>
            {ticketMessages.map((message) => (
              <div className={`support-message ${message.author_role}`} key={message.id}>
                <strong>{message.author_role === "admin" ? "TradePulse support" : "You"}</strong>
                <p>{message.body}</p>
              </div>
            ))}
          </div>
          {activeTicket.status === "closed" ? (
            <p>This request is closed. Open a new request if you need further help.</p>
          ) : (
            <>
              <label className="amount-field" htmlFor={`${fieldId}-reply`}>Reply to support</label>
              <textarea id={`${fieldId}-reply`} value={ticketReply} onChange={(event) => setTicketReply(event.target.value)} placeholder="Add details without sharing a security code or private key." rows={4} />
              <button className="primary-action" disabled={ticketReply.trim().length < 2 || ticketReplyPending} onClick={async () => {
                setTicketReplyPending(true);
                try {
                  await request(`/v1/support/tickets/${activeTicket.id}/messages`, { method: "POST", body: JSON.stringify({ message: ticketReply.trim() }) });
                  await Promise.all([openTicket(activeTicket, false), loadTickets()]);
                  onNotice("Reply sent to support.");
                } catch (error) {
                  onNotice(error instanceof Error ? error.message : "Could not send the support reply.");
                } finally { setTicketReplyPending(false); }
              }}>{ticketReplyPending ? "Sending…" : "Send reply"} <Send /></button>
            </>
          )}
        </GradientPanel>
      )}
    </div>
  );
}
