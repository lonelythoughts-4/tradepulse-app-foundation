"use client";

import { useState } from "react";
import type { LiveDashboard } from "../tradepulse-shell";
import { DeskLocalized } from "../desk-language";

const PAGE_SIZE = 6;
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));

export function ProtectionWorkspace({ data }: { data: LiveDashboard }) {
  const [pageIndex, setPageIndex] = useState(0);
  const protection = data.protection;
  const rows = protection?.settlements || [];
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(pageIndex, pageCount - 1);
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const firstRow = page * PAGE_SIZE + 1;
  const lastRow = Math.min((page + 1) * PAGE_SIZE, rows.length);

  return (
    <DeskLocalized>
      <div className="workspace-stack protection-workspace">
        <header className="protection-intro">
          <h2>Strategy protection</h2>
          <p>Up to 75% protection for qualifying automated trades. Eligible settled losses are credited to your usable wallet balance after fees. Qualifying Trench automation is included.</p>
        </header>
        <section className="gradient-panel protection-history" aria-labelledby="protection-history-title">
          <div className="section-heading">
            <div>
              <h2 id="protection-history-title">Protection history</h2>
              <p>Programme totals across all recorded settlements.</p>
            </div>
          </div>
          <div className="fact-block">
            <span>ELIGIBLE LOSSES <b>{money(Number(protection?.protected_loss_usd || 0))}</b></span>
            <span>WALLET CREDITS <b>{money(Number(protection?.credits_issued_usd || 0))}</b></span>
            <span>RATE <b>{Math.round(Number(protection?.coverage_rate || 0.75) * 100)}%</b></span>
          </div>
          {rows.length ? (
            <>
              <div aria-live="polite">
                {pageRows.map((item) => (
                  <div className="activity-row protection-activity-row" key={item.source_event_key}>
                    <div className="activity-info protection-activity-info">
                      <strong>{item.product === "memecoin" ? "Memecoin / Trench" : "Synthetic"} · {item.status.replaceAll("_", " ")}</strong>
                      <small>{new Date(Number(item.credited_at || item.created_at) * 1000).toLocaleString()} · net loss {money(Number(item.net_loss_usd || 0))}</small>
                    </div>
                    <strong>{Number(item.credit_usd || 0) > 0 ? `+${money(Number(item.credit_usd))}` : "—"}</strong>
                  </div>
                ))}
              </div>
              {rows.length > PAGE_SIZE && (
                <nav className="protection-pagination" aria-label="Protection history pages">
                  <span>Showing {firstRow}–{lastRow} of {rows.length} loaded settlements</span>
                  <div>
                    <button type="button" className="small-action" disabled={page === 0} onClick={() => setPageIndex(page - 1)}>Previous</button>
                    <button type="button" className="small-action" disabled={page >= pageCount - 1} onClick={() => setPageIndex(page + 1)}>Next</button>
                  </div>
                </nav>
              )}
            </>
          ) : (
            <div className="empty-state"><strong>No protection credits yet</strong><p>Eligible credits will appear here after a qualifying loss settles.</p></div>
          )}
        </section>
        <details className="protection-terms">
          <summary>Programme terms <span>What qualifies</span></summary>
          <div>
            <p>Wallet-funded automatic orders qualify only when all market, risk, price-freshness, liquidity, and strategy checks passed before entry. Manual trades, user overrides, failed executions, virtual funds, and testnet activity do not qualify.</p>
            <p><strong>Strategy Protection is a platform programme, not insurance.</strong> Trading remains risky, losses can still occur, and profits are never guaranteed.</p>
          </div>
        </details>
      </div>
    </DeskLocalized>
  );
}
