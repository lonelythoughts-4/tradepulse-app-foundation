"use client";

import type { LiveDashboard } from "../tradepulse-shell";

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));

export function ProtectionWorkspace({ data }: { data: LiveDashboard }) {
  const protection = data.protection;
  const rows = protection?.settlements || [];
  return (
    <div className="workspace-stack protection-workspace">
      <section className="gradient-panel bot-card">
        <div>
          <span className="eyebrow">STRATEGY PROTECTION</span>
          <h2>Up to 75% protection for qualifying automated trades</h2>
          <p>After an eligible automated loss settles, TradePulse credits 75% of the net loss after fees to your usable wallet balance. Qualifying Trench automation is included.</p>
        </div>
      </section>
      <section className="gradient-panel">
        <div className="section-heading"><div><span className="eyebrow">YOUR PROTECTION</span><h2>Programme history</h2></div></div>
        <div className="fact-block">
          <span>ELIGIBLE LOSSES <b>{money(Number(protection?.protected_loss_usd || 0))}</b></span>
          <span>WALLET CREDITS <b>{money(Number(protection?.credits_issued_usd || 0))}</b></span>
          <span>RATE <b>{Math.round(Number(protection?.coverage_rate || 0.75) * 100)}%</b></span>
        </div>
        {rows.length ? rows.map((item) => (
          <div className="activity-row" key={item.source_event_key}>
            <div className="activity-info">
              <strong>{item.product === "memecoin" ? "Memecoin / Trench" : "Synthetic"} · {item.status.replaceAll("_", " ")}</strong>
              <small>{new Date(Number(item.credited_at || item.created_at) * 1000).toLocaleString()} · net loss {money(Number(item.net_loss_usd || 0))}</small>
            </div>
            <strong>{Number(item.credit_usd || 0) > 0 ? `+${money(Number(item.credit_usd))}` : "—"}</strong>
          </div>
        )) : <div className="empty-state"><strong>No protection credits yet</strong><p>Eligible credits will appear here after a qualifying loss settles.</p></div>}
      </section>
      <section className="gradient-panel">
        <span className="eyebrow">CLEAR TERMS</span>
        <h2>What qualifies</h2>
        <p>Wallet-funded automatic orders qualify only when all market, risk, price-freshness, liquidity, and strategy checks passed before entry. Manual trades, user overrides, failed executions, virtual funds, and testnet activity do not qualify.</p>
        <p><strong>Strategy Protection is a platform programme, not insurance.</strong> Trading remains risky, losses can still occur, and profits are never guaranteed.</p>
      </section>
    </div>
  );
}
