"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DeskLocalized } from "../desk-language";
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

type SupportTicket = {
  id: string;
  topic?: string;
  body: string;
  status: string;
  message_count?: number;
};

type SupportMessage = {
  id: number;
  author_role: "user" | "admin";
  body: string;
  created_at: number;
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
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<{ id: string; topic?: string; status: string } | null>(null);
  const [ticketMessages, setTicketMessages] = useState<SupportMessage[]>([]);
  const [ticketReply, setTicketReply] = useState("");
  const [ticketOpeningIds, setTicketOpeningIds] = useState<Set<string>>(new Set());
  const [ticketCreatePending, setTicketCreatePending] = useState(false);
  const [ticketReplyPendingIds, setTicketReplyPendingIds] = useState<Set<string>>(new Set());
  const ticketOpeningRef = useRef(new Set<string>());
  const ticketReplyPendingRef = useRef(new Set<string>());
  const ticketCreatePendingRef = useRef(false);
  const selectedTicketIdRef = useRef<string | null>(null);
  const ticketListRequestRef = useRef(0);
  const loadTickets = async () => {
    const requestId = ++ticketListRequestRef.current;
    const response = await request("/v1/support/tickets");
    if (requestId === ticketListRequestRef.current) {
      const nextTickets = Array.isArray(response.tickets)
        ? response.tickets.map((ticket: SupportTicket) => ({ ...ticket, id: String(ticket.id) }))
        : [];
      setTickets(nextTickets);
    }
  };
  const beginTicketOpen = (ticketId: string) => {
    if (ticketOpeningRef.current.has(ticketId)) return false;
    const next = new Set(ticketOpeningRef.current);
    next.add(ticketId);
    ticketOpeningRef.current = next;
    setTicketOpeningIds(next);
    return true;
  };
  const endTicketOpen = (ticketId: string) => {
    const next = new Set(ticketOpeningRef.current);
    next.delete(ticketId);
    ticketOpeningRef.current = next;
    setTicketOpeningIds(next);
  };
  const beginTicketReply = (ticketId: string) => {
    if (ticketReplyPendingRef.current.has(ticketId)) return false;
    const next = new Set(ticketReplyPendingRef.current);
    next.add(ticketId);
    ticketReplyPendingRef.current = next;
    setTicketReplyPendingIds(next);
    return true;
  };
  const endTicketReply = (ticketId: string) => {
    const next = new Set(ticketReplyPendingRef.current);
    next.delete(ticketId);
    ticketReplyPendingRef.current = next;
    setTicketReplyPendingIds(next);
  };
  const openTicket = async (ticket: { id: string; topic?: string; status: string }, managePending = true, resetReply = true, quiet = false) => {
    if (managePending) {
      if (!beginTicketOpen(ticket.id)) return;
      selectedTicketIdRef.current = ticket.id;
      if (activeTicket?.id !== ticket.id) {
        setActiveTicket(null);
        setTicketMessages([]);
        setTicketReply("");
      }
    }
    try {
      const response = await request(`/v1/support/tickets/${ticket.id}`);
      if (selectedTicketIdRef.current === ticket.id) {
        const responseTicket = response.ticket
          ? { ...response.ticket, id: String(response.ticket.id ?? ticket.id) }
          : ticket;
        setActiveTicket(responseTicket);
        setTicketMessages(Array.isArray(response.messages) ? response.messages : []);
        if (resetReply) setTicketReply("");
      }
    } catch (error) {
      if (!quiet) onNotice(error instanceof Error ? error.message : "Could not load this support request.");
    } finally {
      if (managePending) endTicketOpen(ticket.id);
    }
  };
  useEffect(() => {
    loadTickets()
      .catch((error) => onNotice(error instanceof Error ? error.message : "Could not load support tickets."));
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
    <DeskLocalized>
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
        <h2>Deposits, withdrawals, and account access</h2>
        {[
          [
            "Below-minimum deposit",
            "Send the remainder to the same active address.",
          ],
          [
            "Deposit not showing",
            "Choose I sent the deposit after sending; credit follows on-chain confirmation.",
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
              <button className="activity-row support-ticket-row" type="button" key={ticket.id} onClick={() => void openTicket(ticket)} disabled={ticketOpeningIds.has(ticket.id)} aria-busy={ticketOpeningIds.has(ticket.id)}>
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
          maxLength={1500}
          rows={3}
        />
        <button
          className="primary-action"
          disabled={supportMessage.trim().length < 10 || ticketCreatePending}
          onClick={async () => {
            if (ticketCreatePendingRef.current) return;
            ticketCreatePendingRef.current = true;
            setTicketCreatePending(true);
            const message = supportMessage.trim();
            try {
              const result = await request("/v1/support/tickets", {
                method: "POST",
                body: JSON.stringify({
                  topic: "Web help center",
                  message,
                }),
              });
              const ticketId = String(result?.ticket_id ?? "");
              if (!/^[1-9]\d*$/.test(ticketId)) {
                throw new Error("The request may have been created, but its ticket number could not be confirmed. Refresh support tickets before retrying.");
              }
              const ticket = { id: ticketId, topic: "Web help center", status: "open" };
              const firstMessage: SupportMessage = {
                id: -Date.now(),
                author_role: "user",
                body: message,
                created_at: Math.floor(Date.now() / 1000),
              };
              setSupportMessage("");
              selectedTicketIdRef.current = ticket.id;
              setActiveTicket(ticket);
              setTicketMessages([firstMessage]);
              setTicketReply("");
              ticketListRequestRef.current += 1;
              setTickets((current) => [
                { ...ticket, body: message, message_count: 1 },
                ...current.filter((item) => item.id !== ticket.id),
              ]);
              onNotice(`Support ticket #${result.ticket_id} opened.`);
              void loadTickets().catch((error) => onNotice(error instanceof Error ? error.message : "The ticket opened, but its list could not be refreshed."));
              void openTicket(ticket, false, false);
            } catch (error) {
              onNotice(
                error instanceof Error
                  ? error.message
                  : "Could not open a support ticket.",
              );
              void loadTickets().catch((refreshError) => onNotice(refreshError instanceof Error ? refreshError.message : "Could not refresh support tickets."));
            } finally {
              ticketCreatePendingRef.current = false;
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
              <button type="button" className="small-action" onClick={() => {
                selectedTicketIdRef.current = null;
                setActiveTicket(null);
                setTicketMessages([]);
              }}>Hide thread</button>
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
              <textarea id={`${fieldId}-reply`} value={ticketReply} onChange={(event) => setTicketReply(event.target.value)} placeholder="Add details without sharing a security code or private key." maxLength={1500} rows={4} />
              <button className="primary-action" disabled={ticketReply.trim().length < 2 || ticketReplyPendingIds.has(activeTicket.id)} onClick={async () => {
                const ticket = activeTicket;
                const message = ticketReply.trim();
                if (!beginTicketReply(ticket.id)) return;
                try {
                  await request(`/v1/support/tickets/${ticket.id}/messages`, { method: "POST", body: JSON.stringify({ message }) });
                  const reply: SupportMessage = {
                    id: -Date.now(),
                    author_role: "user",
                    body: message,
                    created_at: Math.floor(Date.now() / 1000),
                  };
                  if (selectedTicketIdRef.current === ticket.id) {
                    setTicketMessages((current) => [...current, reply]);
                    setTicketReply("");
                  }
                  ticketListRequestRef.current += 1;
                  setTickets((current) => current.map((item) => item.id === ticket.id
                    ? { ...item, message_count: (item.message_count || 1) + 1 }
                    : item));
                  onNotice("Reply sent to support.");
                  void loadTickets().catch((error) => onNotice(error instanceof Error ? error.message : "Your reply was sent, but the ticket list could not be refreshed."));
                  void openTicket(ticket, false, false);
                } catch (error) {
                  onNotice(error instanceof Error ? error.message : "Could not send the support reply.");
                  void loadTickets().catch((refreshError) => onNotice(refreshError instanceof Error ? refreshError.message : "Could not refresh support tickets."));
                  void openTicket(ticket, false, false);
                } finally { endTicketReply(ticket.id); }
              }}>{ticketReplyPendingIds.has(activeTicket.id) ? "Sending…" : "Send reply"} <Send /></button>
            </>
          )}
        </GradientPanel>
      )}
    </div>
    </DeskLocalized>
  );
}
