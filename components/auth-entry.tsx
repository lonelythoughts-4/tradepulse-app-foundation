"use client";

import { useState, type ReactNode } from "react";
import { Archivo } from "next/font/google";
import styles from "./auth-entry.module.css";

const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });

function PulseWeave() {
  return <svg className={styles.weave} viewBox="0 0 560 330" fill="none" aria-hidden="true">
    {Array.from({ length: 11 }, (_, index) => (
      <path key={index} d="M8 165H145L201 65L277 265L344 128L370 165H552"
        transform={`translate(0 ${(index - 5) * 6})`}
        className={index === 5 ? styles.pulse : styles.echo} />
    ))}
  </svg>;
}

export function TelegramAuthPage({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  return <main className={`${styles.page} ${archivo.className}`} data-theme={theme}>
    <header className={styles.brand} aria-label="TradePulse">
      <svg viewBox="0 0 36 24" fill="none" aria-hidden="true"><path d="M1 12h8l4-9 6 18 5-13 3 4h8" /></svg>
      <span>TradePulse</span>
    </header>
    <div className={styles.toolbar}>
      <button className={styles.theme} type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        aria-pressed={theme === "light"}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></svg>
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </button>
    </div>
    <section className={styles.identity} aria-labelledby="telegram-entry-title">
      <PulseWeave />
      <div className={styles.identityCopy}>
        <h1 id="telegram-entry-title">A desk for every<br />market moment.</h1>
        <p>Your markets, wallet and activity.<br />Together in TradePulse.</p>
      </div>
    </section>
    <section className={styles.access} aria-labelledby="telegram-auth-heading">
      <div className={styles.signin}>
        <h2 id="telegram-auth-heading">Make yourself<br />at home.</h2>
        <p className={styles.intro}>Sign in with Telegram to open your desk.</p>
        {children}
        <details className={styles.help}>
          <summary>How does sign-in work?<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 8 5 5 5-5" /></svg></summary>
          <p>Open Telegram and confirm this browser. Return here and your desk will open automatically.</p>
        </details>
        <p className={styles.security}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 19 6v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
          <span>TradePulse will never ask for your password, recovery phrase, or one-time code.</span>
        </p>
      </div>
    </section>
    <footer className={styles.footer}>
      <span>© {new Date().getFullYear()} TradePulse</span>
      <span>Trading involves risk.</span>
    </footer>
  </main>;
}
