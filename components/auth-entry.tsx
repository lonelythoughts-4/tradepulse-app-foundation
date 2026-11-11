"use client";

import { useState, type ReactNode } from "react";
import type { DeskTheme } from "../lib/theme-preference";
import styles from "./auth-entry.module.css";

const navigation = [
  ["How it works", "#how-it-works"],
  ["Your desk", "#capabilities"],
] as const;

function PulseGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 24" fill="none" aria-hidden="true">
      <path d="M1 12h8l4-9 6 18 5-13 3 4h8" />
    </svg>
  );
}

function PulseDivider() {
  return (
    <div className={styles.divider} aria-hidden="true">
      <span />
      <svg viewBox="0 0 40 16" fill="none">
        <path d="M0 8h14l4-6 4 12 4-6h14" />
      </svg>
      <span />
    </div>
  );
}

export function TelegramAuthPage({
  children,
  theme,
  onThemeChange,
}: {
  children: ReactNode;
  theme: DeskTheme;
  onThemeChange: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className={styles.page} data-theme={theme} id="top">
      <header className={styles.header}>
        <a className={styles.wordmark} href="#top" aria-label="TradePulse home">
          <PulseGlyph className={styles.logo} />
          <span>TradePulse</span>
        </a>
        <nav className={styles.navigation} aria-label="Page">
          {navigation.map(([label, href]) => (
            <a key={href} href={href}>{label}</a>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <button
            className={styles.theme}
            type="button"
            onClick={onThemeChange}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {theme === "light" ? (
                <path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z" />
              ) : (
                <>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
                </>
              )}
            </svg>
            <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
          </button>
          <a className={styles.enterLink} href="#sign-in">Enter TradePulse</a>
          <button
            className={styles.menuButton}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-auth-navigation"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            )}
          </button>
        </div>
        {menuOpen && (
          <nav className={styles.mobileNavigation} id="mobile-auth-navigation" aria-label="Page">
            {navigation.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
            <a href="#sign-in" onClick={() => setMenuOpen(false)}>Enter TradePulse</a>
          </nav>
        )}
      </header>

      <section className={styles.hero} aria-labelledby="welcome-title">
        <div className={styles.heroCopy}>
          <h1 id="welcome-title">
            Your trading day
            <span className={styles.titleAccent}>
              starts here.
              <svg viewBox="0 0 300 20" preserveAspectRatio="none" fill="none" aria-hidden="true">
                <path d="M3 12C60 4 110 18 170 10S260 6 297 9" />
              </svg>
            </span>
          </h1>
          <p>
            One secure entrance to your TradePulse account, wallet, bots,
            Memecoin markets, and Synthetic desk.
          </p>
          <div className={styles.pulseMark} aria-hidden="true">
            <PulseGlyph />
            <span>TRADEPULSE DESK</span>
          </div>
        </div>

        <section className={styles.signIn} id="sign-in" aria-labelledby="sign-in-title">
          <h2 id="sign-in-title">Welcome to your desk.</h2>
          <p className={styles.signInIntro}>
            Confirm this browser with Telegram. No password needed.
          </p>
          {children}
          <p className={styles.security}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3 19 6v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            TradePulse will never ask for your password, recovery phrase, or one-time code.
          </p>
        </section>
      </section>

      <PulseDivider />

      <section className={styles.steps} id="how-it-works" aria-labelledby="steps-title">
        <div className={styles.sectionIntro}>
          <h2 id="steps-title">A secure handoff, in three steps.</h2>
          <p>Your browser stays here while Telegram confirms that it is you.</p>
        </div>
        <ol>
          {[
            ["Create a secure link", "TradePulse prepares a short-lived sign-in link for this browser."],
            ["Confirm in Telegram", "Open the link and confirm the request with your TradePulse bot."],
            ["Return to your desk", "This browser completes sign-in automatically after confirmation."],
          ].map(([title, description], index) => (
            <li key={title}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <PulseDivider />

      <section className={styles.capabilities} id="capabilities" aria-labelledby="capabilities-title">
        <div className={styles.sectionIntro}>
          <h2 id="capabilities-title">One desk for your TradePulse account.</h2>
          <p>Review your account and product activity in one place.</p>
        </div>
        <dl>
          {[
            ["Trading bots", "Review allocations and manage your bot controls."],
            ["Memecoin", "Explore the Memecoin desk and review positions."],
            ["Synthetic", "Open the Synthetic desk and review positions."],
            ["Wallet", "Review wallet activity, deposits, and withdrawals."],
            ["Account", "Manage your profile, security, and support requests."],
          ].map(([title, description], index) => (
            <div key={title}>
              <span>0{index + 1}</span>
              <dt>{title}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className={styles.footer}>
        <a className={styles.wordmark} href="#top" aria-label="TradePulse home">
          <PulseGlyph className={styles.logo} />
          <span>TradePulse</span>
        </a>
        <span>Trading involves risk. Confirm sign-in requests only in Telegram.</span>
      </footer>
    </main>
  );

}
