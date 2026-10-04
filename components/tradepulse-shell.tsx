"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
type FunctionalIconProps = { size?: number; className?: string };
const functionalIconMarkup = {
  bell: '<path d="M12 4.6 Q16.4 4.8 16.6 9.4 L16.7 13.3 Q16.8 14.9 17.9 15.4 L6.2 15.5 Q7.2 14.9 7.3 13.3 L7.4 9.2 Q7.6 4.8 12 4.6 Z"/><path d="M11 4.7 L11.2 3.6"/><path d="M10.4 17.5 Q12 18.5 13.6 17.4"/>',
  chevronRight:
    '<path d="M9.6 5.4 Q10.1 5.9 14.4 11.6 Q15 12.2 14.3 12.8 L9.4 18.5"/>',
  copy: '<path d="M9.4 9.3 L17.2 9.1 Q17.8 9.1 17.8 9.7 L18 16.9 Q18 17.5 17.4 17.5 L10.1 17.7 Q9.5 17.7 9.5 17.1 Z"/><path d="M6.4 6.1 L14.2 6.3 Q14.8 6.3 14.8 6.9 L14.6 13.8 Q14.6 14.4 14 14.4 L7.1 14.2 Q6.5 14.2 6.5 13.6 Z"/><path d="M8.3 9.3 L12.2 9.4"/>',
  download:
    '<path d="M12 4.3 L12.1 14.3"/><path d="M8.9 11.4 L12.1 14.5 L15.2 11.3"/><path d="M5.1 15.7 L5.3 18.2 Q5.4 18.9 6.1 18.9 L17.9 18.7 Q18.6 18.7 18.6 18 L18.8 15.5"/>',
  fuel: '<path d="M5.2 4.7 L11.9 4.5 Q12.5 4.5 12.5 5.1 L12.7 16.8 Q12.7 17.4 12.1 17.4 L5.5 17.6 Q4.9 17.6 4.9 17 Z"/><path d="M7.1 6.7 L10.6 6.6 Q11.2 6.6 11.2 7.2 L11.3 10 Q11.3 10.6 10.7 10.6 L7.3 10.7 Q6.7 10.7 6.7 10.1 Z"/><path d="M12.6 8.1 L15.3 8.4 Q17.2 8.7 17 10.6 L16.8 14.3 Q16.7 15.9 15.3 15.8 L15 15.8 Q13.9 15.7 14 14.6 L14.1 13.4"/><path d="M14.1 13.4 L15.7 13.6"/><path d="M4 19.4 L13.9 19.2"/>',
  history:
    '<circle cx="12" cy="12" r="6.6" transform="rotate(-2 12 12)"/><path d="M12 8.3 L12 12.1 L14.9 13.7"/><path d="M6.1 5.6 L7.5 5.9 L6.6 7"/>',
  plus: '<path d="M12.1 5 L11.9 18.9"/><path d="M5.2 11.9 L18.9 12.1"/>',
  send: '<path d="M4.1 11.7 L19.4 4.4 Q20.1 4.1 19.8 4.9 L13.6 19.3 Q13.3 20 12.8 19.4 L9.6 13.6 L4.3 12.7 Q3.7 12.5 4.1 11.7 Z"/><path d="M9.6 13.6 L19.2 4.7"/>',
  shieldCheck:
    '<path d="M12 3.5 L18.4 5.7 Q19 5.9 18.9 6.6 L18.6 11.9 Q18.3 16.3 12.2 19.2 Q12 19.3 11.8 19.2 Q5.7 16.2 5.4 11.9 L5.1 6.6 Q5 5.9 5.7 5.7 Z"/><path d="M8.7 12.1 L10.9 14.2 L15.2 9.9"/>',
  x: '<path d="M6.1 6.3 L18 17.8"/><path d="M17.9 6.1 L6.3 18"/>',
} as const;
function FunctionalIcon({
  name,
  size = 18,
  className = "",
}: FunctionalIconProps & { name: keyof typeof functionalIconMarkup }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: functionalIconMarkup[name] }}
    />
  );
}
const Bell = (props: FunctionalIconProps) => (
  <FunctionalIcon name="bell" {...props} />
);
const BellOff = (props: FunctionalIconProps) => (
  <FunctionalIcon
    name="bell"
    {...props}
    className={`${props.className ?? ""} icon-off`}
  />
);
const ChevronRight = (props: FunctionalIconProps) => (
  <FunctionalIcon name="chevronRight" {...props} />
);
const Copy = (props: FunctionalIconProps) => (
  <FunctionalIcon name="copy" {...props} />
);
const Download = (props: FunctionalIconProps) => (
  <FunctionalIcon name="download" {...props} />
);
const Fuel = (props: FunctionalIconProps) => (
  <FunctionalIcon name="fuel" {...props} />
);
const History = (props: FunctionalIconProps) => (
  <FunctionalIcon name="history" {...props} />
);
const Plus = (props: FunctionalIconProps) => (
  <FunctionalIcon name="plus" {...props} />
);
const Send = (props: FunctionalIconProps) => (
  <FunctionalIcon name="send" {...props} />
);
const ShieldCheck = (props: FunctionalIconProps) => (
  <FunctionalIcon name="shieldCheck" {...props} />
);
const X = (props: FunctionalIconProps) => (
  <FunctionalIcon name="x" {...props} />
);
type PublicIconName =
  | "alert-triangle"
  | "arrow-left"
  | "arrow-up-right"
  | "bell"
  | "bell-off"
  | "check"
  | "chevron-right"
  | "copy"
  | "eye"
  | "eye-off"
  | "lock"
  | "minus"
  | "pause"
  | "play"
  | "plus"
  | "refresh";
type PaymentMarkName =
  | "usdt"
  | "usdc"
  | "ethereum"
  | "bnb"
  | "base"
  | "arbitrum"
  | "polygon"
  | "solana";
const paymentMarkNames: Record<string, PaymentMarkName> = {
  USDT: "usdt",
  USDC: "usdc",
  Ethereum: "ethereum",
  ERC20: "ethereum",
  "BNB Chain": "bnb",
  BEP20: "bnb",
  Base: "base",
  BASE: "base",
  Arbitrum: "arbitrum",
  ARBITRUM: "arbitrum",
  Polygon: "polygon",
  POLYGON: "polygon",
  Solana: "solana",
  SPL: "solana",
};
function PaymentMark({ asset, compact = false }: { asset: string; compact?: boolean }) {
  const name = paymentMarkNames[asset] || "base";
  const isAsset = asset === "USDT" || asset === "USDC";
  return (
    <span
      className={isAsset ? "coin-mark" : "network-mark"}
      aria-label={`${asset} logo`}
      role="img"
      style={{
        width: compact ? 16 : 32,
        height: compact ? 16 : 32,
        borderRadius: 0,
        background: "transparent",
      }}
    >
      <img
        aria-hidden="true"
        alt=""
        src={`/icons/${name}.svg`}
        style={{
          display: "block",
          width: compact ? 16 : 18,
          height: compact ? 16 : 18,
          objectFit: "contain",
        }}
      />
    </span>
  );
}
function StateIcon({
  name,
  size = 18,
  className = "",
}: FunctionalIconProps & { name: PublicIconName }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        WebkitMaskImage: `url(/icons/${name}.svg)`,
        maskImage: `url(/icons/${name}.svg)`,
      }}
      className={`state-icon ${className}`}
      aria-hidden="true"
    />
  );
}
function StateSwapIcon({
  name,
  swapKey = name,
  size = 18,
  className = "",
}: FunctionalIconProps & { name: PublicIconName; swapKey?: string }) {
  return (
    <span className={`state-icon-swap ${className}`} aria-hidden="true">
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={swapKey}
          style={{
            width: size,
            height: size,
            WebkitMaskImage: `url(/icons/${name}.svg)`,
            maskImage: `url(/icons/${name}.svg)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        />
      </AnimatePresence>
    </span>
  );
}
const Settings = (props: FunctionalIconProps) => (
  <NavIcon name="account" {...props} />
);
const Wallet = (props: FunctionalIconProps) => (
  <NavIcon name="wallet" {...props} />
);
const Zap = (props: FunctionalIconProps) => <NavIcon name="desk" {...props} />;
const Coins = (props: FunctionalIconProps) => (
  <NavIcon name="earn" {...props} />
);

const ease = [0.16, 1, 0.3, 1] as const;
const navItems = [
  { label: "Dashboard", icon: "dashboard" },
  { label: "Bots", icon: "bots" },
  { label: "Synthetic", icon: "desk" },
  { label: "Wallet", icon: "wallet" },
  { label: "Earn", icon: "earn" },
  { label: "Account", icon: "account" },
] as const;

type NavIconName =
  | "dashboard"
  | "bots"
  | "wallet"
  | "earn"
  | "account"
  | "desk"
  | "community"
  | "help"
  | "more"
  | "admin";

const navIconMarkup: Record<NavIconName, string> = {
  dashboard:
    '<path d="M4.6 4.5 L10.1 4.2 Q10.7 4.2 10.7 4.8 L10.9 9.7 Q10.9 10.3 10.3 10.3 L5 10.5 Q4.4 10.5 4.4 9.9 L4.3 5.1 Q4.3 4.6 4.6 4.5 Z"/><path d="M14.2 4 L19.5 4.3 Q20.1 4.3 20 4.9 L19.8 9.8 Q19.8 10.4 19.2 10.4 L14.1 10.2 Q13.5 10.2 13.6 9.6 L13.8 4.7 Q13.8 4.1 14.2 4 Z"/><path d="M4.5 14 L9.8 13.8 Q10.4 13.8 10.4 14.4 L10.6 19.2 Q10.6 19.8 10 19.8 L4.8 19.6 Q4.2 19.6 4.3 19 L4.1 14.6 Q4.1 14.1 4.5 14 Z"/><path d="M13.9 14.3 L19.3 14.1 Q19.9 14.1 19.9 14.7 L19.7 19.4 Q19.7 20 19.1 20 L14.2 20.2 Q13.6 20.2 13.7 19.6 L13.5 15 Q13.5 14.4 13.9 14.3 Z"/>',
  bots: '<path d="M5.1 8.6 Q4.8 7.1 6.4 7 L17.5 7.3 Q19.1 7.4 18.9 8.9 L18.7 15.3 Q18.6 16.9 17 16.8 L6.9 16.6 Q5.3 16.5 5.3 14.9 Z"/><circle cx="8.4" cy="11.5" r="1.05" transform="rotate(-3 8.4 11.5)"/><circle cx="15.5" cy="11.4" r="0.95" transform="rotate(2 15.5 11.4)"/><path d="M9.4 14.1 Q12 15.2 14.6 14"/><path d="M12.1 7 L12.3 4.8"/><circle cx="12.4" cy="3.9" r="0.85"/>',
  wallet:
    '<path d="M3.9 7.3 Q3.7 6.2 5 6.1 L18.8 6.4 Q20.3 6.5 20.2 7.9 L20 16.2 Q19.9 17.6 18.5 17.5 L5.1 17.3 Q3.8 17.2 3.9 15.9 Z"/><path d="M4 9.6 L20.1 9.4"/><circle cx="16.6" cy="13.4" r="1.25"/><path d="M7.2 13.2 L11.5 13.4"/>',
  earn: '<path d="M7 7.6 C7 6.6 9.2 5.8 12 5.9 C14.8 6 17 6.9 17 7.9 C17 8.9 14.8 9.7 12 9.6 C9.2 9.5 7 8.6 7 7.6 Z"/><path d="M7 7.6 L7.1 11.4 C7.1 12.4 9.3 13.3 12.1 13.4 C14.9 13.5 17.1 12.7 17.1 11.7 L17 7.9"/><path d="M7.1 11.4 L7.2 15 C7.2 16 9.4 16.9 12.2 17 C15 17.1 17.2 16.3 17.2 15.3 L17.1 11.7"/><path d="M18.7 4.3 L18.95 5.3 L19.9 5.55 L18.95 5.8 L18.7 6.8 L18.45 5.8 L17.5 5.55 L18.45 5.3 Z"/>',
  account:
    '<path d="M9.1 9.3 Q9 6.9 12 6.7 Q15.1 6.6 15.2 8.9 Q15.3 10.7 13.5 11.4 Q12.2 11.9 12.1 13.2 L12 14.2"/><circle cx="12" cy="17" r="1.1"/>',
  desk: '<path d="M3.4 13.2 L6.9 13 L8.4 8.6 L10.9 17 L12.9 6.9 L14.6 13.1 L20.6 12.9"/><path d="M6.9 13 L6.9 15.4"/><path d="M12.9 6.9 L12.9 4.6"/><path d="M17.4 13 L17.4 15.2"/>',
  community:
    '<circle cx="12" cy="8.6" r="3.4" transform="rotate(-2 12 8.6)"/><path d="M5.3 19.5 Q5.5 15.7 9.1 15 Q12 14.4 15.1 15.1 Q18.6 15.9 18.7 19.6"/>',
  help: '<circle cx="12" cy="8.2" r="2.55"/><path d="M8.5 18 Q8.7 13.9 12 13.6 Q15.3 13.9 15.5 18"/><circle cx="4.9" cy="9.4" r="1.85"/><path d="M2.5 17.7 Q2.7 14.7 4.9 14.5 Q7.1 14.8 7.2 17.8"/><circle cx="19.1" cy="9.3" r="1.85"/><path d="M16.9 17.8 Q17.1 14.7 19.2 14.5 Q21.4 14.8 21.5 17.7"/>',
  more: '<circle cx="5.5" cy="12" r="1.15" transform="rotate(-4 5.5 12)"/><circle cx="12" cy="11.8" r="1.2" transform="rotate(3 12 11.8)"/><circle cx="18.4" cy="12.1" r="1.1" transform="rotate(-2 18.4 12.1)"/>',
  admin:
    '<path d="M12 3.5 L18.4 5.7 Q19 5.9 18.9 6.6 L18.6 11.9 Q18.3 16.3 12.2 19.2 Q12 19.3 11.8 19.2 Q5.7 16.2 5.4 11.9 L5.1 6.6 Q5 5.9 5.7 5.7 Z"/><path d="M8.2 12.1 L10.1 12 L11 9.9 L12.8 13.9 L13.7 12.1 L15.8 12"/>',
};

function NavIcon({
  name,
  size = 22,
  className = "",
}: {
  name: NavIconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={`custom-nav-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: navIconMarkup[name] }}
    />
  );
}

function PulseMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      aria-label="TradePulse mark"
      role="img"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
    >
      <path
        d="M3 21h7l3-9 6 18 5-14 3 5h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="37" cy="21" r="1.7" fill="#34D399" />
    </svg>
  );
}

function GradientPanel({
  children,
  className = "",
  onPointerDown,
  onClick,
  onKeyDown,
  role,
  tabIndex,
}: {
  children: React.ReactNode;
  className?: string;
  onPointerDown?: React.PointerEventHandler<HTMLDivElement>;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  role?: React.AriaRole;
  tabIndex?: number;
}) {
  return (
    <div
      className={`gradient-panel ${className}`}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={role}
      tabIndex={tabIndex}
    >
      {children}
    </div>
  );
}

function BootScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const steps = ["verifying session…", "syncing ledger…", "loading desk…"];
  useEffect(() => {
    const interval = window.setInterval(
      () => setStep((current) => Math.min(current + 1, 2)),
      650,
    );
    const done = window.setTimeout(onComplete, 2400);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(done);
    };
  }, [onComplete]);
  return (
    <motion.div
      className="boot-screen"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.65, ease }}
    >
      <div className="boot-mark">
        <PulseMark size={76} />
      </div>
      <div className="boot-line" />
      <div className="boot-copy">
        <strong>
          TRADE<span>PULSE</span>
        </strong>
        <div className="boot-status">
          <span className="status-dot" />
          {steps[step]}
        </div>
      </div>
    </motion.div>
  );
}

function Sidebar({
  active,
  setActive,
  profileName = "Jordan Davis",
  profileTier = "Pro account",
  isAdmin = true,
}: {
  active: string;
  setActive: (value: string) => void;
  profileName?: string;
  profileTier?: string;
  isAdmin?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const initials =
    profileName
      .split(/\\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "TP";
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <button
        className="sidebar-collapse"
        type="button"
        aria-label={collapsed ? "Expand sidebar" : "Minimize sidebar"}
        onClick={() => setCollapsed((value) => !value)}
      >
        <StateSwapIcon
          name="chevron-right"
          swapKey={collapsed ? "sidebar-expand" : "sidebar-collapse"}
          className={collapsed ? "" : "state-icon-rotated"}
        />
      </button>
      <div className="brand">
        <PulseMark />
        <span>
          TRADE<span>PULSE</span>
        </span>
      </div>
      <div className="desk-label">WORKSPACE</div>
      <nav className="side-nav">
        {navItems.map(({ label, icon }) => (
          <button
            key={label}
            className={`nav-item ${active === label ? "active" : ""}`}
            onClick={() => setActive(label)}
          >
            <NavIcon name={icon} />
            <span>{label}</span>
          </button>
        ))}
        <button
          className={`nav-item ${active === "Live Desk" ? "active" : ""}`}
          onClick={() => setActive("Live Desk")}
        >
          <NavIcon name="desk" />
          <span>Live Desk</span>
        </button>
        {isAdmin && (
          <button
            className={`nav-item ${active === "Admin" ? "active" : ""}`}
            onClick={() => setActive("Admin")}
          >
            <NavIcon name="admin" />
            <span>Control room</span>
          </button>
        )}
      </nav>
      <div className="sidebar-bottom">
        <button className="nav-item" onClick={() => setActive("Help")}>
          <NavIcon name="help" />
          <span>Help center</span>
        </button>
        <button
          type="button"
          className="profile profile-button"
          onClick={() => setActive("Account")}
          aria-label="Open account controls"
        >
          <div className="avatar">{initials}</div>
          <div>
            <strong>{profileName}</strong>
            <small>{profileTier}</small>
          </div>
          <NavIcon name="more" size={22} />
        </button>
      </div>
    </aside>
  );
}
const mobileNavItems: { label: string; icon: NavIconName }[] = [
  ...navItems,
  { label: "Live Desk", icon: "desk" },
  { label: "Community", icon: "community" },
  { label: "Help", icon: "help" },
  { label: "Admin", icon: "admin" },
];
function BottomNav({
  active,
  setActive,
  isAdmin = true,
}: {
  active: string;
  setActive: (value: string) => void;
  isAdmin?: boolean;
}) {
  const [compact, setCompact] = useState(false);
  return (
    <nav
      className={`bottom-nav ${compact ? "compact" : ""}`}
      aria-label="Primary navigation"
    >
      <button
        className="bottom-collapse"
        type="button"
        aria-label={compact ? "Expand navigation" : "Minimize navigation"}
        onClick={() => setCompact((value) => !value)}
      >
        <StateSwapIcon
          name={compact ? "plus" : "minus"}
          swapKey={compact ? "nav-expand" : "nav-collapse"}
        />
      </button>
      {mobileNavItems
        .filter((item) => item.label !== "Admin" || isAdmin)
        .map(({ label, icon }) => (
        <button
          key={label}
          className={`bottom-item ${active === label ? "active" : ""}`}
          onClick={() => setActive(label)}
        >
          <span className="bottom-icon">
            {active === label && <i />}
            <NavIcon name={icon} />
          </span>
          <span className="bottom-label">{label}</span>
        </button>
        ))}
    </nav>
  );
}

function Header({
  setActive,
  onNotifications,
  profileName = "Jordan",
  environment = "LIVE",
  isAdmin = true,
  pageTitle = "Dashboard",
  notificationCount = 0,
}: {
  setActive: (view: string) => void;
  onNotifications?: () => void;
  profileName?: string;
  environment?: string;
  isAdmin?: boolean;
  pageTitle?: string;
  notificationCount?: number;
}) {
  const initials =
    profileName
      .split(/\\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "TP";
  return (
    <header className="topbar">
      <div className="mobile-brand">
        <PulseMark size={27} />
        <span>
          TRADE<span>PULSE</span>
        </span>
      </div>
      <div className="page-heading">
        <span className="eyebrow">WORKSPACE / OVERVIEW</span>
        <h1>{pageTitle}</h1>
      </div>
      <div className="welcome">
        <span className="eyebrow">SIGNED IN AS</span>
        <strong>{profileName}</strong>
      </div>
      <div className="top-actions">
        <div className="live-indicator">
          <i />
          {environment}
        </div>
        {isAdmin && (
          <button
            className="icon-button admin-shortcut"
            aria-label="Open control room"
            onClick={() => setActive("Admin")}
          >
            <NavIcon name="admin" />
          </button>
        )}
        <button
          className="icon-button notification"
          aria-label={`Open notifications${notificationCount ? ` (${notificationCount})` : ""}`}
          onClick={() => (onNotifications ? onNotifications() : setActive("Account"))}
        >
          <Bell size={18} />
          {notificationCount > 0 && <b>{notificationCount > 99 ? "99+" : notificationCount}</b>}
        </button>
        <button
          type="button"
          className="top-avatar top-avatar-button"
          aria-label={`Open ${profileName} account controls`}
          onClick={() => setActive("Account")}
        >
          {initials}
        </button>
      </div>
    </header>
  );
}

function CountUp({
  value,
  decimals = 2,
  prefix = "$",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
}) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 900, 1);
      setCurrent(value * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <>
      {prefix}
      {current.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </>
  );
}

type VisualDeskModel = {
  wallet: {
    equity: number;
    available: number;
    locked: number;
    hwm: number;
    tank: number;
    tank_capacity: number;
  };
  tier: string;
  alerts: number;
  quotes: Record<string, number>;
  ledger: Array<{
    kind: string;
    asset: string;
    amount_usd: number;
    status: string;
    created_at: number;
  }>;
  demo: {
    state?: string;
    grant_usd?: number;
    expires_at?: number;
    redemption_ends_at?: number;
    profit_snapshot_usd?: number;
    gift_credit_usd?: number;
    converted_at?: number;
  } | null;
};

function BalanceHero({ wallet }: { wallet?: VisualDeskModel["wallet"] }) {
  const equity = wallet?.equity ?? 24892.42;
  const available = wallet?.available ?? 8420.35;
  const locked = wallet?.locked ?? 16472.07;
  const change = wallet ? equity - wallet.hwm : 2836.12;
  const positive = change >= 0;
  return (
    <GradientPanel className="balance-hero reveal-card">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">TOTAL EQUITY</span>
          <button className="visibility" aria-label="Hide balance">
            •••
          </button>
        </div>
        <span className="positive-chip">
          {positive ? "+" : ""}
          {money(change)}
        </span>
      </div>
      <div className="balance">
        <CountUp value={equity} />
      </div>
      <div className="balance-change">
        {positive ? "+" : ""}
        {money(change)} <span>from high-water mark</span>
      </div>
      <div className="balance-breakdown">
        <div>
          <span>AVAILABLE</span>
          <strong>
            <CountUp value={available} />
          </strong>
        </div>
        <div>
          <span>INVESTED</span>
          <strong>
            <CountUp value={locked} />
          </strong>
        </div>
      </div>
      <div className="hero-chart">
        <svg
          viewBox="0 0 600 100"
          preserveAspectRatio="none"
          aria-label="Equity growth chart"
        >
          <path
            d="M0 81 C35 78 42 72 62 75 S95 53 115 64 S153 56 176 61 S208 45 235 51 S263 65 285 45 S320 48 345 35 S373 43 398 30 S427 42 452 24 S480 33 505 19 S550 27 600 7"
            fill="none"
            stroke="#34D399"
            strokeWidth="2"
          />
        </svg>
      </div>
    </GradientPanel>
  );
}

type BotState = "running" | "paused";
type Bot = {
  id?: number;
  name: string;
  allocation: string;
  equity: string;
  percent: number;
  gain: string;
  state: BotState;
  compound: string;
};
const bots: Bot[] = [
  {
    name: "Memecoin",
    allocation: "$4,250.00",
    equity: "$5,084.20",
    percent: 78,
    gain: "+19.63%",
    state: "running",
    compound: "100%",
  },
  {
    name: "Synthetic",
    allocation: "$8,600.00",
    equity: "$8,112.44",
    percent: 46,
    gain: "-5.67%",
    state: "paused",
    compound: "50%",
  },
];

function BotRing({ percent, state }: { percent: number; state: string }) {
  return (
    <div
      className={`bot-ring ${state}`}
      style={{ "--progress": `${percent * 3.6}deg` } as React.CSSProperties}
    >
      <div className="ring-core">
        <i />
      </div>
    </div>
  );
}
function MiniSparkline({ negative = false }: { negative?: boolean }) {
  return (
    <svg
      className={`mini-sparkline ${negative ? "negative" : ""}`}
      viewBox="0 0 120 38"
      preserveAspectRatio="none"
      aria-label="Bot equity sparkline"
    >
      <path
        d={
          negative
            ? "M2 10 C20 9 24 18 38 14 S57 22 72 17 S91 25 118 30"
            : "M2 30 C17 27 21 19 35 24 S54 9 70 18 S87 8 101 12 S112 6 118 3"
        }
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function BotCard({
  bot,
  onOpen,
}: {
  bot: (typeof bots)[number];
  onOpen?: () => void;
}) {
  return (
    <GradientPanel
      className={`bot-card reveal-card ${onOpen ? "bot-card-openable" : ""}`}
      onClick={onOpen}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(event) => {
        if (onOpen && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      {bot.state === "paused" && (
        <img
          src="/illustrations/engine-paused.png"
          alt="Paused synthetic engine"
          className="illustration-engine-paused pointer-events-none select-none"
          draggable={false}
          decoding="async"
          loading="eager"
        />
      )}
      <div className="bot-card-top">
        <BotRing percent={bot.percent} state={bot.state} />
        <div className="bot-copy">
          <div className="bot-title">
            <strong>{bot.name}</strong>
            <span className={`status-chip ${bot.state}`}>
              <i />
              {bot.state}
            </span>
          </div>
          <span className="bot-allocation">Allocation {bot.allocation}</span>
          <div className="bot-equity">
            <strong>{bot.equity}</strong>
            <span className={bot.state === "paused" ? "down" : "up"}>
              {bot.gain}
            </span>
          </div>
        </div>
      </div>
      <div className="bot-card-bottom">
        <MiniSparkline negative={bot.state === "paused"} />
        <span className="compound-chip">COMPOUND {bot.compound}</span>
      </div>
    </GradientPanel>
  );
}

function StatChips({
  fleet = bots,
  tier = "Pro",
  alerts = 3,
}: {
  fleet?: Bot[];
  tier?: string;
  alerts?: number;
}) {
  const running = fleet.filter((bot) => bot.state === "running").length;
  const paused = fleet.filter((bot) => bot.state === "paused").length;
  return (
    <div className="stat-chips reveal-card">
      {[
        ["RUNNING BOTS", String(running).padStart(2, "0")],
        ["PAUSED", String(paused).padStart(2, "0")],
        ["ALERTS", String(alerts).padStart(2, "0")],
        ["TIER", tier.toUpperCase()],
        ["SLOTS", `${String(fleet.length).padStart(2, "0")} / 02`],
      ].map(([label, value]) => (
        <div className="stat-chip" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}
function PriceStrip({ quotes }: { quotes?: Record<string, number> }) {
  const fallbackPrices = [
    ["BTC/USD", "$67,842.10", "+2.41%", true],
    ["ETH/USD", "$3,842.66", "+1.08%", true],
    ["SOL/USD", "$182.44", "-0.74%", false],
    ["PEPE/USD", "$0.0000124", "+8.92%", true],
  ] as const;
  const prices =
    quotes && Object.keys(quotes).length
      ? Object.entries(quotes)
          .slice(0, 4)
          .map(
            ([asset, value]) =>
              [asset, money(Number(value)), "LIVE", true] as const,
          )
      : fallbackPrices;
  return (
    <div className="price-strip reveal-card">
      {prices.map(([name, price, change, up]) => (
        <div className="ticker" key={name}>
          <span>{name}</span>
          <strong>{price}</strong>
          <small className={up ? "up" : "down"}>
            {up ? "↗" : "↘"} {change}
          </small>
        </div>
      ))}
    </div>
  );
}
function Activity({
  ledger,
  onViewAll,
}: {
  ledger?: VisualDeskModel["ledger"];
  onViewAll?: () => void;
}) {
  const items = ledger
    ? ledger.length
      ? ledger
          .slice(0, 3)
          .map((entry) => {
            const amount = signedActivityAmount(entry.kind, entry.status, entry.amount_usd);
            return [
              entry.kind.replace(/_/g, " "),
              entry.asset,
              `${amount >= 0 ? "+" : ""}${money(amount)}`,
              "recent",
              activityTone(entry.kind, entry.status),
            ];
          })
      : [
          [
            "No activity yet",
            "Verified account events will appear here.",
            "$0.00",
            "—",
            "complete",
          ],
        ]
    : [
        ["Memecoin bot", "Equity rebalance", "+$84.20", "2m", "complete"],
        ["Synthetic bot", "Risk threshold reached", "-$42.80", "18m", "review"],
        ["Deposit received", "USDC · Wallet", "+$1,250.00", "1h", "complete"],
      ];
  return (
    <GradientPanel className="activity-card reveal-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">RECENT ACTIVITY</span>
          <h2>Activity</h2>
        </div>
        <button className="view-all" onClick={onViewAll}>
          View all <ChevronRight size={14} />
        </button>
      </div>
      <div className="activity-list">
        {items.map(([title, sub, amount, time, status]) => (
          <div className="activity-row" key={title}>
            <div className="activity-info">
              <strong>{title}</strong>
              <small>{sub}</small>
            </div>
            <span className={`activity-status ${status}`}>{status}</span>
            <div className="activity-amount">
              <strong className={amount.startsWith("+") ? "up" : "down"}>
                {amount}
              </strong>
              <small>{time}</small>
            </div>
          </div>
        ))}
      </div>
    </GradientPanel>
  );
}
function DemoBanner({
  demo,
  onStart,
  hasFundedDesk = false,
}: {
  demo?: VisualDeskModel["demo"];
  onStart?: () => void;
  hasFundedDesk?: boolean;
}) {
  const active = demo?.state === "active";
  const grant = demo?.grant_usd ?? 2000;
  const feeCredit = Number(demo?.gift_credit_usd || 0);
  // An unstarted virtual offer should never obscure a funded desk. Once it is
  // active, show its actual status instead of repeating the launch invitation.
  if (!demo || (!active && demo.state !== "issued" && feeCredit <= 0)) return null;
  if (demo.state === "issued" && hasFundedDesk) return null;
  return (
    <GradientPanel className="demo-banner reveal-card">
      <div>
        <span className="eyebrow">
          {feeCredit > 0
            ? "DEMO FEE CREDIT"
            : active
              ? "PRACTICE MODE ACTIVE"
              : "PRACTICE MODE"}
        </span>
        <h2>
          {feeCredit > 0
            ? `${money(feeCredit)} fee credit locked`
            : active
              ? "Your virtual demo is active"
              : `Try a ${money(grant)} virtual memecoin demo`}
        </h2>
        <p>
          {feeCredit > 0
            ? "This non-withdrawable credit is already applied against an eligible future mainnet performance fee; it is not cash or wallet balance."
            : active
              ? "Virtual funds are isolated and can never be withdrawn. A fee credit is calculated only after a qualifying verified mainnet deposit and eligible realised demo profit."
              : "Explore the desk with zero risk. Your balance stays untouched."}
        </p>
      </div>
      <img
        src={active || feeCredit > 0 ? "/illustrations/demo-hourglass.png" : "/illustrations/demo-banner.png"}
        alt={active || feeCredit > 0 ? "Virtual demo status" : "Paper money plane flying toward a virtual demo"}
        className="illustration-demo-banner pointer-events-none select-none"
        draggable={false}
        decoding="async"
        loading="eager"
      />
      {!active && feeCredit <= 0 && (
        <button aria-label="Try demo" onClick={onStart}>
          <ChevronRight size={17} />
        </button>
      )}
    </GradientPanel>
  );
}
function EmptyBots({ onLaunch }: { onLaunch?: () => void }) {
  return (
    <GradientPanel className="empty-bots">
      <img
        src="/illustrations/empty-bots.png"
        alt="Empty wallet scene with a butterfly"
        className="illustration-empty-bots pointer-events-none select-none"
        draggable={false}
        decoding="async"
        loading="eager"
      />
      <svg viewBox="0 0 120 38" aria-label="Flatlined pulse">
        <path
          d="M2 20h28l8-9 9 18 8-9h63"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <p>No bots are running yet.</p>
      <button onClick={onLaunch}>
        Launch your first bot <ChevronRight size={14} />
      </button>
    </GradientPanel>
  );
}

const walletActions = [
  { label: "Deposit", icon: Download },
  { label: "Withdraw", icon: Send },
  { label: "History", icon: History },
  { label: "Activity", icon: Zap },
];
function WalletCard({
  label,
  value,
  detail,
  accent = "",
  masked = false,
  onToggleVisibility,
}: {
  label: string;
  value: string;
  detail?: string;
  accent?: string;
  masked?: boolean;
  onToggleVisibility?: () => void;
}) {
  return (
    <GradientPanel className="wallet-stat">
      <div className="panel-heading">
        <span className="eyebrow">{label}</span>
        {onToggleVisibility && (
          <button
            type="button"
            className="visibility"
            aria-label={masked ? "Show wallet balances" : "Hide wallet balances"}
            aria-pressed={!masked}
            onClick={onToggleVisibility}
          >
            <StateIcon name={masked ? "eye-off" : "eye"} size={17} />
          </button>
        )}
      </div>
      <strong className={accent}>{masked ? "••••••" : value}</strong>
      {detail && <small>{detail}</small>}
    </GradientPanel>
  );
}
function StepRail({ current }: { current: number }) {
  return (
    <div className="step-rail">
      {["ASSET", "NETWORK", "CONFIRM"].map((step, index) => (
        <div
          className={
            index < current ? "done" : index === current ? "current" : ""
          }
          key={step}
        >
          <b>0{index + 1}</b>
          <span>{index < current ? "✓" : step}</span>
          {index < 2 && <i />}
        </div>
      ))}
    </div>
  );
}
function WalletOverview({ setView }: { setView: (view: string) => void }) {
  return (
    <div className="wallet-grid">
      <div className="wallet-stat-grid">
        <WalletCard
          label="AVAILABLE"
          value="$8,420.35"
          detail="Ready to deploy"
          accent="mint"
        />
        <WalletCard label="LOCKED" value="$1,280.00" detail="Until 24 Sep" />
        <WalletCard
          label="TOTAL EQUITY"
          value="$24,892.42"
          detail="+12.84% this month"
          accent="mint"
        />
        <WalletCard
          label="HIGH-WATER MARK"
          value="$26,104.18"
          detail="Set 12 Aug"
        />
      </div>
      <GradientPanel className="gas-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">NETWORK GAS TANK</span>
            <h2>Keep actions moving</h2>
          </div>
          <Fuel size={18} />
        </div>
        <div className="gas-meter">
          <div>
            <strong>72%</strong>
            <small>~$14.40 remaining</small>
          </div>
          <div className="gas-track">
            <i />
          </div>
        </div>
        <label className="toggle-row">
          <span>
            Auto-fill when low<small>Uses available USDC</small>
          </span>
          <input type="checkbox" defaultChecked />
          <i />
        </label>
      </GradientPanel>
      <div className="wallet-actions">
        {walletActions.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => setView(label === "History" ? "Ledger" : label)}
          >
            <span>
              <Icon />
            </span>
            <strong>{label}</strong>
            <ChevronRight />
          </button>
        ))}
      </div>
      <GradientPanel className="wallet-promo">
        <ShieldCheck />
        <div>
          <span className="eyebrow">CUSTODY CONTROL</span>
          <h2>Your funds stay yours.</h2>
          <p>
            Every movement is recorded, verified, and visible in your ledger.
          </p>
        </div>
      </GradientPanel>
    </div>
  );
}
function DepositFlow({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);
  return (
    <div className="wallet-flow">
      <button className="back-action" onClick={onBack}>
        <StateIcon name="arrow-left" /> Wallet overview
      </button>
      <StepRail current={step} />
      <GradientPanel className="flow-card">
        <div className="flow-title">
          <div>
            <span className="eyebrow">DEPOSIT · USDC</span>
            <h2>
              {step === 0
                ? "Choose an asset"
                : step === 1
                  ? "Choose a network"
                  : "Send USDC to TradePulse"}
            </h2>
          </div>
          <span className="secure-chip">
            <ShieldCheck /> SECURE
          </span>
        </div>
        {step === 0 && (
          <div className="choice-grid">
            {["USDT", "USDC"].map((asset, i) => (
              <button
                className={i === 1 ? "selected" : ""}
                key={asset}
                onClick={() => setStep(1)}
              >
                <PaymentMark asset={asset} />
                <strong>{asset}</strong>
                <small>{i === 1 ? "USD Coin" : "Tether USD"}</small>
                <ChevronRight />
              </button>
            ))}
          </div>
        )}
        {step === 1 && (
          <div className="choice-grid">
            {[
              ["Base", "Low fees · ~2 min"],
              ["Ethereum", "Higher fees · ~5 min"],
              ["Solana", "Fast · ~1 min"],
            ].map(([network, note]) => (
              <button key={network} onClick={() => setStep(2)}>
                <PaymentMark asset={network} />
                <strong>{network}</strong>
                <small>{note}</small>
                <ChevronRight />
              </button>
            ))}
          </div>
        )}
        {step === 2 && (
          <>
            <div className="qr-placeholder">
              <div className="qr-grid" />
              <small>SCAN TO DEPOSIT USDC ON BASE</small>
            </div>
            <div className="copy-field">
              <code>0x71F4...9aC28D</code>
              <button
                onClick={() => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1200);
                }}
              >
                {copied ? "✓" : <Copy />}
              </button>
            </div>
            <div className="warning-block">
              <strong>Send USDC on Base only</strong>
              <span>
                Sending another asset or network may permanently lose funds.
              </span>
            </div>
            <label className="amount-field">
              <span>EXPECTED AMOUNT</span>
              <input placeholder="0.00 USDC" inputMode="decimal" />
            </label>
            <button className="primary-action" onClick={() => setStep(0)}>
              I made this deposit <ChevronRight />
            </button>
          </>
        )}
      </GradientPanel>
      <GradientPanel className="blocking-banner">
        <X />
        <div>
          <strong>Deposits temporarily unavailable</strong>
          <span>We’re syncing the Base network. Try again shortly.</span>
        </div>
        <button>Check status</button>
      </GradientPanel>
    </div>
  );
}
function DepositTimeline() {
  return (
    <div className="timeline">
      <span className="eyebrow">DEPOSIT TIMELINE</span>
      <img
        src="/illustrations/deposit-credited.png"
        alt="Deposit credited into a secure vault"
        className="deposit-credited-art"
        decoding="async"
      />
      {["Detected", "Verified", "Credited"].map((label, i) => (
        <div className="timeline-row" key={label}>
          <i className={i === 0 ? "active" : ""}>{i === 0 ? "✓" : i + 1}</i>
          <div>
            <strong>{label}</strong>
            <small>
              {i === 0
                ? "Waiting for an incoming transaction"
                : label === "Credited"
                  ? "Balance updates after final confirmation"
                  : "Pending detection"}
            </small>
          </div>
          <span className="status-chip review">pending</span>
        </div>
      ))}
      <div className="below-minimum-card">
        <img
          src="/illustrations/below-minimum.png"
          alt="Small deposit entering a secure vault"
          className="below-minimum-art"
          decoding="async"
        />
        <div>
          <strong>Below minimum deposits are not credited</strong>
          <small>Received $0.00 · Minimum $10.00 · Remaining $10.00</small>
        </div>
      </div>
    </div>
  );
}
function Ledger({ setView }: { setView: (view: string) => void }) {
  const rows = [
    ["USDC deposit", "+$1,250.00", "verified", "Today · 09:12"],
    ["Bot allocation", "-$4,250.00", "complete", "Yesterday · 18:42"],
    ["Withdrawal", "-$800.00", "pending", "18 Sep · 13:08"],
    ["Gas refill", "-$12.40", "complete", "17 Sep · 10:20"],
  ];
  return (
    <div className="ledger-screen">
      <div className="ledger-header">
        <div>
          <span className="eyebrow">WALLET / HISTORY</span>
          <h2>Ledger history</h2>
        </div>
        <button className="view-all" onClick={() => setView("Wallet")}>
          Overview <ChevronRight />
        </button>
      </div>
      <div className="filter-chips">
        <button className="active">All</button>
        <button>Deposits</button>
        <button>Withdrawals</button>
        <button>Bot activity</button>
      </div>
      <GradientPanel className="ledger-card">
        {rows.length > 0 ? (
          rows.map(([title, amount, status, date]) => (
            <div className="ledger-row" key={title}>
              <div>
                <strong>{title}</strong>
                <small>{date} · Base</small>
              </div>
              <span className={`activity-status ${status}`}>{status}</span>
              <code className={amount.startsWith("+") ? "mint" : ""}>
                {amount}
              </code>
            </div>
          ))
        ) : (
          <div className="empty-wallet-state">
            <img
              src="/illustrations/empty-wallet.png"
              alt="Empty wallet"
              decoding="async"
            />
            <strong>No wallet activity yet</strong>
            <small>
              Your deposits, withdrawals, and bot allocations will appear here.
            </small>
          </div>
        )}
      </GradientPanel>
      <div className="minimum-warning">
        <span>!</span>
        <div>
          <strong>Below-minimum deposit</strong>
          <p>
            Received <code>12.00 USDC</code> · minimum <code>25.00 USDC</code> ·
            remaining <code>13.00 USDC</code>
          </p>
          <small>
            Send the remaining amount to the same address to credit this
            deposit.
          </small>
        </div>
      </div>
    </div>
  );
}
function WithdrawFlowLegacy({ onBack }: { onBack: () => void }) {
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("Ethereum");
  const [amount, setAmount] = useState("");
  const [review, setReview] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [enteredSecurityCode, setEnteredSecurityCode] = useState("");
  const networks = ["Ethereum", "BNB", "Solana"];
  const savedWallets = [
    {
      label: "Jordan · BNB",
      network: "BNB",
      address: "0x71F4aB6C8d9E00789abcdef00789aC2",
    },
    {
      label: "Jordan · Ethereum",
      network: "Ethereum",
      address: "0x91F4aB6C8d9E00789abcdef00789bD",
    },
  ];
  const validAddress =
    network === "Solana"
      ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
      : /^0x[a-fA-F0-9]{40}$/.test(address);
  return (
    <div className="wallet-flow">
      <button className="back-action" onClick={onBack}>
        <StateIcon name="arrow-left" /> Wallet overview
      </button>
      <StepRail current={2} />
      <GradientPanel className="flow-card">
        <div className="flow-title">
          <div>
            <span className="eyebrow">WITHDRAW · CROSS-CHECK</span>
            <h2>Send funds safely</h2>
          </div>
          <span className="secure-chip">
            <ShieldCheck /> SECURE
          </span>
        </div>
        <div className="withdrawable-summary">
          <div>
            <span>Withdrawable now</span>
            <strong>$12,696.64 USDC</strong>
          </div>
          <div>
            <span>In Memecoin</span>
            <strong>$5,084.20</strong>
          </div>
          <div>
            <span>In Synthetic</span>
            <strong>$8,112.44</strong>
          </div>
          <small>
            Open positions stay invested until they are released. They cannot be
            withdrawn from this screen.
          </small>
        </div>
        <label className="amount-field">
          <span>NETWORK</span>
          <select
            value={network}
            onChange={(event) => {
              setNetwork(event.target.value);
              setAddress("");
            }}
          >
            {networks.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <div className="saved-destinations">
          <span className="field-caption">SAVED DESTINATIONS</span>
          {savedWallets
            .filter((wallet) => wallet.network === network)
            .map((wallet) => (
              <button
                type="button"
                className="saved-destination"
                key={wallet.address}
                onClick={() => setAddress(wallet.address)}
              >
                <span>{wallet.label}</span>
                <small>
                  {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                </small>
                <ChevronRight />
              </button>
            ))}
        </div>
        <label className="amount-field">
          <span>DESTINATION ADDRESS</span>
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder={
              network === "Solana" ? "Paste Solana address" : "Paste 0x address"
            }
            autoComplete="off"
          />
        </label>
        <p className="minimum-hint">
          Whitelisted addresses are optional and only make this field faster to
          fill. Always cross-check the full address to avoid address-poisoning
          scams.
        </p>
        <label className="amount-field">
          <span>AMOUNT</span>
          <input
            value={amount}
            onChange={(event) =>
              setAmount(event.target.value.replace(/[^0-9.]/g, ""))
            }
            placeholder="0.00 USDC"
            inputMode="decimal"
          />
        </label>
        {message && (
          <p className="warning-copy" role="status">
            {message}
          </p>
        )}
        <button
          className="primary-action"
          onClick={() => {
            const requested = Number(amount);
            const available = 12696.64;
            if (!address) {
              setMessage("Enter or select a destination address");
              return;
            }
            if (!validAddress) {
              setMessage(
                network === "Solana"
                  ? "Enter a valid Solana address"
                  : "Enter a valid 0x wallet address",
              );
              return;
            }
            if (!amount || !Number.isFinite(requested) || requested <= 0) {
              setMessage("Enter a withdrawal amount greater than 0");
              return;
            }
            if (requested > available) {
              setMessage(
                `You can withdraw up to $${available.toFixed(2)} USDC right now`,
              );
              return;
            }
            setMessage("");
            setReview(true);
          }}
        >
          Review withdrawal <ChevronRight />
        </button>
      </GradientPanel>
      {review && (
        <div className="modal-backdrop">
          <GradientPanel className="confirm-modal">
            <span className="eyebrow">FINAL CROSS-CHECK</span>
            <h2>Verify before sending</h2>
            <div className="mono-review">
              <span>NETWORK · {network.toUpperCase()}</span>
              <code>{address}</code>
              <span>AMOUNT · {amount} USDC</span>
            </div>
            <p>
              Withdrawals to non-whitelisted addresses are allowed. Compare
              every character with your trusted destination before confirming.
            </p>
            <button
              className="primary-action"
              onClick={() => {
                setReview(false);
                onBack();
              }}
            >
              Confirm withdrawal
            </button>
            <button className="ghost-action" onClick={() => setReview(false)}>
              Edit details
            </button>
          </GradientPanel>
        </div>
      )}
    </div>
  );
}
function WithdrawFlow({
  onBack,
  securityCode,
  onSetCode,
}: {
  onBack: () => void;
  securityCode: string;
  onSetCode: () => void;
}) {
  const [network, setNetwork] = useState("Ethereum");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("Available balance");
  const [review, setReview] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [message, setMessage] = useState("");
  const available = 12696.64;
  const sources = [
    { label: "Available balance", amount: 12696.64, note: "Ready now" },
    { label: "Memecoin", amount: 5084.2, note: "Available now" },
    { label: "Synthetic", amount: 8112.44, note: "Available now" },
  ];
  const savedWallets = [
    {
      label: "Jordan · Ethereum",
      network: "Ethereum",
      address: "0x91F4aB6C8d9E00789abcdef00789bD",
    },
    {
      label: "Jordan · BNB",
      network: "BNB",
      address: "0x71F4aB6C8d9E00789abcdef00789aC2",
    },
  ];
  const valid =
    network === "Solana"
      ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
      : /^0x[a-fA-F0-9]{40}$/.test(address);
  const requested = Number(amount);
  const selectedSource =
    sources.find((item) => item.label === source) ?? sources[0];
  const submitReview = () => {
    if (!valid)
      return setMessage(
        network === "Solana"
          ? "Enter a valid Solana address."
          : "Enter a valid 0x wallet address.",
      );
    if (!Number.isFinite(requested) || requested <= 0)
      return setMessage("Enter an amount greater than 0.");
    if (requested > selectedSource.amount || requested > available)
      return setMessage(
        `Only $${Math.min(selectedSource.amount, available).toFixed(2)} USDC is withdrawable from this source.`,
      );
    if (!securityCode) {
      setMessage("Set a security code before continuing.");
      onSetCode();
      return;
    }
    setMessage("");
    setReview(true);
  };
  return (
    <div className="wallet-flow">
      <button className="back-action" onClick={onBack}>
        <StateIcon name="arrow-left" /> Wallet overview
      </button>
      <StepRail current={2} />
      <GradientPanel className="flow-card">
        <div className="flow-title">
          <div>
            {submitted && (
              <img
                src="/illustrations/approved-stamp.png"
                alt="Approved"
                className="approved-stamp modal-stamp"
                decoding="async"
              />
            )}
            <span className="eyebrow">WITHDRAW · CROSS-CHECK</span>
            <h2>{submitted ? "Withdrawal submitted" : "Send funds safely"}</h2>
          </div>
          <span className="secure-chip">
            <ShieldCheck /> SECURE
          </span>
        </div>
        {submitted ? (
          <>
            <div className="success-state">
              <img
                src="/illustrations/withdrawal-sent.png"
                alt="Withdrawal sent as a paper airplane"
                className="withdrawal-sent-art"
                decoding="async"
              />
              <strong>Withdrawal queued</strong>
              <span>
                {amount} USDC from {source} to {address}
              </span>
              <small>
                We will update Activity when the network confirms it.
              </small>
            </div>
            <button className="primary-action" onClick={onBack}>
              Back to wallet <ChevronRight />
            </button>
          </>
        ) : (
          <>
            <div className="withdrawable-summary">
              <div>
                <span>Withdrawable now</span>
                <strong>
                  $
                  {available.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </div>
              <small>
                Choose a source below. Open positions that are not released will
                be unavailable.
              </small>
            </div>
            <label className="amount-field">
              <span>WITHDRAW FROM</span>
              <select
                value={source}
                onChange={(event) => {
                  setSource(event.target.value);
                  setAmount("");
                }}
              >
                {sources.map((item) => (
                  <option key={item.label} value={item.label}>
                    {item.label} · $
                    {item.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    · {item.note}
                  </option>
                ))}
              </select>
            </label>
            <label className="amount-field">
              <span>NETWORK</span>
              <select
                value={network}
                onChange={(event) => {
                  setNetwork(event.target.value);
                  setAddress("");
                }}
              >
                {["Ethereum", "BNB", "Solana"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <div className="saved-destinations">
              <span className="field-caption">
                SAVED DESTINATIONS · OPTIONAL AUTOFILL
              </span>
              {savedWallets
                .filter((wallet) => wallet.network === network)
                .map((wallet) => (
                  <button
                    type="button"
                    className="saved-destination"
                    key={wallet.address}
                    onClick={() => setAddress(wallet.address)}
                  >
                    <span>{wallet.label}</span>
                    <small>
                      {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                    </small>
                    <ChevronRight />
                  </button>
                ))}
            </div>
            <label className="amount-field">
              <span>DESTINATION ADDRESS</span>
              <input
                value={address}
                onChange={(event) =>
                  setAddress(event.target.value.replace(/\s/g, ""))
                }
                placeholder={
                  network === "Solana"
                    ? "Paste Solana address"
                    : "Paste 0x address"
                }
              />
            </label>
            <label className="amount-field">
              <span>AMOUNT · USDC</span>
              <input
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value.replace(/[^0-9.]/g, ""))
                }
                placeholder="0.00"
                inputMode="decimal"
              />
            </label>
            {message && (
              <p className="warning-copy" role="status">
                {message}
              </p>
            )}
            <button className="primary-action" onClick={submitReview}>
              Review withdrawal <ChevronRight />
            </button>
          </>
        )}
      </GradientPanel>
      {review && (
        <div
          className="modal-backdrop"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setReview(false);
          }}
        >
          <GradientPanel
            className="confirm-modal account-modal"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Close withdrawal review"
              onClick={() => setReview(false)}
            >
              <X />
            </button>
            <div className="modal-heading">
              <img
                src="/illustrations/approved-stamp.png"
                alt="Approved review"
                className="approved-stamp"
                decoding="async"
              />
              <div>
                <span className="eyebrow">FINAL CROSS-CHECK</span>
                <h2>Confirm withdrawal</h2>
              </div>
            </div>
            <div className="mono-review">
              <span>FROM · {source.toUpperCase()}</span>
              <span>NETWORK · {network.toUpperCase()}</span>
              <code>{address}</code>
              <span>AMOUNT · {amount} USDC</span>
            </div>
            <p>
              Compare the full address with your trusted wallet. Whitelisting
              only provides autofill; this withdrawal is allowed even if the
              address is new.
            </p>
            <button
              className="ghost-action recovery-trigger"
              onClick={() => setMessage("Recovery guidance opened")}
            >
              Wrong network or asset?
            </button>
            {message === "Recovery guidance opened" && (
              <div className="recovery-guide">
                <img
                  src="/illustrations/recovery-lifebuoy.png"
                  alt="Lifebuoy supporting a paper boat"
                  className="recovery-art"
                  decoding="async"
                />
                <strong>Need recovery guidance?</strong>
                <small>
                  Stop and contact support with the transaction hash. Do not
                  send another transfer until the network and asset are
                  confirmed.
                </small>
              </div>
            )}
            <label className="amount-field">
              <span>SECURITY CODE</span>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={confirmCode}
                onChange={(event) =>
                  setConfirmCode(
                    event.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                placeholder="Enter your 6-digit code"
              />
            </label>
            <small className="security-note">
              Required to approve this withdrawal. Demo code:{" "}
            </small>
            <button
              className="primary-action"
              onClick={() => {
                if (confirmCode !== securityCode) {
                  setMessage(
                    "Security code is incorrect. Withdrawal was not submitted.",
                  );
                  return;
                }
                setReview(false);
                if (!securityCode) {
                  setMessage(
                    "Set a 6-digit withdrawal security code before approving withdrawals.",
                  );
                  return;
                }
                setMessage("");
                setSubmitted(true);
              }}
            >
              I cross-checked · Confirm withdrawal <ShieldCheck />
            </button>
            <button className="ghost-action" onClick={() => setReview(false)}>
              Edit details
            </button>
          </GradientPanel>
        </div>
      )}
    </div>
  );
}

function WalletActivity({ setView }: { setView: (view: string) => void }) {
  const items = [
    ["Memecoin bot", "Equity rebalance", "+$84.20", "2m", "complete"],
    ["Synthetic bot", "Risk threshold reached", "-$42.80", "18m", "review"],
    ["Deposit received", "USDC · Wallet", "+$1,250.00", "1h", "complete"],
    ["Gas refill", "Network reserve", "-$12.40", "Yesterday", "complete"],
  ];
  return (
    <div className="ledger-screen">
      <div className="ledger-header">
        <div>
          <span className="eyebrow">WALLET / ACTIVITY</span>
          <h2>Activity</h2>
        </div>
        <button className="view-all" onClick={() => setView("Wallet")}>
          Overview <ChevronRight />
        </button>
      </div>
      <GradientPanel className="ledger-card">
        {items.map(([title, sub, amount, time, status]) => (
          <div className="ledger-row" key={`${title}-${time}`}>
            <div>
              <strong>{title}</strong>
              <small>
                {sub} · {time}
              </small>
            </div>
            <span className={`activity-status ${status}`}>{status}</span>
            <code className={amount.startsWith("+") ? "mint" : ""}>
              {amount}
            </code>
          </div>
        ))}
      </GradientPanel>
    </div>
  );
}
function WalletScreen({
  securityCode,
  onSetCode,
}: {
  securityCode: string;
  onSetCode: () => void;
}) {
  const [view, setView] = useState("Wallet");
  const back = (
    <button
      className="back-action wallet-back"
      onClick={() => setView("Wallet")}
    >
      <StateIcon name="arrow-left" /> Wallet overview
    </button>
  );
  return view === "Wallet" ? (
    <WalletOverview setView={setView} />
  ) : view === "Ledger" ? (
    <>
      <div className="subpage-back">{back}</div>
      <Ledger setView={setView} />
    </>
  ) : view === "Activity" ? (
    <>
      <div className="subpage-back">{back}</div>
      <WalletActivity setView={setView} />
    </>
  ) : view === "Withdraw" ? (
    <WithdrawFlow
      onBack={() => setView("Wallet")}
      securityCode={securityCode}
      onSetCode={onSetCode}
    />
  ) : (
    <DepositFlow onBack={() => setView("Wallet")} />
  );
}

type BotView = "fleet" | "create-product" | "create-amount" | "detail" | "demo";

function BotProductCard({
  name,
  description,
  icon,
  selected,
  onClick,
}: {
  name: string;
  description: string;
  icon: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`product-card ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <span className="product-icon">{icon}</span>
      <span>
        <strong>{name}</strong>
        <small>{description}</small>
      </span>
      <ChevronRight />
    </button>
  );
}
function BotOverviewCard({
  bot,
  onDetail,
}: {
  bot: (typeof bots)[number];
  onDetail: () => void;
}) {
  return (
    <GradientPanel className="fleet-bot-card reveal-card">
      <div className="fleet-bot-head">
        <BotRing percent={bot.percent} state={bot.state} />
        <div>
          <div className="bot-title">
            <strong>{bot.name}</strong>
            <span className={`status-chip ${bot.state}`}>
              <i />
              {bot.state}
            </span>
          </div>
          <span className="eyebrow">ALLOCATION</span>
          <strong className="fleet-amount">{bot.allocation}</strong>
        </div>
      </div>
      <div className="fleet-metrics">
        <div>
          <span>EQUITY</span>
          <strong>{bot.equity}</strong>
        </div>
        <div>
          <span>RETURN</span>
          <strong className={bot.state === "paused" ? "down" : "up"}>
            {bot.gain}
          </strong>
        </div>
        <MiniSparkline negative={bot.state === "paused"} />
      </div>
      <div className="fleet-bot-actions">
        <span className="compound-chip">COMPOUND {bot.compound}</span>
        <button className="small-action" onClick={onDetail}>
          Open detail <ChevronRight />
        </button>
      </div>
    </GradientPanel>
  );
}
function BotCreate({ setView }: { setView: (view: BotView) => void }) {
  const [product, setProduct] = useState("");
  const [amount, setAmount] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [activeModal, setActiveModal] = useState(false);
  if (!product)
    return (
      <div className="bot-flow">
        <div className="flow-kicker">
          <span className="eyebrow">NEW AUTOMATION</span>
          <h2>Choose a product</h2>
          <p>One strategy per slot. Pick the desk that fits your risk.</p>
        </div>
        <div className="product-grid">
          <BotProductCard
            name="Memecoin"
            description="High volatility · 100% crypto"
            icon="M"
            onClick={() => setProduct("Memecoin")}
          />
          <BotProductCard
            name="Synthetic Indices"
            description="Diversified · market-neutral"
            icon="S"
            onClick={() => setProduct("Synthetic Indices")}
          />
        </div>
        <button className="text-action" onClick={() => setActiveModal(true)}>
          Already have an active bot? <ChevronRight />
        </button>
        {activeModal && (
          <div className="modal-backdrop">
            <GradientPanel className="confirm-modal">
              <span className="eyebrow">SLOT LIMIT</span>
              <h2>Keep your fleet focused.</h2>
              <p>
                You already have an active bot. Deploy it from Fleet instead of
                opening a second slot.
              </p>
              <button
                className="primary-action"
                onClick={() => {
                  setActiveModal(false);
                  setView("fleet");
                }}
              >
                Go to Fleet <ChevronRight />
              </button>
              <button
                className="ghost-action"
                onClick={() => setActiveModal(false)}
              >
                Not now
              </button>
            </GradientPanel>
          </div>
        )}
      </div>
    );
  return (
    <div className="bot-flow">
      <button className="back-action" onClick={() => setProduct("")}>
        <StateIcon name="arrow-left" /> Choose another product
      </button>
      <div className="flow-kicker">
        <span className="eyebrow">{product.toUpperCase()} · ALLOCATION</span>
        <h2>Allocation</h2>
      </div>
      <div className="amount-input">
        <span>$</span>
        <input
          value={amount}
          onChange={(event) =>
            setAmount(event.target.value.replace(/[^0-9.]/g, ""))
          }
          placeholder="0.00"
          inputMode="decimal"
          aria-label="Allocation amount"
        />
      </div>
      <div className="quick-amounts">
        {["250", "500", "1,000", "2,500"].map((value) => (
          <button key={value} onClick={() => setAmount(value)}>
            ${value}
          </button>
        ))}
      </div>
      <div className="available-line">
        <span>AVAILABLE TO DEPLOY</span>
        <strong>$8,420.35</strong>
      </div>
      <p className="minimum-hint">
        Minimum allocation is $250.00. You can change compounding after
        deployment.
      </p>
      <button
        className="primary-action"
        disabled={!amount || Number(amount) < 250}
        onClick={() => setConfirm(true)}
      >
        Review allocation <ChevronRight />
      </button>
      {confirm && (
        <div className="modal-backdrop">
          <GradientPanel className="confirm-modal">
            <span className="eyebrow">FINAL REVIEW</span>
            <h2>Confirm deployment</h2>
            <div className="fact-block">
              <span>
                PRODUCT <b>{product}</b>
              </span>
              <span>
                ALLOCATION{" "}
                <b>
                  $
                  {Number(amount).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </b>
              </span>
              <span>
                AVAILABLE AFTER{" "}
                <b>
                  $
                  {(8420.35 - Number(amount)).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </b>
              </span>
              <span>
                COMPOUNDING <b>50%</b>
              </span>
            </div>
            <button
              className="primary-action"
              onClick={() => {
                setConfirm(false);
                setView("detail");
              }}
            >
              Deploy bot <Zap />
            </button>
            <button className="ghost-action" onClick={() => setConfirm(false)}>
              Go back
            </button>
          </GradientPanel>
        </div>
      )}
    </div>
  );
}
function BotDetail({
  setView,
  bot,
  onToggle,
}: {
  setView: (view: BotView) => void;
  bot: (typeof bots)[number];
  onToggle: () => void;
}) {
  const paused = bot.state === "paused";
  const [compound, setCompound] = useState("50%");
  const [close, setClose] = useState(false);
  const [checked, setChecked] = useState(false);
  return (
    <div className="bot-detail">
      <button className="back-action" onClick={() => setView("fleet")}>
        <StateIcon name="arrow-left" /> Fleet overview
      </button>
      <GradientPanel className="detail-hero">
        <div className="detail-ring">
          <BotRing
            percent={bot.percent}
            state={paused ? "paused" : "running"}
          />
        </div>
        <div>
          <span className="eyebrow">{bot.name.toUpperCase()} BOT</span>
          <h2>{bot.name}</h2>
          <span className={`status-chip ${paused ? "paused" : "running"}`}>
            <i />
            {paused ? "paused" : "running"}
          </span>
        </div>
      </GradientPanel>
      <div className="detail-stats">
        {[
          ["ALLOCATION", bot.allocation],
          ["EQUITY", bot.equity],
          ["HIGH-WATER MARK", bot.equity],
        ].map(([label, value]) => (
          <GradientPanel key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </GradientPanel>
        ))}
      </div>
      <GradientPanel className="equity-placeholder">
        <div className="section-heading">
          <div>
            <span className="eyebrow">EQUITY CURVE</span>
            <h2>Performance</h2>
          </div>
          <span className={bot.state === "paused" ? "down" : "up"}>
            {bot.gain}
          </span>
        </div>
        <MiniSparkline />
        <div className="chart-axis">
          <span>01 SEP</span>
          <span>20 SEP</span>
        </div>
      </GradientPanel>
      <GradientPanel className="compound-panel">
        <span className="eyebrow">COMPOUNDING</span>
        <div className="segment-control">
          {["0%", "50%", "100%"].map((value) => (
            <button
              className={compound === value ? "active" : ""}
              key={value}
              onClick={() => setCompound(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </GradientPanel>
      <div className="detail-actions">
        <button className="primary-action" onClick={onToggle}>
          {paused ? "Resume bot" : "Pause bot"} <Zap />
        </button>
        <button className="danger-action" onClick={() => setClose(true)}>
          Close bot <X />
        </button>
      </div>
      {close && (
        <div className="modal-backdrop">
          <GradientPanel className="confirm-modal danger-modal">
            <span className="eyebrow">PERMANENT ACTION</span>
            <h2>Close Memecoin bot?</h2>
            <p>
              Your bot will stop trading and return <strong>$5,084.20</strong>{" "}
              to available balance. This cannot be undone.
            </p>
            <label className="check-confirm">
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => setChecked(event.target.checked)}
              />{" "}
              I understand closing locks in the current equity.
            </label>
            <button
              className="danger-action"
              disabled={!checked}
              onClick={() => {
                setClose(false);
                setView("fleet");
              }}
            >
              Close bot permanently
            </button>
            <button className="ghost-action" onClick={() => setClose(false)}>
              Keep bot
            </button>
          </GradientPanel>
        </div>
      )}
    </div>
  );
}
function OnboardingScreen() {
  return (
    <div className="onboarding-screen">
      <img
        src="/illustrations/onboarding-welcome.png"
        alt="TradePulse onboarding landscape"
        className="onboarding-hero"
        decoding="async"
      />
      <div className="onboarding-copy">
        <span className="eyebrow">WELCOME TO TRADEPULSE</span>
        <h1>Build your desk with confidence.</h1>
        <p>
          Trade, automate, and move funds with clear controls at every step.
        </p>
        <label className="confirm-check">
          <input type="checkbox" /> I agree to the platform terms and risk
          disclosures.
        </label>
        <button className="primary-action">
          Continue to desk <ChevronRight />
        </button>
      </div>
    </div>
  );
}

function DemoScreen() {
  return (
    <div className="demo-screen">
      <GradientPanel className="demo-terms">
        <span className="eyebrow">PRACTICE MODE · DEMO</span>
        <h2>Demo trading</h2>
        <p>
          This demo uses <strong>$50.00 virtual funds</strong>. They are not
          real money, cannot be withdrawn, and never touch your wallet.
        </p>
        <div className="virtual-label">VIRTUAL / NON-WITHDRAWABLE</div>
        <button className="primary-action">
          Activate memecoin demo <ChevronRight />
        </button>
      </GradientPanel>
      <GradientPanel className="demo-activation">
        <div>
          <span className="eyebrow">DEMO ACTIVE</span>
          <h2>$50.00 virtual memecoin</h2>
          <div className="demo-expiry-card">
            <img
              src="/illustrations/demo-hourglass.png"
              alt="Demo time remaining"
              className="demo-hourglass-art"
              decoding="async"
            />
            <div>
              <span className="eyebrow">DEMO EXPIRY</span>
              <strong>
                Expires in <span className="mono">23:59:42</span>
              </strong>
              <small>Virtual funds reset when the demo window closes.</small>
            </div>
            <span className="amber-chip">ENDING SOON</span>
          </div>
        </div>
        <div className="demo-countdown mono">23:59:42</div>
      </GradientPanel>
    </div>
  );
}
function BotsScreen({
  bots,
  onToggle,
}: {
  bots: Bot[];
  onToggle: (name: string) => void;
}) {
  const [view, setView] = useState<BotView>("fleet");
  const [selectedBotName, setSelectedBotName] = useState(bots[0]?.name ?? "");
  const selectedBot =
    bots.find((bot) => bot.name === selectedBotName) ?? bots[0];
  if (view === "create-product" || view === "create-amount")
    return <BotCreate setView={setView} />;
  if (view === "detail" && selectedBot)
    return (
      <BotDetail
        setView={setView}
        bot={selectedBot}
        onToggle={() => onToggle(selectedBot.name)}
      />
    );
  if (view === "demo") return <DemoScreen />;
  return (
    <div className="bots-screen">
      <GradientPanel className="fleet-hero">
        <div>
          <span className="eyebrow">BOT FLEET</span>
          <h2>Bot fleet</h2>
          <p>2 active strategies · $12,850 deployed</p>
        </div>
        <strong>$13,196.64</strong>
      </GradientPanel>
      <div className="fleet-heading">
        <div>
          <span className="eyebrow">YOUR STRATEGIES</span>
          <h2>
            My bots <small>02 / 05</small>
          </h2>
        </div>
        <button
          className="primary-action"
          onClick={() => setView("create-product")}
        >
          <Plus /> Deploy bot
        </button>
      </div>
      {bots.length > 0 ? (
        <div className="fleet-bot-grid">
          {bots.map((bot) => (
            <BotOverviewCard
              key={bot.name}
              bot={bot}
              onDetail={() => {
                setSelectedBotName(bot.name);
                setView("detail");
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyBots />
      )}
      <button className="demo-link" onClick={() => setView("demo")}>
        Explore the $50 virtual demo <ChevronRight />
      </button>
    </div>
  );
}

function Dashboard({
  bots,
  model,
  onManage,
  onTopUp,
  onStartDemo,
  onViewActivity,
  onOpenBot,
}: {
  bots: Bot[];
  model?: VisualDeskModel;
  onManage?: () => void;
  onTopUp?: () => void;
  onStartDemo?: () => void;
  onViewActivity?: () => void;
  onOpenBot?: (bot: Bot) => void;
}) {
  const gasLow = model && model.wallet.tank < model.wallet.tank_capacity * 0.25;
  return (
    <div className="dashboard-grid">
      <BalanceHero wallet={model?.wallet} />
      <StatChips fleet={bots} tier={model?.tier} alerts={model?.alerts} />
      <section className="bots-section reveal-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">AUTOMATION</span>
            <h2>
              My Bots <small>{String(bots.length).padStart(2, "0")}</small>
            </h2>
          </div>
          <button className="view-all" onClick={onManage}>
            Manage <ChevronRight size={14} />
          </button>
        </div>
        <div className="bot-grid">
          {bots.map((bot) => (
            <BotCard
              key={bot.name}
              bot={bot}
              onOpen={() => {
                if (onOpenBot) onOpenBot(bot);
                else onManage?.();
              }}
            />
          ))}
        </div>
      </section>
      <PriceStrip quotes={model?.quotes} />
      {gasLow && (
        <div className="gas-low-banner">
          <img
            src="/illustrations/gas-gauge.png"
            alt="Low gas gauge"
            className="gas-gauge-art"
          />
          <div>
            <span className="eyebrow">NETWORK FEES</span>
            <strong>Gas tank running low</strong>
            <small>
              {money(model.wallet.tank)} of {money(model.wallet.tank_capacity)}{" "}
              remains for bot actions and withdrawals.
            </small>
          </div>
          <button className="amber-chip" onClick={onTopUp}>
            TOP UP
          </button>
        </div>
      )}
      <Activity ledger={model?.ledger} onViewAll={onViewActivity} />
      <DemoBanner
        demo={model?.demo}
        onStart={onStartDemo}
        hasFundedDesk={Boolean(bots.length || (model?.wallet.equity || 0) > 0)}
      />
      <div className="sync-time">
        ACCOUNT SNAPSHOT · LIVE DATA
      </div>
    </div>
  );
}

function InfoTip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="info-tip">
      <button aria-label="More information" onClick={() => setOpen(!open)}>
        ?
      </button>
      {open && <span>{children}</span>}
    </span>
  );
}
function EarnScreen() {
  const [copied, setCopied] = useState(false);
  const [tier, setTier] = useState(false);
  if (tier)
    return (
      <>
        <button className="back-action" onClick={() => setTier(false)}>
          <StateIcon name="arrow-left" /> Referral overview
        </button>
        <TierScreen />
      </>
    );
  return (
    <div className="account-screen">
      <div className="screen-title">
        <div>
          <span className="eyebrow">EARN / REFERRALS</span>
          <h2>Referrals</h2>
        </div>
        <button
          className="share-action"
          onClick={() =>
            navigator.share?.({
              title: "TradePulse",
              text: "Join my TradePulse desk",
            })
          }
        >
          Share
        </button>
      </div>
      <GradientPanel className="invite-card">
        <div>
          <span className="eyebrow">YOUR INVITE LINK</span>
          <code>tradepulse.app/r/jordan-davis</code>
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText("tradepulse.app/r/jordan-davis");
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </GradientPanel>
      <div className="earn-grid">
        <GradientPanel>
          <span className="eyebrow">ACCRUED EARNINGS</span>
          <strong className="big-number">$286.40</strong>
          <small>+ $42.80 this month</small>
        </GradientPanel>
        <GradientPanel>
          <span className="eyebrow">ACTIVE REFERRALS</span>
          <strong className="big-number">12</strong>
          <small>3 qualified this month</small>
        </GradientPanel>
      </div>
      <GradientPanel className="levels-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">REFERRAL LEVELS</span>
            <h2>Share the upside</h2>
          </div>
          <InfoTip>
            Level 1 earns 5% of eligible fees. Level 2 earns 2%.
          </InfoTip>
        </div>
        {[
          ["01", "Direct referrals", "5.0%", "8"],
          ["02", "Second degree", "2.0%", "4"],
          ["03", "Community bonus", "1.0%", "0"],
        ].map((row) => (
          <div className="level-row" key={row[0]}>
            <b>{row[0]}</b>
            <span>
              {row[1]}
              <small>{row[3]} people</small>
            </span>
            <strong>{row[2]}</strong>
          </div>
        ))}
      </GradientPanel>
      <GradientPanel className="leaderboard">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LEADERBOARD</span>
            <h2>Top desks</h2>
          </div>
          <button className="view-all" onClick={() => setTier(!tier)}>
            {tier ? "Hide tier" : "View tier"} <ChevronRight />
          </button>
        </div>
        {[
          ["01", "Maya Chen", "$1,284.20"],
          ["02", "Alex Rivera", "$982.40"],
          ["03", "Jordan Davis", "$286.40"],
          ["04", "Noah Kim", "$214.10"],
          ["05", "Sofia Patel", "$180.00"],
        ].map((row) => (
          <div className="leader-row" key={row[0]}>
            <b className={Number(row[0]) < 4 ? "medal" : ""}>{row[0]}</b>
            <span>{row[1]}</span>
            <code>{row[2]}</code>
          </div>
        ))}
      </GradientPanel>
    </div>
  );
}
function TierScreen() {
  return (
    <div className="account-screen">
      <div className="screen-title">
        <div>
          <span className="eyebrow">ACCOUNT / TIER</span>
          <h2>Pro desk status</h2>
        </div>
        <span className="tier-badge">PRO</span>
      </div>
      <GradientPanel className="tier-hero">
        <span className="eyebrow">CURRENT TIER</span>
        <strong>PRO</strong>
        <p>
          Performance fee <b>10%</b>{" "}
          <InfoTip>
            Applied only to gross profit above your high-water mark.
          </InfoTip>
        </p>
        <div className="tier-progress">
          <i />
        </div>
        <small>$12,850 / $25,000 capital to Elite</small>
      </GradientPanel>
      <GradientPanel className="tier-table">
        <div className="table-row table-head">
          <span>TIER</span>
          <span>CAPITAL</span>
          <span>FEE</span>
        </div>
        {[
          ["Starter", "$0", "$25k", "15%"],
          ["Pro", "$5k", "$25k", "10%"],
          ["Elite", "$25k+", "—", "7%"],
        ].map((r) => (
          <div
            className={`table-row ${r[0] === "Pro" ? "current" : ""}`}
            key={r[0]}
          >
            <b>{r[0]}</b>
            <span>
              {r[1]}–{r[2]}
            </span>
            <strong>{r[3]}</strong>
          </div>
        ))}
      </GradientPanel>
      <GradientPanel className="calculator">
        <span className="eyebrow">ILLUSTRATION · NOT A PROJECTION</span>
        <h2>Capital + gross profit</h2>
        <div className="calc-values">
          <div>
            <small>CAPITAL</small>
            <strong>$10,000</strong>
          </div>
          <div>
            <small>GROSS PROFIT</small>
            <strong>$1,000</strong>
          </div>
          <div>
            <small>FEE AT PRO</small>
            <strong>$100</strong>
          </div>
        </div>
        <p>
          Fees apply above the high-water mark only.{" "}
          <InfoTip>
            HWM means the highest prior equity level used to prevent paying
            performance fees twice.
          </InfoTip>
        </p>
      </GradientPanel>
      <GradientPanel className="stake-card">
        <span className="eyebrow">STAKE INFO</span>
        <h2>Keep your tier active</h2>
        <p>
          Stake requirements are informational and do not lock or move your
          funds.
        </p>
      </GradientPanel>
    </div>
  );
}
function AccountSection({
  storedCode,
  onStoredCodeChange,
  openCode,
  onCodeSaved,
}: {
  storedCode: string;
  onStoredCodeChange: (code: string) => void;
  openCode?: boolean;
  onCodeSaved?: () => void;
}) {
  useEffect(() => {
    if (openCode) setModal("code");
  }, [openCode]);
  const [modal, setModal] = useState<
    "code" | "notifications" | "whitelist" | "reset" | ""
  >("");
  const [saved, setSaved] = useState(false);
  const [currentCode, setCurrentCode] = useState<string[]>(Array(6).fill(""));
  const [newCode, setNewCode] = useState<string[]>(Array(6).fill(""));
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(6).fill(""));
  const [securityMessage, setSecurityMessage] = useState("");
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    "Trade fills": true,
    "Fees charged": true,
    Deposits: true,
    "Tank low": true,
    "HWM break": true,
  });
  const [reset, setReset] = useState(false);
  const [toast, setToast] = useState("");
  const [whitelistAddress, setWhitelistAddress] = useState("");
  const [whitelistChain, setWhitelistChain] = useState("");
  const [whitelistNickname, setWhitelistNickname] = useState("");
  const [savedWallets, setSavedWallets] = useState([
    {
      chain: "BNB Smart Chain",
      nickname: "Jordan · BNB",
      address: "0x71F4...9aC28D",
    },
  ]);
  const [reviewWallet, setReviewWallet] = useState<{
    chain: string;
    address: string;
    nickname: string;
  } | null>(null);
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };
  const chainOptions = [
    "Ethereum · ERC-20",
    "BNB Smart Chain · BEP-20",
    "Solana · SPL",
  ];
  const chainPatternFor = (chain: string, address: string) =>
    chain.toLowerCase().includes("solana")
      ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
      : /^0x[a-fA-F0-9]{40}$/.test(address);
  const selectedChain = whitelistChain.toLowerCase();
  const chainPattern = selectedChain.includes("solana")
    ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
    : /^0x[a-fA-F0-9]{40}$/;
  const addressHint = selectedChain.includes("solana")
    ? "Solana addresses are 32–44 base58 characters."
    : "Use the 42-character 0x address for this EVM network.";
  return (
    <div className="account-screen">
      <div className="screen-title">
        <div>
          <span className="eyebrow">ACCOUNT / SECURITY</span>
          <h2>Desk controls</h2>
        </div>
        <div className="security-chip">SECURE</div>
      </div>
      {reset && (
        <div className="account-feedback" role="status">
          <span className="status-chip running">
            <i />
            Desk reset applied
          </span>
          <small>
            Active desk settings were cleared. Financial records remain intact.
          </small>
        </div>
      )}
      <GradientPanel className="profile-card">
        <div className="top-avatar">JD</div>
        <div>
          <strong>Jordan Davis</strong>
          <small>Pro account · verified email</small>
        </div>
        <span className="status-chip running">
          <i />
          protected
        </span>
      </GradientPanel>
      <div className="account-actions">
        <button className="account-action" onClick={() => setModal("code")}>
          <span>
            <ShieldCheck />
          </span>
          <div>
            <strong>Withdrawal security code</strong>
            <small>
              {saved ? "Active · tap to change" : "Not set · protect approvals"}
            </small>
          </div>
          <ChevronRight />
        </button>
        <button
          className="account-action"
          onClick={() => setModal("notifications")}
        >
          <span>
            <Bell />
          </span>
          <div>
            <strong>Notifications</strong>
            <small>
              {Object.values(notifications).filter(Boolean).length} alerts
              enabled
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
            <small>
              {savedWallets.length} saved destination
              {savedWallets.length === 1 ? "" : "s"}
            </small>
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
            <strong>Reset desk</strong>
            <small>Retains all financial records</small>
          </div>
          <ChevronRight />
        </button>
      </div>
      {modal && (
        <div
          className="modal-backdrop"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setModal("");
          }}
        >
          <GradientPanel
            className="confirm-modal account-modal"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Close"
              onClick={() => setModal("")}
            >
              <X />
            </button>
            {modal === "code" && (
              <>
                <img
                  src="/illustrations/security-key.png"
                  alt="Security key"
                  className="security-key-art"
                  decoding="async"
                />
                <span className="eyebrow">SECURITY / WITHDRAWALS</span>
                <h2>{saved ? "Change security code" : "Set security code"}</h2>
                <p>
                  {saved
                    ? "Enter your current 6-digit code, then choose a new code."
                    : "This code is required before approving withdrawals. Keep it private."}
                </p>
                {saved && (
                  <>
                    <span className="field-caption">CURRENT CODE</span>
                    <div className="code-boxes">
                      {Array.from({ length: 6 }, (_, i) => (
                        <input
                          key={i}
                          type="password"
                          inputMode="numeric"
                          maxLength={1}
                          value={currentCode[i]}
                          onChange={(event) => {
                            const digit = event.target.value
                              .replace(/[^0-9]/g, "")
                              .slice(-1);
                            setCurrentCode((previous) =>
                              previous.map((value, index) =>
                                index === i ? digit : value,
                              ),
                            );
                            if (digit)
                              (
                                event.currentTarget
                                  .nextElementSibling as HTMLInputElement | null
                              )?.focus();
                          }}
                          onKeyDown={(event) => {
                            if (
                              event.key === "Backspace" &&
                              !event.currentTarget.value &&
                              i > 0
                            ) {
                              event.preventDefault();
                              (
                                event.currentTarget
                                  .previousElementSibling as HTMLInputElement | null
                              )?.focus();
                            }
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
                <span className="field-caption">
                  {saved ? "NEW CODE" : "6-DIGIT CODE"}
                </span>
                <div className="code-boxes">
                  {Array.from({ length: 6 }, (_, i) => (
                    <input
                      key={i}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={saved ? newCode[i] : codeDigits[i]}
                      onChange={(event) => {
                        const digit = event.target.value
                          .replace(/[^0-9]/g, "")
                          .slice(-1);
                        const setter = saved ? setNewCode : setCodeDigits;
                        setter((previous) =>
                          previous.map((value, index) =>
                            index === i ? digit : value,
                          ),
                        );
                        if (digit)
                          (
                            event.currentTarget
                              .nextElementSibling as HTMLInputElement | null
                          )?.focus();
                      }}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Backspace" &&
                          !event.currentTarget.value &&
                          i > 0
                        ) {
                          event.preventDefault();
                          (
                            event.currentTarget
                              .previousElementSibling as HTMLInputElement | null
                          )?.focus();
                        }
                      }}
                    />
                  ))}
                </div>
                {securityMessage && (
                  <div className="security-feedback" role="status">
                    <img
                      src="/illustrations/approved-stamp.png"
                      alt="Saved"
                      className="approved-stamp"
                    />
                    <p>{securityMessage}</p>
                  </div>
                )}
                <button
                  className="primary-action"
                  onClick={() => {
                    const next = (saved ? newCode : codeDigits).join("");
                    if (saved && currentCode.join("") !== storedCode)
                      return setSecurityMessage(
                        "Current security code is incorrect.",
                      );
                    if (next.length !== 6)
                      return setSecurityMessage("Enter all 6 digits.");
                    onStoredCodeChange(next);
                    onCodeSaved?.();
                    setSaved(true);
                    setCodeDigits(Array(6).fill(""));
                    setNewCode(Array(6).fill(""));
                    setCurrentCode(Array(6).fill(""));
                    setSecurityMessage("");
                    setModal("");
                    notify(
                      "Security code saved. It is required for withdrawals.",
                    );
                  }}
                >
                  Save code <ShieldCheck />
                </button>
              </>
            )}
            {modal === "notifications" && (
              <>
                <span className="eyebrow">ACCOUNT / ALERTS</span>
                <h2>Notification settings</h2>
                <p>Choose which desk events reach you.</p>
                {[
                  "Trade fills",
                  "Fees charged",
                  "Deposits",
                  "Tank low",
                  "HWM break",
                ].map((label) => (
                  <label className="toggle-row" key={label}>
                    <span>
                      {label}
                      <small>Push and in-app alert</small>
                    </span>
                    <input
                      className="settings-toggle"
                      type="checkbox"
                      role="switch"
                      checked={notifications[label]}
                      aria-label={`Toggle ${label} notifications`}
                      onChange={() =>
                        setNotifications((previous) => ({
                          ...previous,
                          [label]: !previous[label],
                        }))
                      }
                    />
                    <i />
                  </label>
                ))}
                <button className="primary-action" onClick={() => setModal("")}>
                  Done <ChevronRight />
                </button>
              </>
            )}
            {modal === "whitelist" && (
              <>
                <span className="eyebrow">WALLET / DESTINATIONS</span>
                <h2>Withdrawal whitelist</h2>
                <p>
                  Saved addresses are shown here. A new address is never
                  silently trusted.
                </p>
                {savedWallets.map((wallet) => (
                  <div
                    className="whitelist-item"
                    key={`${wallet.chain}-${wallet.address}`}
                  >
                    <PaymentMark asset={wallet.chain} />
                    <div>
                      <strong>
                        {wallet.nickname} · {wallet.chain}
                      </strong>
                      <small className="mono">{wallet.address}</small>
                    </div>
                    <button
                      className="ghost-action"
                      disabled={actionPending}
                      onClick={() => {
                        setSavedWallets((wallets) =>
                          wallets.filter(
                            (item) => item.address !== wallet.address,
                          ),
                        );
                        notify("Whitelisted address removed");
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="whitelist-form">
                  <select
                    className="modal-input"
                    aria-label="Withdrawal network"
                    value={whitelistChain}
                    onChange={(event) => setWhitelistChain(event.target.value)}
                  >
                    <option value="">Choose withdrawal network</option>
                    {chainOptions.map((chain) => (
                      <option key={chain} value={chain}>
                        {chain}
                      </option>
                    ))}
                  </select>
                  <input
                    className="modal-input"
                    placeholder="Full wallet address"
                    aria-label="Wallet address"
                    value={whitelistAddress}
                    onChange={(event) =>
                      setWhitelistAddress(event.target.value.replace(/\s/g, ""))
                    }
                  />
                  <input
                    className="modal-input"
                    placeholder="Nickname"
                    aria-label="Wallet nickname"
                    value={whitelistNickname}
                    onChange={(event) =>
                      setWhitelistNickname(event.target.value)
                    }
                  />
                </div>
                <small className="warning-copy">
                  Always cross-check the full address and network.
                  Address-poisoning scams use lookalike addresses.
                </small>
                {whitelistAddress && !chainPattern.test(whitelistAddress) && (
                  <small className="warning-copy">{addressHint}</small>
                )}
                <button
                  className="primary-action"
                  onClick={() => {
                    if (!whitelistChain) {
                      notify("Choose Ethereum, BNB, or Solana first");
                      return;
                    }
                    if (!whitelistAddress) {
                      notify("Enter the full wallet address");
                      return;
                    }
                    if (!chainPattern.test(whitelistAddress)) {
                      notify(addressHint);
                      return;
                    }
                    setReviewWallet({
                      chain: whitelistChain,
                      address: whitelistAddress,
                      nickname: whitelistNickname || "New destination",
                    });
                  }}
                >
                  Review address <ChevronRight />
                </button>
              </>
            )}
            {modal === "reset" && (
              <>
                <span className="eyebrow">DANGER / DESK RESET</span>
                <h2>Reset this desk?</h2>
                <p className="danger-copy">
                  This clears active desk settings and bots. All financial
                  records, ledger history, and withdrawal records are retained.
                </p>
                <label className="confirm-check">
                  <input id="reset-confirm" type="checkbox" /> I understand this
                  cannot be undone.
                </label>
                <button
                  className="danger-action"
                  onClick={() => {
                    const checkbox = document.getElementById(
                      "reset-confirm",
                    ) as HTMLInputElement | null;
                    if (!checkbox?.checked) {
                      notify("Confirm the reset impact first");
                      return;
                    }
                    setReset(true);
                    setModal("");
                    notify("Desk reset applied · financial records retained");
                  }}
                >
                  Reset desk
                </button>
              </>
            )}
          </GradientPanel>
        </div>
      )}
      {reviewWallet && (
        <div
          className="modal-backdrop"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setReviewWallet(null);
          }}
        >
          <GradientPanel
            className="confirm-modal account-modal"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Close address review"
              onClick={() => setReviewWallet(null)}
            >
              <X />
            </button>
            <span className="eyebrow">SECURITY / ADDRESS REVIEW</span>
            <h2>Cross-check before saving</h2>
            <p>
              Confirm every character against your wallet app. This protects
              against address-poisoning scams.
            </p>
            <div className="facts-block mono">
              <label>
                NETWORK
                <select
                  className="modal-input"
                  aria-label="Review withdrawal network"
                  value={reviewWallet.chain}
                  onChange={(event) =>
                    setReviewWallet({
                      ...reviewWallet,
                      chain: event.target.value,
                    })
                  }
                >
                  {chainOptions.map((chain) => (
                    <option key={chain} value={chain}>
                      {chain}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                FULL ADDRESS
                <input
                  className="modal-input mono"
                  aria-label="Review full wallet address"
                  value={reviewWallet.address}
                  onChange={(event) =>
                    setReviewWallet({
                      ...reviewWallet,
                      address: event.target.value.replace(/\s/g, ""),
                    })
                  }
                />
              </label>
              <label>
                NICKNAME
                <input
                  className="modal-input"
                  aria-label="Review wallet nickname"
                  value={reviewWallet.nickname}
                  onChange={(event) =>
                    setReviewWallet({
                      ...reviewWallet,
                      nickname: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            <p className="warning-copy">
              TradePulse does not verify ownership. Cross-check every character,
              network, and the first and last six characters in your wallet app
              before saving.
            </p>
            <button
              className="primary-action"
              disabled={
                !chainOptions.includes(reviewWallet.chain) ||
                !chainPatternFor(reviewWallet.chain, reviewWallet.address)
              }
              onClick={() => {
                setSavedWallets((wallets) => [...wallets, reviewWallet]);
                setWhitelistAddress("");
                setWhitelistChain("");
                setWhitelistNickname("");
                setReviewWallet(null);
                setModal("");
                notify("Address saved · 24-hour cooling period started");
              }}
            >
              I cross-checked · Save address <ShieldCheck />
            </button>
            <button
              className="ghost-action"
              onClick={() => setReviewWallet(null)}
            >
              Edit address
            </button>
          </GradientPanel>
        </div>
      )}
      {toast && (
        <div className="desk-toast" role="status">
          <img
            src={
              toast.startsWith("Alert")
                ? "/illustrations/alert-bell.png"
                : "/illustrations/approved-stamp.png"
            }
            alt={toast.startsWith("Alert") ? "Alert" : "Approved"}
            className={
              toast.startsWith("Alert") ? "alert-toast-art" : "approved-stamp"
            }
          />
          {toast}
        </div>
      )}
    </div>
  );
}

function AccountScreen({
  securityCode,
  onStoredCodeChange,
  openCode,
  onCodeSaved,
}: {
  securityCode: string;
  onStoredCodeChange: (code: string) => void;
  openCode?: boolean;
  onCodeSaved?: () => void;
}) {
  return (
    <AccountSection
      storedCode={securityCode}
      onStoredCodeChange={onStoredCodeChange}
      openCode={openCode}
      onCodeSaved={onCodeSaved}
    />
  );
}

function LegacyAccountScreen() {
  const [code, setCode] = useState("");
  const [added, setAdded] = useState(false);
  return (
    <div className="account-screen">
      <div className="screen-title">
        <div>
          <span className="eyebrow">ACCOUNT / SECURITY</span>
          <h2>Desk controls</h2>
        </div>
        <div className="security-chip">SECURE</div>
      </div>
      <GradientPanel className="profile-card">
        <div className="top-avatar">JD</div>
        <div>
          <strong>Jordan Davis</strong>
          <small>Pro account · verified email</small>
        </div>
        <span className="status-chip running">
          <i />
          protected
        </span>
      </GradientPanel>
      <GradientPanel className="security-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SECURITY CODE</span>
            <h2>{code.length === 6 ? "Code saved" : "Protect withdrawals"}</h2>
          </div>
          <ShieldCheck />
        </div>
        {code.length === 6 ? (
          <div className="security-saved">
            <span className="status-chip running">
              <i />
              active
            </span>
            <strong>Withdrawal code is set</strong>
            <small>
              Your code is required before approving withdrawals. Keep it
              private.
            </small>
            <button className="small-action" onClick={() => setCode("")}>
              Change code
            </button>
          </div>
        ) : (
          <>
            <div className="code-boxes">
              {Array.from({ length: 6 }, (_, i) => (
                <input
                  key={i}
                  id={`security-code-${i}`}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  value={code[i] || ""}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    if (!digits) return;
                    setCode((current) => {
                      const next = current.split("");
                      digits
                        .slice(0, 6 - i)
                        .split("")
                        .forEach((digit, offset) => {
                          next[i + offset] = digit;
                        });
                      return next.join("").slice(0, 6);
                    });
                    const nextIndex = Math.min(i + digits.length, 5);
                    document
                      .getElementById(`security-code-${nextIndex}`)
                      ?.focus();
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const digits = e.clipboardData
                      .getData("text")
                      .replace(/\D/g, "")
                      .slice(0, 6 - i);
                    if (!digits) return;
                    setCode((current) => {
                      const next = current.split("");
                      digits.split("").forEach((digit, offset) => {
                        next[i + offset] = digit;
                      });
                      return next.join("").slice(0, 6);
                    });
                    document
                      .getElementById(
                        `security-code-${Math.min(i + digits.length, 5)}`,
                      )
                      ?.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !code[i] && i > 0)
                      document
                        .getElementById(`security-code-${i - 1}`)
                        ?.focus();
                  }}
                  aria-label={`Security code digit ${i + 1}`}
                />
              ))}
            </div>
            <small>
              Six digits required before withdrawals can be approved.
            </small>
          </>
        )}
      </GradientPanel>
      <GradientPanel className="whitelist-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">WITHDRAWAL WHITELIST</span>
            <h2>Saved destinations</h2>
          </div>
          <button className="small-action" onClick={() => setAdded(!added)}>
            {added ? "Saved" : "Add address"}
          </button>
        </div>
        {added && (
          <div className="whitelist-form">
            <input placeholder="Chain · Base" />
            <input placeholder="Wallet address" />
            <input placeholder="Nickname" />
          </div>
        )}
        <div className="address-row">
          <PaymentMark asset="BASE" />
          <div>
            <strong>Base · Treasury</strong>
            <code>0x71F4...9aC28D</code>
          </div>
          <span className="status-chip complete">approved</span>
        </div>
        <p>
          New addresses have a 24-hour cooling period.{" "}
          <InfoTip>
            Cooling protects your desk if a security code is compromised.
          </InfoTip>
        </p>
      </GradientPanel>
      <GradientPanel className="notifications">
        <div className="section-heading">
          <div>
            <span className="eyebrow">NOTIFICATIONS</span>
            <h2>Keep me informed</h2>
          </div>
          <Bell />
        </div>
        {["Fills", "Fees", "Deposits", "Tank low", "HWM break"].map(
          (label, i) => (
            <label className="toggle-row" key={label}>
              <span>
                {label}
                <small>Send a desk alert</small>
              </span>
              <input type="checkbox" defaultChecked={i < 3} />
              <i />
            </label>
          ),
        )}
      </GradientPanel>
      <GradientPanel className="reset-card">
        <span className="eyebrow">RESET DESK</span>
        <h2>Start fresh, keep the record.</h2>
        <p>
          Resetting removes saved preferences and active sessions, but retains
          all financial records.
        </p>
        <button className="danger-action">
          Reset desk <X />
        </button>
      </GradientPanel>
    </div>
  );
}

function Spark({ down = false }: { down?: boolean }) {
  return (
    <svg
      className={`desk-spark ${down ? "down" : ""}`}
      viewBox="0 0 110 30"
      preserveAspectRatio="none"
      aria-label="Price sparkline"
    >
      <path
        d={
          down
            ? "M2 6 C18 4 20 16 34 12 S53 9 66 18 S89 16 108 26"
            : "M2 24 C16 25 20 13 34 18 S51 4 66 12 S88 7 108 2"
        }
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
function LiveDesk() {
  const [alert, setAlert] = useState(false);
  const prices = [
    ["BTC/USD", "$67,842.10", "+2.41%", false],
    ["ETH/USD", "$3,842.66", "+1.08%", false],
    ["SOL/USD", "$182.44", "-0.74%", true],
    ["PEPE/USD", "$0.0000124", "+8.92%", false],
  ] as const;
  return (
    <div className="desk-screen">
      <div className="screen-title">
        <div>
          <span className="eyebrow">LIVE DESK / MARKET DATA</span>
          <h2>Price board</h2>
        </div>
        <span className="live-indicator">
          <i />
          LIVE
        </span>
      </div>
      <GradientPanel className="price-board">
        {prices.map(([name, price, change, down]) => (
          <div className="asset-row" key={name}>
            <span className="asset-ident">{name[0]}</span>
            <div>
              <strong>{name}</strong>
              <small>Spot market</small>
            </div>
            <strong className="asset-price">{price}</strong>
            <span className={`activity-status ${down ? "review" : "complete"}`}>
              {change}
            </span>
            <Spark down={down as boolean} />
          </div>
        ))}
      </GradientPanel>
      <div className="desk-columns">
        <GradientPanel className="pulse-feed">
          <div className="section-heading">
            <div>
              <span className="eyebrow">MARKET PULSE</span>
              <h2>What is moving</h2>
            </div>
            <span className="mono">LIVE</span>
          </div>
          {[
            "PEPE breaks 24h high resistance",
            "BTC volume is accelerating",
            "SOL pullback meets support",
          ].map((item, i) => (
            <div className="audit-row" key={item}>
              <span className="status-dot" />
              <div>
                <strong>{item}</strong>
                <small>{i + 2}m ago · automated signal</small>
              </div>
            </div>
          ))}
        </GradientPanel>
        <GradientPanel className="alert-card">
          <span className="eyebrow">ALERT COMPOSER</span>
          <h2>Get the signal first.</h2>
          <div className="alert-fields">
            <select aria-label="Alert asset" defaultValue="BTC/USD">
              <option>BTC/USD</option>
              <option>ETH/USD</option>
              <option>PEPE/USD</option>
            </select>
            <select aria-label="Alert condition" defaultValue="above">
              <option>above</option>
              <option>below</option>
            </select>
            <input aria-label="Alert price" defaultValue="70000" />
          </div>
          <div className="parsed-preview">
            <span>PARSED PREVIEW</span>
            <code>BTC/USD above $70,000</code>
          </div>
          <button className="primary-action" onClick={() => setAlert(true)}>
            Create alert <Bell />
          </button>
          {alert && (
            <div className="toast-inline">
              <span className="status-dot" />
              Alert active �� monitoring BTC/USD
            </div>
          )}
        </GradientPanel>
      </div>
      <GradientPanel className="active-alerts">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ACTIVE ALERTS</span>
            <h2>Watching 2 conditions</h2>
          </div>
          <button className="small-action">Clear all</button>
        </div>
        {[
          ["BTC/USD above $70,000", "Created today"],
          ["PEPE/USD below $0.000010", "Created yesterday"],
        ].map((item) => (
          <div className="audit-row" key={item[0]}>
            <span className="alert-pip" />
            <div>
              <strong>{item[0]}</strong>
              <small>{item[1]}</small>
            </div>
            <button className="icon-button" aria-label="Remove alert">
              <X />
            </button>
          </div>
        ))}
      </GradientPanel>
      <GradientPanel className="announcements">
        <span className="eyebrow">ANNOUNCEMENTS</span>
        <h2>Desk notices</h2>
        <div className="audit-row">
          <span className="status-dot" />
          <div>
            <strong>Base network maintenance window</strong>
            <small>Withdrawals may take longer · 18 Sep 2026</small>
          </div>
        </div>
      </GradientPanel>
    </div>
  );
}
function LiveDeskFinal() {
  const [alertCreated, setAlertCreated] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [toast, setToast] = useState("");
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };
  const prices = [
    ["BTC/USD", "$67,842.10", "+2.41%", false],
    ["ETH/USD", "$3,842.66", "+1.08%", false],
    ["SOL/USD", "$182.44", "-0.74%", true],
    ["PEPE/USD", "$0.0000124", "+8.92%", false],
  ] as const;
  return (
    <div className="desk-screen">
      <div className="screen-title">
        <div>
          <span className="eyebrow">LIVE DESK / MARKET DATA</span>
          <h2>Price board</h2>
        </div>
        <span className="live-indicator">
          <i />
          LIVE
        </span>
      </div>
      <GradientPanel className="price-board">
        {prices.map(([name, price, change, down]) => (
          <div className="asset-row" key={name}>
            <span className="asset-ident">{name[0]}</span>
            <div>
              <strong>{name}</strong>
              <small>Spot market</small>
            </div>
            <strong className="asset-price">{price}</strong>
            <span className={`activity-status ${down ? "review" : "complete"}`}>
              {change}
            </span>
            <Spark down={down as boolean} />
          </div>
        ))}
      </GradientPanel>
      <div className="desk-columns">
        <GradientPanel className="pulse-feed">
          <div className="section-heading">
            <div>
              <span className="eyebrow">MARKET PULSE</span>
              <h2>What is moving</h2>
            </div>
            <span className="mono">LIVE</span>
          </div>
          {[
            "PEPE breaks 24h high resistance",
            "BTC volume is accelerating",
            "SOL pullback meets support",
          ].map((item, i) => (
            <div className="audit-row" key={item}>
              <span className="status-dot" />
              <div>
                <strong>{item}</strong>
                <small>{i + 2}m ago · automated signal</small>
              </div>
            </div>
          ))}
        </GradientPanel>
        <GradientPanel className="alert-card">
          <span className="eyebrow">ALERT COMPOSER</span>
          <h2>Get the signal first.</h2>
          <div className="alert-fields">
            <select aria-label="Alert asset" defaultValue="BTC/USD">
              <option>BTC/USD</option>
              <option>ETH/USD</option>
              <option>PEPE/USD</option>
            </select>
            <select aria-label="Alert condition" defaultValue="above">
              <option>above</option>
              <option>below</option>
            </select>
            <input aria-label="Alert price" defaultValue="70000" />
          </div>
          <div className="parsed-preview">
            <span>PARSED PREVIEW</span>
            <code>BTC/USD above $70,000</code>
          </div>
          <button
            className="primary-action"
            onClick={() => {
              setAlertCreated(true);
              notify("Alert armed for BTC/USD above $70,000");
            }}
          >
            {alertCreated ? "Alert active" : "Create alert"} <Bell />
          </button>
        </GradientPanel>
        <GradientPanel className="active-alerts">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ACTIVE ALERTS</span>
              <h2>Desk signals</h2>
            </div>
            <button className="small-action" onClick={() => setCleared(true)}>
              {cleared ? "Cleared" : "Clear all"}
            </button>
          </div>
          {cleared ? (
            <div className="empty-alerts">
              <img
                src="/illustrations/alert-bell.png"
                alt="Alert bell"
                className="alert-bell-art"
                decoding="async"
              />
              <strong>No active alerts</strong>
              <small>Create an alert to monitor a market condition.</small>
            </div>
          ) : (
            <div className="audit-row">
              <span className="alert-pip" />
              <div>
                <strong>BTC/USD above $70,000</strong>
                <small>Created today · push enabled</small>
              </div>
              <span className="status-chip review">armed</span>
            </div>
          )}
        </GradientPanel>
        <GradientPanel className="announcements">
          <span className="eyebrow">ANNOUNCEMENTS</span>
          <h2>Desk notes</h2>
          {[
            "Base maintenance window · 24 Sep",
            "New synthetic pilot cohort opened",
          ].map((item) => (
            <div className="audit-row" key={item}>
              <div>
                <strong>{item}</strong>
                <small>TradePulse operations · pinned</small>
              </div>
            </div>
          ))}
        </GradientPanel>
      </div>
      {toast && (
        <div className="desk-toast" role="status">
          <img
            src={
              toast.startsWith("Alert")
                ? "/illustrations/alert-bell.png"
                : "/illustrations/approved-stamp.png"
            }
            alt={toast.startsWith("Alert") ? "Alert" : "Approved"}
            className={
              toast.startsWith("Alert") ? "alert-toast-art" : "approved-stamp"
            }
          />
          {toast}
        </div>
      )}
    </div>
  );
}

function AdminControlRoomFinal() {
  const [env, setEnv] = useState("Mainnet");
  const [confirm, setConfirm] = useState("");
  const [broadcasted, setBroadcasted] = useState(false);
  const [approved, setApproved] = useState(false);
  const [pilotClosed, setPilotClosed] = useState(false);
  const [pilotReset, setPilotReset] = useState(false);
  const [approvalChecked, setApprovalChecked] = useState(false);
  return (
    <div className="admin-screen">
      <div className="admin-head">
        <div>
          <span className="eyebrow">ADMIN / CONTROL ROOM</span>
          <h2>Operations desk</h2>
          <small className="mono">AUDIT LOG · 09:42:18 UTC</small>
        </div>
        <div className="env-toggle">
          {["Mainnet", "Testnet"].map((item) => (
            <button
              className={env === item ? "active" : ""}
              key={item}
              onClick={() => setEnv(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <GradientPanel className="admin-hero">
        <div>
          <span className="eyebrow">SYSTEM STATUS</span>
          <h2>All queues monitored</h2>
          <p className="mono">
            ENVIRONMENT · {env.toUpperCase()} · EXACTLY-ONCE GUARDS ON
          </p>
        </div>
        <span className="status-chip running">
          <i />
          nominal
        </span>
      </GradientPanel>
      <div className="admin-grid">
        <GradientPanel className="admin-table">
          <div className="section-heading">
            <div>
              <span className="eyebrow">TREASURY SWEEP QUEUE</span>
              <h2>Pending movement</h2>
            </div>
            <span className="mono">03 ROWS</span>
          </div>
          {[
            ["SWP-2048", "pending", "0x71F4...9aC28D"],
            ["SWP-2047", "failed", "0x0A11...B92E"],
            ["SWP-2046", "pending", "0xA2C1...D830"],
          ].map((row) => (
            <div className="admin-row" key={row[0]}>
              <strong>{row[0]}</strong>
              <span
                className={`activity-status ${row[1] === "failed" ? "review" : "complete"}`}
              >
                {row[1]}
              </span>
              <code>{row[2]}</code>
            </div>
          ))}
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">RECOVERY CASES</span>
          <h2>Review destinations</h2>
          <div className="admin-row">
            <div>
              <strong>RCV-119 · full tx detail</strong>
              <small className="mono">
                0x9E...42B · Base · destination mismatch
              </small>
            </div>
            <span className="status-chip review">treasury_review</span>
          </div>
          <div className="admin-actions">
            <button className="small-action">rejected</button>
            <button className="small-action">verified</button>
          </div>
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">WITHDRAWAL APPROVALS</span>
          <h2>High-friction review</h2>
          <div className="admin-row">
            <div>
              <strong>WD-8841 · Jordan Davis</strong>
              <small className="mono">$800.00 USDC → Base</small>
            </div>
            <button
              className="danger-action"
              onClick={() => setConfirm("WD-8841")}
            >
              Approve exactly once
            </button>
          </div>
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">BROADCAST COMPOSER</span>
          <h2>Send a desk notice</h2>
          <select aria-label="Broadcast target" defaultValue="all">
            <option value="all">all users</option>
            <option>channel</option>
            <option>group</option>
          </select>
          <textarea
            aria-label="Broadcast message"
            placeholder="Type the operational message…"
          />
          <div className="parsed-preview">
            <span>ESCAPED PREVIEW</span>
            <code>Maintenance window · all users</code>
          </div>
          <button
            className="primary-action"
            onClick={() => setBroadcasted(true)}
          >
            {broadcasted ? "Sent · 1 / 1 · logged" : "Send broadcast"} <Send />
          </button>
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">SETTINGS EDITOR</span>
          <h2>Runtime controls</h2>
          {[
            "Money · minimum allocation $250",
            "Flow · cooling period 24h",
            "Referral · level one 5%",
            "Tier · Pro fee 10%",
            "Worker · heartbeat 30s",
          ].map((item) => (
            <div className="admin-row" key={item}>
              <strong>{item.split(" · ")[0]}</strong>
              <input aria-label={item} defaultValue={item.split(" · ")[1]} />
            </div>
          ))}
        </GradientPanel>
        <GradientPanel className="admin-table synthetic-pilot">
          <span className="eyebrow">SYNTHETIC PILOT · VIRTUAL ONLY</span>
          <h2>SYN-25 / SYN-50</h2>
          <div className="pilot-chart">
            <span>ENTRY</span>
            <i>EXIT</i>
          </div>
          {pilotClosed ? (
            <div className="audit-row">
              <span className="status-dot" />
              <div>
                <strong>Virtual position closed</strong>
                <small className="mono">
                  No withdrawal value · audit retained
                </small>
              </div>
            </div>
          ) : (
            <div className="admin-row">
              <div>
                <strong>SYN-25 · +$42.80</strong>
                <small className="mono">
                  virtual position · no withdrawal value
                </small>
              </div>
              <button
                className="small-action"
                onClick={() => setPilotClosed(true)}
              >
                Close
              </button>
            </div>
          )}
          <button className="small-action" onClick={() => setPilotReset(true)}>
            {pilotReset ? "Virtual balance reset" : "Reset virtual balance"}
          </button>
        </GradientPanel>
      </div>
      {confirm && (
        <div className="modal-backdrop">
          <GradientPanel className="confirm-modal">
            <span className="eyebrow">DANGER · DOUBLE CONFIRM</span>
            <h2>Approve exactly once?</h2>
            <div className="mono facts-block">
              TARGET · {confirm}
              <br />
              ENV · {env.toUpperCase()}
              <br />
              AMOUNT · $800.00 USDC
              <br />
              DESTINATION · BASE
            </div>
            <label className="confirm-check">
              <input
                type="checkbox"
                checked={approvalChecked}
                onChange={(event) => setApprovalChecked(event.target.checked)}
              />{" "}
              I verified the exact target and destination.
            </label>
            <button
              className="danger-action"
              disabled={!approvalChecked || approved}
              onClick={() => {
                setApproved(true);
                setConfirm("");
              }}
            >
              {approved ? "Approved · logged" : "Approve exactly once"}
            </button>
            <button className="ghost-action" onClick={() => setConfirm("")}>
              Cancel
            </button>
          </GradientPanel>
        </div>
      )}
    </div>
  );
}

function AdminRoom() {
  const [env, setEnv] = useState("Mainnet");
  const [modal, setModal] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="admin-screen">
      <div className="admin-head">
        <div>
          <span className="eyebrow">ADMIN / CONTROL ROOM</span>
          <h2>Operations desk</h2>
        </div>
        <div className="env-toggle">
          {["Mainnet", "Testnet"].map((item) => (
            <button
              className={env === item ? "active" : ""}
              key={item}
              onClick={() => setEnv(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <GradientPanel className="admin-hero">
        <div>
          <span className="eyebrow">SYSTEM STATUS</span>
          <h2>All queues monitored</h2>
          <p className="mono">
            ENVIRONMENT · {env.toUpperCase()} · LAST AUDIT 09:42:18 UTC
          </p>
        </div>
        <span className="status-chip running">
          <i />
          nominal
        </span>
      </GradientPanel>
      <div className="admin-grid">
        <GradientPanel className="admin-table">
          <div className="section-heading">
            <div>
              <span className="eyebrow">TREASURY SWEEP QUEUE</span>
              <h2>Pending movement</h2>
            </div>
            <span className="mono">03 ROWS</span>
          </div>
          {[
            ["SWP-2048", "pending", "0x71F4...9aC28D"],
            ["SWP-2047", "failed", "0x0A11...B92E"],
            ["SWP-2046", "pending", "0xA2C1...D830"],
          ].map((row) => (
            <div className="admin-row" key={row[0]}>
              <strong>{row[0]}</strong>
              <span
                className={`activity-status ${row[1] === "failed" ? "review" : "complete"}`}
              >
                {row[1]}
              </span>
              <code>{row[2]}</code>
            </div>
          ))}
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">WITHDRAWAL APPROVALS</span>
          <h2>High-friction review</h2>
          <div className="admin-row">
            <div>
              <strong>WD-8841 · Jordan Davis</strong>
              <small className="mono">$800.00 USDC → Base</small>
            </div>
            <button
              className="danger-action"
              onClick={() => setModal("WD-8841")}
            >
              Review
            </button>
          </div>
          <div className="admin-row">
            <div>
              <strong>WD-8839 · Casey Lin</strong>
              <small className="mono">$1,240.00 USDC → Ethereum</small>
            </div>
            <button className="small-action">Approve</button>
          </div>
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">BROADCAST COMPOSER</span>
          <h2>Send a desk notice</h2>
          <select aria-label="Broadcast target">
            <option>all users</option>
            <option>channel: bots</option>
            <option>group: pro</option>
          </select>
          <textarea placeholder="Message for the selected audience…" />
          <div className="button-row">
            <button className="ghost-action">Cancel</button>
            <button className="primary-action" onClick={() => setSent(true)}>
              Send broadcast <Send />
            </button>
          </div>
          {sent && (
            <div className="toast-inline">
              <span className="status-dot" />
              Sent 1,248 · failed 0
            </div>
          )}
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">SYNTHETIC PILOT · VIRTUAL ONLY</span>
          <h2>SYN-25 / SYN-50</h2>
          <div className="pilot-chart">
            <span>ENTRY</span>
            <i />
            <b>EXIT</b>
          </div>
          <div className="admin-row">
            <strong>SYN-25 · +$42.80</strong>
            <button className="small-action">Close position</button>
          </div>
          <div className="admin-row">
            <strong>SYN-50 · open</strong>
            <button
              className="danger-action"
              onClick={() => setModal("SYN-50")}
            >
              Reset virtual balance
            </button>
          </div>
        </GradientPanel>
      </div>
      {modal && (
        <div className="modal-backdrop">
          <GradientPanel className="confirm-modal danger-modal">
            <span className="eyebrow">
              DOUBLE CONFIRM · {env.toUpperCase()}
            </span>
            <h2>Confirm destructive action</h2>
            <p>
              Review this exact target. The action executes exactly once and is
              written to the audit log.
            </p>
            <div className="fact-block">
              <span>
                TARGET <b>{modal}</b>
              </span>
              <span>
                ENVIRONMENT <b>{env}</b>
              </span>
              <span>
                IMPACT <b>Funds or virtual positions will change</b>
              </span>
            </div>
            <label className="check-confirm">
              <input type="checkbox" /> I understand this cannot be undone.
            </label>
            <button className="danger-action" onClick={() => setModal("")}>
              Confirm exactly once <X />
            </button>
            <button className="ghost-action" onClick={() => setModal("")}>
              Cancel
            </button>
          </GradientPanel>
        </div>
      )}
    </div>
  );
}

type LiveDashboard = {
  user: {
    id: number;
    first_name?: string;
    username?: string;
    tier: string;
    fee_credit_usd: number;
    is_admin: boolean;
    onboarding_complete: boolean;
  };
  environment: string;
  wallet: {
    available: number;
    locked: number;
    equity: number;
    hwm: number;
    tank: number;
    tank_capacity: number;
    tank_autofill: boolean;
  };
  bots: Array<{
    id: number;
    name: string;
    product: string;
    state: string;
    capital_usd: number;
    compound_percent: number;
  }>;
  deposits: Array<{
    id: string;
    asset: string;
    chain: string;
    address: string;
    status: string;
    watch_enabled?: boolean;
    expected_amount?: string;
  }>;
  withdrawals: Array<{
    id: string;
    asset: string;
    chain: string;
    address: string;
    amount_usd: number;
    status: string;
  }>;
  ledger: Array<{
    kind: string;
    asset: string;
    amount_usd: number;
    status: string;
    created_at: number;
  }>;
  engine: Array<{ net_realized: number; status: string; created_at: number }>;
  alerts: Array<{
    id: number;
    asset: string;
    operator: string;
    threshold: number;
  }>;
  notifications: Record<string, boolean>;
  whitelist: Array<{
    id: number;
    chain: string;
    address: string;
    nickname: string;
    cooling_until: number;
  }>;
  demo: {
    state?: string;
    grant_usd?: number;
    expires_at?: number;
    redemption_ends_at?: number;
    profit_snapshot_usd?: number;
    gift_credit_usd?: number;
    converted_at?: number;
  } | null;
  popup_ttl_seconds: number;
  notices: Array<{ id: string; kind: string; title: string; body: string }>;
  referral: { count: number; accrued_usd: number; bot_username: string };
  tier_config: Array<{ name: string; monthly: number; rate: number }>;
  referral_rates: number[];
  community_url: string;
  quotes: Record<string, number>;
  quote_age: number;
  quote_fresh: boolean;
  memecoin?: {
    authorization?: { accepted_at?: number; settings_json?: string } | null;
    health?: { status?: string; assets?: number; latest_tick_at?: number | null };
    metrics?: { capacity_usd?: number; reserved_capacity_usd?: number; remaining_capacity_usd?: number; enabled?: boolean; paused?: boolean; close_only?: boolean };
  };
};

type LiveTradePulseAdmin = {
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
    status: string;
  }>;
  recovery_cases: Array<{
    id: number;
    status: string;
    asset: string;
    network: string;
    user_id: number;
  }>;
  tickets: Array<{
    id: number;
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
  sweeps_enabled: boolean;
};

const TELEGRAM_BOT_URL = "https://t.me/demo1vbot";
const TELEGRAM_BOT_USERNAME = "demo1vbot";
type TelegramWebApp = {
  initData?: string;
  ready?: () => void;
  expand?: () => void;
};
function telegramWebApp() {
  return (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } })
    .Telegram?.WebApp;
}
function telegramInitData() {
  return telegramWebApp()?.initData || "";
}
// Telegram can expose a WebApp object in an in-app browser without mounting a
// signed Mini App. Only signed init data means the desk has a usable Telegram
// identity; otherwise the browser handoff must remain available.
function openedInsideTelegram() {
  return Boolean(telegramInitData());
}
async function waitForTelegramWebApp() {
  // The Mini App bridge is injected asynchronously on some Android and iOS
  // clients. Give it a real chance to arrive before making an unauthenticated
  // dashboard request.
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const webApp = telegramWebApp();
    if (webApp?.initData) return webApp;
    await new Promise((resolve) => window.setTimeout(resolve, 100));
  }
  return undefined;
}
function BrowserBotHandoff() {
  const [state, setState] = useState<"preparing" | "ready" | "waiting" | "error">("preparing");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const [botUrl, setBotUrl] = useState("");
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current) window.clearInterval(timer.current);
    },
    [],
  );
  useEffect(() => {
    let cancelled = false;
    const prepare = async () => {
      try {
        const response = await fetch("/api/v1/auth/handoff/start", {
          method: "POST",
        });
        const contentType = response.headers.get("content-type") || "";
        const handoff = contentType.includes("application/json")
          ? await response.json()
          : { error: (await response.text()).slice(0, 240) };
        if (!response.ok || !handoff.token || !handoff.bot_url) {
          throw new Error(
            handoff.error || "Could not prepare a secure Telegram connection.",
          );
        }
        if (cancelled) return;
        setToken(handoff.token);
        setBotUrl(handoff.bot_url);
        setState("ready");
        setMessage("Open Telegram, confirm this browser, then return here automatically.");
      } catch (error) {
        if (cancelled) return;
        setState("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not prepare a secure Telegram connection.",
        );
      }
    };
    void prepare();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (state !== "waiting" || !token) return;
    const deadline = Date.now() + 300_000;
    timer.current = window.setInterval(async () => {
      if (Date.now() >= deadline) {
        if (timer.current) window.clearInterval(timer.current);
        timer.current = null;
        setState("error");
        setMessage("That connection expired. Refresh this page to create a new secure link.");
        return;
      }
      try {
        const response = await fetch(
          `/api/v1/auth/handoff/complete?token=${encodeURIComponent(token)}`,
          { credentials: "same-origin" },
        );
        if (response.status === 202) return;
        const contentType = response.headers.get("content-type") || "";
        const result = contentType.includes("application/json")
          ? await response.json()
          : { error: (await response.text()).slice(0, 240) };
        if (!response.ok || !result.ready) {
          throw new Error(result.error || "Could not finish browser connection.");
        }
        if (timer.current) window.clearInterval(timer.current);
        timer.current = null;
        window.location.replace("/");
      } catch (error) {
        if (error instanceof Error && error.message.includes("finish")) {
          setState("error");
          setMessage(error.message);
        }
      }
    }, 1500);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      timer.current = null;
    };
  }, [state, token]);
  return (
    <div className="browser-handoff">
      <a
        className="primary-action"
        href={botUrl || undefined}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={state !== "ready"}
        onClick={(event) => {
          if (state !== "ready" || !botUrl) {
            event.preventDefault();
            return;
          }
          setState("waiting");
          setMessage("Confirm this browser in Telegram. This page will finish sign-in automatically.");
        }}
      >
        {state === "preparing"
          ? "Preparing secure link…"
          : state === "waiting"
          ? "Confirming in Telegram…"
          : "Continue with Telegram"}{" "}
        <ChevronRight />
      </a>
      {message && <small role="status">{message}</small>}
    </div>
  );
}
function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

function signedActivityAmount(kind: string, status: string, amount: number) {
  const description = `${kind} ${status}`.toLowerCase();
  // Engine rows are occasionally stored as an absolute realised amount. The
  // event label remains authoritative for the direction shown to the user.
  return /\bloss\b/.test(description) ? -Math.abs(Number(amount || 0)) : Number(amount || 0);
}

function activityTone(kind: string, status: string) {
  const description = `${kind} ${status}`.toLowerCase();
  if (/\bloss\b|failed|rejected/.test(description)) return "loss";
  if (/pending|review|queued/.test(description)) return "review";
  return "complete";
}

type MarketPoint = { price: number; timestamp?: number };
type MarketCandle = {
  open: number;
  close: number;
  high: number;
  low: number;
  timestamp?: number;
};

function makeCandles(points: MarketPoint[]): MarketCandle[] {
  const valid = points.filter((point) => Number.isFinite(Number(point.price)) && Number(point.price) > 0);
  if (valid.length < 2) return [];
  const size = Math.max(1, Math.ceil(valid.length / Math.min(42, Math.max(12, Math.ceil(valid.length / 2)))));
  const candles: MarketCandle[] = [];
  for (let index = 0; index < valid.length; index += size) {
    const bucket = valid.slice(index, index + size);
    const prices = bucket.map((point) => Number(point.price));
    candles.push({
      open: prices[0],
      close: prices.at(-1) || prices[0],
      high: Math.max(...prices),
      low: Math.min(...prices),
      timestamp: bucket.at(-1)?.timestamp,
    });
  }
  return candles;
}

function rsiValues(closes: number[], period = 14) {
  if (closes.length < 2) return [] as number[];
  const values: number[] = [];
  for (let index = 0; index < closes.length; index += 1) {
    const start = Math.max(1, index - period + 1);
    const changes = closes.slice(start - 1, index + 1).map((value, changeIndex, series) =>
      changeIndex ? value - series[changeIndex - 1] : 0,
    ).slice(1);
    const gains = changes.reduce((sum, change) => sum + Math.max(change, 0), 0) / Math.max(changes.length, 1);
    const losses = changes.reduce((sum, change) => sum + Math.max(-change, 0), 0) / Math.max(changes.length, 1);
    values.push(losses === 0 ? 100 : 100 - 100 / (1 + gains / losses));
  }
  return values;
}

function formatMarketPrice(value: number) {
  if (Math.abs(value) >= 1000) return value.toFixed(2);
  if (Math.abs(value) >= 1) return value.toFixed(4);
  return value.toFixed(6);
}

function formatChartTime(timestamp: number | undefined, index: number, total: number) {
  if (!timestamp) return index === total - 1 ? "NOW" : `T-${total - index - 1}`;
  const millis = timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  return new Date(millis).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function MarketChart({
  points,
  market,
  accent = "#34d399",
}: {
  points: MarketPoint[];
  market: string;
  accent?: string;
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState(0);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStartDistance = useRef(0);
  const pinchStartZoom = useRef(1);
  const dragStart = useRef<{ x: number; offset: number } | null>(null);
  const clampZoom = (value: number) => Math.max(1, Math.min(8, value));
  const onWheel = (event: any) => {
    event.preventDefault();
    setZoom((current) => clampZoom(current * (event.deltaY < 0 ? 1.18 : 0.85)));
  };
  const onPointerDown = (event: any) => {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) {
      dragStart.current = { x: event.clientX, offset };
    } else if (pointers.current.size === 2) {
      dragStart.current = null;
      const [first, second] = Array.from(pointers.current.values());
      pinchStartDistance.current = Math.hypot(first.x - second.x, first.y - second.y);
      pinchStartZoom.current = zoom;
    }
  };
  const onPointerMove = (event: any) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1 && dragStart.current) {
      const maxOffset = Math.max(0, points.length - Math.max(18, Math.round(points.length / zoom)));
      const travelledPoints = Math.round(((dragStart.current.x - event.clientX) / 560) * Math.max(18, Math.round(points.length / zoom)));
      setOffset(Math.max(0, Math.min(maxOffset, dragStart.current.offset + travelledPoints)));
      return;
    }
    if (pointers.current.size !== 2 || !pinchStartDistance.current) return;
    const [first, second] = Array.from(pointers.current.values());
    const distance = Math.hypot(first.x - second.x, first.y - second.y);
    setZoom(clampZoom(pinchStartZoom.current * (distance / pinchStartDistance.current)));
  };
  const onPointerUp = (event: any) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) {
      pinchStartDistance.current = 0;
      dragStart.current = null;
    }
  };
  const visibleCount = Math.max(18, Math.round(points.length / zoom));
  const maxOffset = Math.max(0, points.length - visibleCount);
  const cropEnd = points.length - Math.min(offset, maxOffset);
  const candles = makeCandles(points.slice(Math.max(0, cropEnd - visibleCount), cropEnd));
  if (!candles.length) {
    return <div className="market-chart market-chart-empty">Waiting for live market ticks</div>;
  }
  const low = Math.min(...candles.map((candle) => candle.low));
  const high = Math.max(...candles.map((candle) => candle.high));
  const range = Math.max(high - low, Math.abs(high || 1) * 0.0025, 0.000001);
  const paddedLow = low - range * 0.08;
  const paddedHigh = high + range * 0.08;
  const domain = paddedHigh - paddedLow;
  const chartWidth = 560;
  const chartHeight = 204;
  const xStep = chartWidth / candles.length;
  const bodyWidth = Math.max(2, Math.min(10, xStep * 0.62));
  const y = (value: number) => 10 + ((paddedHigh - value) / domain) * (chartHeight - 20);
  const priceLabels = Array.from({ length: 5 }, (_, index) => paddedHigh - (domain * index) / 4);
  const rsi = rsiValues(candles.map((candle) => candle.close));
  const rsiPath = rsi
    .map((value, index) => `${index ? "L" : "M"} ${(index / Math.max(rsi.length - 1, 1)) * chartWidth} ${42 - (value / 100) * 34}`)
    .join(" ");
  const visibleTimes = [0, Math.floor((candles.length - 1) / 2), candles.length - 1];
  return (
    <div
      className="market-chart"
      aria-label={`${market} candlestick chart with RSI; use mouse wheel or pinch to zoom, then drag to review earlier prices`}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ touchAction: "none" }}
    >
      <div className="market-chart-main">
        <svg viewBox="0 0 660 204" preserveAspectRatio="none" role="img" aria-label={`${market} price candles`}>
          {priceLabels.map((label, index) => {
            const lineY = 10 + ((chartHeight - 20) * index) / 4;
            return <g key={label}><path d={`M0 ${lineY}H560`} className="market-grid-line" /><text x="570" y={lineY + 3} className="market-axis-label">{formatMarketPrice(label)}</text></g>;
          })}
          {Array.from({ length: 7 }, (_, index) => <path key={index} d={`M${(chartWidth * index) / 6} 0V204`} className="market-grid-line market-grid-vertical" />)}
          {candles.map((candle, index) => {
            const center = index * xStep + xStep / 2;
            const rising = candle.close >= candle.open;
            const color = rising ? accent : "#f87171";
            const top = Math.min(y(candle.open), y(candle.close));
            const height = Math.max(1.5, Math.abs(y(candle.open) - y(candle.close)));
            return <g key={`${candle.timestamp || index}-${candle.close}`}>
              <path d={`M${center} ${y(candle.high)}V${y(candle.low)}`} stroke={color} strokeWidth="1.15" />
              <rect x={center - bodyWidth / 2} y={top} width={bodyWidth} height={height} fill={rising ? `${color}B3` : color} stroke={color} strokeWidth="0.8" />
            </g>;
          })}
        </svg>
      </div>
      <div className="market-rsi">
        <span>RSI (14)</span>
        <svg viewBox="0 0 560 48" preserveAspectRatio="none" role="img" aria-label={`${market} RSI indicator`}>
          <path d="M0 8H560M0 25H560M0 42H560" className="market-grid-line" />
          <path d={rsiPath} fill="none" stroke="#aeb7ff" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="market-time-axis">
        {visibleTimes.map((index) => <span key={index}>{formatChartTime(candles[index]?.timestamp, index, candles.length)}</span>)}
      </div>
    </div>
  );
}

function LiveHelpScreen({
  data,
  request,
  onNotice,
}: {
  data: LiveDashboard;
  request: (path: string, options?: RequestInit) => Promise<any>;
  onNotice: (message: string) => void;
}) {
  const [network, setNetwork] = useState("");
  const [asset, setAsset] = useState("");
  const [hash, setHash] = useState("");
  const [address, setAddress] = useState("");
  const [details, setDetails] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [tickets, setTickets] = useState<Array<{ id: number; topic?: string; body: string; status: string }>>([]);
  useEffect(() => {
    request("/v1/support/tickets")
      .then((response) => setTickets(Array.isArray(response.tickets) ? response.tickets : []))
      .catch(() => setTickets([]));
  }, []);
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
          <input
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            placeholder="Network"
          />
          <input
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            placeholder="Asset"
          />
        </div>
        <input
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          placeholder="Transaction hash"
        />
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address sent to"
        />
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="What happened? Include the asset, amount, and any relevant details."
          rows={3}
        />
        <button
          className="primary-action"
          disabled={!network || !asset || !hash || !address}
          onClick={async () => {
            try {
              await request("/v1/recovery", {
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
              onNotice("Recovery case submitted for review.");
            } catch (error) {
              onNotice(
                error instanceof Error
                  ? error.message
                  : "Could not submit recovery case.",
              );
            }
          }}
        >
          Submit recovery case <Send />
        </button>
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
              <div className="activity-row" key={ticket.id}>
                <div className="activity-info">
                  <strong>TP-{ticket.id} · {ticket.topic || "General"}</strong>
                  <small>{ticket.status.replace("_", " ")} · {ticket.body}</small>
                </div>
              </div>
            ))}
          </div>
        )}
        <textarea
          value={supportMessage}
          onChange={(event) => setSupportMessage(event.target.value)}
          placeholder="Describe the issue without sharing a security code or private key."
          rows={3}
        />
        <button
          className="primary-action"
          disabled={!supportMessage.trim()}
          onClick={async () => {
            try {
              const result = await request("/v1/support/tickets", {
                method: "POST",
                body: JSON.stringify({
                  topic: "Web help center",
                  message: supportMessage.trim(),
                }),
              });
              setSupportMessage("");
              const latest = await request("/v1/support/tickets");
              setTickets(Array.isArray(latest.tickets) ? latest.tickets : []);
              onNotice(`Support ticket #${result.ticket_id} opened.`);
            } catch (error) {
              onNotice(
                error instanceof Error
                  ? error.message
                  : "Could not open a support ticket.",
              );
            }
          }}
        >
          Open support ticket <Send />
        </button>
      </GradientPanel>
    </div>
  );
}

function LiveAdminScreen({
  admin,
  environment,
  request,
  reload,
  onEnvironment,
  onNotice,
}: {
  admin: NonNullable<LiveTradePulseAdmin>;
  environment: "mainnet" | "testnet";
  request: (
    path: string,
    options?: RequestInit,
    environment?: "mainnet" | "testnet",
  ) => Promise<any>;
  reload: () => Promise<void>;
  onEnvironment: (environment: "mainnet" | "testnet") => Promise<void>;
  onNotice: (message: string) => void;
}) {
  const [target, setTarget] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [settingKey, setSettingKey] = useState("deposit_min_usd");
  const [settingValue, setSettingValue] = useState("");
  const [broadcast, setBroadcast] = useState("");
  const [confirm, setConfirm] = useState("");
  const [adminMember, setAdminMember] = useState("");
  const [vaultChain, setVaultChain] = useState("");
  const [vaultAsset, setVaultAsset] = useState("USDT");
  const [vaultAddress, setVaultAddress] = useState("");
  const [vaults, setVaults] = useState<
    Array<{ chain: string; asset: string; address: string }>
  >([]);
  const [syntheticConfig, setSyntheticConfig] = useState<Record<string, string>>({});
  const [memecoinConfig, setMemecoinConfig] = useState<Record<string, string>>({});
  const [memecoinMetrics, setMemecoinMetrics] = useState<Record<string, number | boolean>>({});
  useEffect(() => {
    setVaultChain((current) =>
      admin.chains.some((chain) => chain.id === current)
        ? current
        : admin.chains[0]?.id || "",
    );
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
  }, [environment]);
  const validTarget = /^@?[A-Za-z0-9_]{5,32}$/.test(adminMember) || /^\d+$/.test(adminMember);
  const validFunding = /^\d+$/.test(target) && Number(amount) > 0 && Boolean(reason.trim());
  const post = async (path: string, body: object, message: string) => {
    try {
      await request(path, { method: "POST", body: JSON.stringify(body) });
      onNotice(message);
      await reload();
      return true;
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Admin action failed.");
      return false;
    }
  };
  const saveSyntheticConfig = async (settings: Record<string, string>) => {
    try {
      const response = await request("/v1/admin/synthetic-config", {
        method: "PUT",
        body: JSON.stringify({ settings }),
      });
      setSyntheticConfig((current) => ({ ...current, ...(response.settings || settings) }));
      onNotice("Synthetic configuration saved and audit logged.");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Could not save synthetic configuration.");
    }
  };
  return (
    <div className="admin-screen">
      <div className="admin-head">
        <div>
          <span className="eyebrow">ADMIN / CONTROL ROOM</span>
          <h2>Operations desk</h2>
          <small className="mono">SEPARATE ADMIN WORKSPACE</small>
        </div>
        <div className="env-toggle">
          {(["mainnet", "testnet"] as const).map((item) => (
            <button
              className={environment === item ? "active" : ""}
              key={item}
              onClick={() => onEnvironment(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <GradientPanel className="admin-hero">
        <div>
          <span className="eyebrow">SYSTEM STATUS</span>
          <h2>{environment.toUpperCase()} operations</h2>
          <p className="mono">
            SWEEPS / {admin.sweeps_enabled ? "ENABLED" : "DISABLED"} / ADMIN
            ONLY
          </p>
        </div>
        <button
          className="small-action"
          onClick={() =>
            post("/v1/admin/sweeps/toggle", {}, "Sweep policy updated.")
          }
        >
          Toggle sweeps
        </button>
      </GradientPanel>
      <div className="admin-grid">
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
                  onClick={() =>
                    post(
                      `/v1/admin/sweeps/${row.id}`,
                      { action: "retry" },
                      "Sweep retry requested.",
                    )
                  }
                >
                  Retry
                </button>
                <button
                  className="small-action"
                  onClick={() =>
                    post(
                      `/v1/admin/sweeps/${row.id}`,
                      { action: "manual" },
                      "Manual sweep requested.",
                    )
                  }
                >
                  Manual
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
                  className="danger-action"
                  onClick={() =>
                    post(
                      `/v1/admin/withdrawals/${row.id}`,
                      { action: "approve" },
                      "Withdrawal approved and logged.",
                    )
                  }
                >
                  Approve
                </button>
                <button
                  className="small-action"
                  onClick={() =>
                    post(
                      `/v1/admin/withdrawals/${row.id}`,
                      { action: "reject" },
                      "Withdrawal rejected.",
                    )
                  }
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
                <button
                  className="small-action"
                  onClick={() =>
                    post(
                      `/v1/admin/recovery/${row.id}`,
                      { status: "verified" },
                      "Recovery marked verified.",
                    )
                  }
                >
                  Verify
                </button>
                <button
                  className="small-action"
                  onClick={() =>
                    post(
                      `/v1/admin/recovery/${row.id}`,
                      { status: "rejected" },
                      "Recovery rejected.",
                    )
                  }
                >
                  Reject
                </button>
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
            admin.tickets.map((ticket) => (
              <div className="admin-row" key={ticket.id}>
                <div>
                  <strong>TP-{ticket.id} / {ticket.topic || "General"}</strong>
                  <small className="mono">
                    USER {ticket.user_id} / {ticket.first_name || ticket.username || "Telegram user"} / {ticket.status}
                  </small>
                  <small>{ticket.body}</small>
                </div>
                {ticket.status === "open" && (
                  <button
                    className="small-action"
                    onClick={() =>
                      post(
                        `/v1/admin/tickets/${ticket.id}`,
                        { status: "in_progress" },
                        `Ticket TP-${ticket.id} moved to in progress.`,
                      )
                    }
                  >
                    Take
                  </button>
                )}
                {ticket.status !== "closed" && (
                  <button
                    className="small-action"
                    onClick={() =>
                      post(
                        `/v1/admin/tickets/${ticket.id}`,
                        { status: "closed" },
                        `Ticket TP-${ticket.id} closed.`,
                      )
                    }
                  >
                    Close
                  </button>
                )}
              </div>
            ))
          ) : (
            <p>No support tickets.</p>
          )}
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">ACCOUNT OPERATIONS</span>
          <h2>Fund or reset a user</h2>
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value.replace(/\D/g, ""))}
            placeholder="Telegram user ID"
            inputMode="numeric"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Credit amount / USD"
            inputMode="decimal"
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Funding reason"
          />
          <div className="admin-actions">
            <button
              className="small-action"
              disabled={!validFunding}
              onClick={() =>
                post(
                  "/v1/admin/fund",
                  { user_id: Number(target), amount: Number(amount), reason },
                  "User funded.",
                )
              }
            >
              Fund user
            </button>
            <button
              className="danger-action"
              disabled={!/^\d+$/.test(target)}
              onClick={() =>
                post(
                  "/v1/admin/onboarding/reset",
                  { user_id: Number(target) },
                  "Onboarding reset.",
                )
              }
            >
              Reset onboarding
            </button>
            <button
              className="small-action"
              disabled={!/^\d+$/.test(target)}
              onClick={() =>
                post(
                  "/v1/admin/demo/reissue",
                  { user_id: Number(target) },
                  "Test demo reissued.",
                )
              }
            >
              Reissue demo
            </button>
          </div>
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">SETTINGS EDITOR</span>
          <h2>Runtime controls</h2>
          <select
            value={settingKey}
            onChange={(e) => setSettingKey(e.target.value)}
          >
            <option value="min_bot_investment_usd">Bot minimum</option>
            <option value="deposit_min_usd">Deposit minimum</option>
            <option value="withdraw_min_usd">Withdrawal minimum</option>
            <option value="demo_active_days">Demo duration</option>
            <option value="demo_conversion_percent">Demo gift rate</option>
            <option value="community_url">Community link</option>
            <option value="popup_ttl_seconds">Popup cleanup seconds</option>
          </select>
          <input
            value={settingValue}
            onChange={(e) => setSettingValue(e.target.value)}
            placeholder="New value"
          />
          <button
            className="primary-action"
            disabled={!settingValue.trim()}
            onClick={() =>
              post(
                "/v1/admin/settings",
                { key: settingKey, value: settingValue },
                "Runtime setting saved.",
              )
            }
          >
            Save rule
          </button>
          {admin.settings.slice(0, 5).map((row) => (
            <div className="admin-row" key={row.key}>
              <strong>{row.key}</strong>
              <small className="mono">{row.value}</small>
            </div>
          ))}
        </GradientPanel>
        <GradientPanel className="admin-table">
          <span className="eyebrow">BROADCAST COMPOSER</span>
          <h2>Send a desk notice</h2>
          <textarea
            value={broadcast}
            onChange={(e) => setBroadcast(e.target.value)}
            placeholder="Operational message"
          />
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type SEND ALL to send all users"
          />
          <button
            className="primary-action"
            disabled={!broadcast.trim() || confirm !== "SEND ALL"}
            onClick={() =>
              post(
                "/v1/admin/broadcast",
                {
                  scope: "all",
                  target: "",
                  message: broadcast,
                  confirmation: confirm,
                },
                "Broadcast sent and logged.",
              )
            }
          >
            Send broadcast <Send />
          </button>
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
            onChange={(event) => setAdminMember(event.target.value.trim())}
            placeholder="Telegram user ID or @username"
          />
          <small>
            A username must belong to someone who has already started the bot.
          </small>
          <button
            className="primary-action"
            disabled={!validTarget}
            onClick={() =>
              post(
                "/v1/admin/members",
                { user_id: adminMember },
                "Administrator access updated.",
              ).then((saved) => {
                if (saved) setAdminMember("");
              })
            }
          >
            Add administrator <ShieldCheck />
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
            onChange={(event) => setVaultAsset(event.target.value)}
          >
            <option value="USDT">USDT</option>
            <option value="USDC">USDC</option>
          </select>
          <input
            value={vaultAddress}
            onChange={(event) =>
              setVaultAddress(event.target.value.replace(/\s/g, ""))
            }
            placeholder="Approved vault address"
          />
          <button
            className="primary-action"
            disabled={!vaultChain || !vaultAsset || !vaultAddress}
            onClick={async () => {
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
              }
            }}
          >
            Save vault route <ShieldCheck />
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
            <div><strong>Live settlement</strong><small className="mono">{syntheticConfig.synthetic_live_enabled === "true" ? "ENABLED" : "DISABLED"}</small></div>
            <button className={syntheticConfig.synthetic_live_enabled === "true" ? "danger-action" : "small-action"} onClick={() => saveSyntheticConfig({ synthetic_live_enabled: syntheticConfig.synthetic_live_enabled === "true" ? "false" : "true" })}>{syntheticConfig.synthetic_live_enabled === "true" ? "Disable" : "Enable"}</button>
          </div>
          <div className="admin-row">
            <div><strong>Global entry pause</strong><small className="mono">{syntheticConfig.global_trading_pause === "true" ? "PAUSED" : "OPEN"}</small></div>
            <button className={syntheticConfig.global_trading_pause === "true" ? "small-action" : "danger-action"} onClick={() => saveSyntheticConfig({ global_trading_pause: syntheticConfig.global_trading_pause === "true" ? "false" : "true" })}>{syntheticConfig.global_trading_pause === "true" ? "Resume" : "Pause"}</button>
          </div>
          <select value={syntheticConfig.clearing_mode || "PRINCIPAL"} onChange={(event) => saveSyntheticConfig({ clearing_mode: event.target.value })}>
            <option value="PRINCIPAL">Principal clearing</option>
            <option value="MATCHED">Matched clearing</option>
          </select>
          {[
            ["per_user_exposure_cap_usd", "Per-user cap"],
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
    </div>
  );
}

function LiveDeskScreen({
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
  const [asset, setAsset] = useState("BTC");
  const [operator, setOperator] = useState("above");
  const [threshold, setThreshold] = useState("");
  const [alertError, setAlertError] = useState("");
  const createAlert = async () => {
    if (!Number.isFinite(Number(threshold)) || Number(threshold) <= 0) {
      setAlertError("Enter a positive price threshold before creating an alert.");
      return;
    }
    try {
      await request("/v1/alerts", {
        method: "POST",
        body: JSON.stringify({ asset, operator, threshold: Number(threshold) }),
      });
      setThreshold("");
      setAlertError("");
      await reload();
      onNotice("Price alert created.");
    } catch (error) {
      setAlertError(
        error instanceof Error ? error.message : "Could not create the alert.",
      );
      onNotice(
        error instanceof Error ? error.message : "Could not create the alert.",
      );
    }
  };
  return (
    <div className="desk-screen">
      <div className="screen-title">
        <div>
          <span className="eyebrow">LIVE DESK / MARKET DATA</span>
          <h2>Price board</h2>
        </div>
        <span className="live-indicator">
          <i />
          {data.quote_fresh ? "LIVE" : "CACHED"}
        </span>
        {!data.quote_fresh && (
          <button
            className="small-action desk-retry"
            onClick={() => void reload()}
          >
            <StateIcon name="refresh" /> Retry feed
          </button>
        )}
      </div>
      <GradientPanel className="price-board">
        {Object.entries(data.quotes).map(([name, price]) => (
          <div className="asset-row" key={name}>
            <span className="asset-ident">{name[0]}</span>
            <div>
              <strong>{name}/USD</strong>
              <small>Market reference</small>
            </div>
            <strong className="asset-price">{money(price)}</strong>
            <Spark />
          </div>
        ))}
      </GradientPanel>
      <div className="desk-columns">
        <GradientPanel className="pulse-feed">
          <div className="section-heading">
            <div>
              <span className="eyebrow">MARKET PULSE</span>
              <h2>What is moving</h2>
            </div>
            <span className="mono">{data.quote_age}s</span>
          </div>
          <div className="audit-row">
            <span className="status-dot" />
            <div>
              <strong>
                {data.quote_fresh
                  ? "Price feed connected"
                  : "Using the latest cached quote"}
              </strong>
              <small>
                Quotes are informational and do not create a trade signal.
              </small>
            </div>
          </div>
        </GradientPanel>
        <GradientPanel className="alert-card">
          <span className="eyebrow">ALERT COMPOSER</span>
          <h2>Get the signal first.</h2>
          <div className="alert-fields">
            <select
              value={asset}
              onChange={(event) => setAsset(event.target.value)}
            >
              {Object.keys(data.quotes).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={operator}
              onChange={(event) => setOperator(event.target.value)}
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
              placeholder="Price"
            />
          </div>
          {alertError && (
            <p className="alert-input-error" role="alert">
              <StateIcon name="alert-triangle" />
              {alertError}
            </p>
          )}
          <div className="parsed-preview">
            <span>PARSED PREVIEW</span>
            <code>
              {asset} {operator} {threshold || "…"}
            </code>
          </div>
          <button
            className="primary-action"
            disabled={!Number(threshold) || Number(threshold) <= 0}
            onClick={createAlert}
          >
            Create alert <Bell />
          </button>
        </GradientPanel>
      </div>
      <GradientPanel className="active-alerts">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ACTIVE ALERTS</span>
            <h2>Desk signals</h2>
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
                onClick={async () => {
                  try {
                    await request(`/v1/alerts/${alert.id}/remove`, {
                      method: "POST",
                      body: "{}",
                    });
                    await reload();
                    onNotice("Alert removed.");
                  } catch (error) {
                    onNotice(
                      error instanceof Error
                        ? error.message
                        : "Could not remove alert.",
                    );
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

function LiveEarnScreen({ data }: { data: LiveDashboard }) {
  const [copied, setCopied] = useState(false);
  const link = `https://t.me/${data.referral.bot_username}?start=ref_${data.user.id}`;
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "TradePulse", url: link });
        return;
      }
      await navigator.clipboard?.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // Closing a native share sheet is not an application error.
    }
  };
  return (
    <div className="account-screen">
      <div className="screen-title">
        <div>
          <span className="eyebrow">EARN / REFERRALS</span>
          <h2>Referrals</h2>
        </div>
        <button
          className="share-action"
          onClick={() => void share()}
        >
          {copied ? "Copied" : "Share"}
        </button>
      </div>
      <GradientPanel className="invite-card">
        <div>
          <span className="eyebrow">YOUR INVITE LINK</span>
          <code>{link}</code>
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(link);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          }}
        >
          <StateSwapIcon
            name={copied ? "check" : "copy"}
            swapKey={copied ? "referral-copied" : "referral-copy"}
          />
          {copied ? "Copied" : "Copy link"}
        </button>
      </GradientPanel>
      <div className="earn-grid">
        <GradientPanel>
          <span className="eyebrow">ACCRUED EARNINGS</span>
          <strong className="big-number">
            {money(data.referral.accrued_usd)}
          </strong>
          <small>Eligible referral earnings</small>
        </GradientPanel>
        <GradientPanel>
          <span className="eyebrow">ACTIVE REFERRALS</span>
          <strong className="big-number">{data.referral.count}</strong>
          <small>Direct invites</small>
        </GradientPanel>
      </div>
      <GradientPanel className="levels-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">REFERRAL LEVELS</span>
            <h2>Share the upside</h2>
          </div>
        </div>
        {data.referral_rates.map((rate, index) => (
          <div className="level-row" key={rate}>
            <b>0{index + 1}</b>
            <span>
              {index === 0 ? "Direct referrals" : `Level ${index + 1}`}
              <small>Eligible fee share</small>
            </span>
            <strong>{rate}%</strong>
          </div>
        ))}
      </GradientPanel>
      <GradientPanel className="tier-table">
        <div className="table-row table-head">
          <span>TIER</span>
          <span>MONTHLY</span>
          <span>FEE</span>
        </div>
        {data.tier_config.map((tier) => (
          <div
            className={`table-row ${tier.name === data.user.tier ? "current" : ""}`}
            key={tier.name}
          >
            <b>{tier.name}</b>
            <span>{money(tier.monthly)}</span>
            <strong>{tier.rate}%</strong>
          </div>
        ))}
      </GradientPanel>
    </div>
  );
}

function LiveAccountScreen({
  data,
  request,
  reload,
  onNotice,
  openNotificationsRequest = 0,
}: {
  data: LiveDashboard;
  request: (path: string, options?: RequestInit) => Promise<any>;
  reload: () => Promise<void>;
  onNotice: (message: string) => void;
  openNotificationsRequest?: number;
}) {
  const [modal, setModal] = useState<
    "" | "code" | "notifications" | "whitelist" | "reset" | "support"
  >("");
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [chain, setChain] = useState("ERC20");
  const [nickname, setNickname] = useState("");
  const [address, setAddress] = useState("");
  const [support, setSupport] = useState("");
  const [notificationState, setNotificationState] = useState(data.notifications);
  const [notificationPending, setNotificationPending] = useState<string | null>(null);
  useEffect(() => {
    setNotificationState(data.notifications);
  }, [data.notifications]);
  useEffect(() => {
    if (openNotificationsRequest > 0) setModal("notifications");
  }, [openNotificationsRequest]);
  const updateNotification = async (key: string, label: string, enabled: boolean) => {
    if (notificationPending) return;
    const next = !enabled;
    setNotificationState((current) => ({ ...current, [key]: next }));
    setNotificationPending(key);
    try {
      const result = await request("/v1/account/notifications", {
        method: "POST",
        body: JSON.stringify({ name: key }),
      });
      if (result.notifications && typeof result.notifications === "object") {
        setNotificationState(result.notifications as Record<string, boolean>);
      }
      onNotice(`${label} notification ${next ? "enabled" : "disabled"}.`);
    } catch (error) {
      setNotificationState((current) => ({ ...current, [key]: enabled }));
      onNotice(
        error instanceof Error ? error.message : "Notification setting could not be updated.",
      );
    } finally {
      setNotificationPending(null);
    }
  };
  const saveMemecoinConfig = async (settings: Record<string, string>) => {
    try {
      const response = await request("/v1/admin/memecoin-config", {
        method: "PUT",
        body: JSON.stringify({ settings, confirmed: true }),
      });
      setMemecoinConfig((current) => ({ ...current, ...(response.settings || settings) }));
      setMemecoinMetrics(response.metrics || {});
      onNotice("Memecoin Bot configuration saved and audit logged.");
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Could not save Memecoin Bot configuration.");
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
    try {
      await request(path, { method: "POST", body: JSON.stringify(body) });
      onNotice(message);
      await reload();
      if (closeModal) setModal("");
      return true;
    } catch (error) {
      onNotice(
        error instanceof Error
          ? error.message
          : "Action could not be completed.",
      );
      return false;
    }
  };
  return (
    <div className="account-screen">
      <div className="screen-title">
        <div>
          <span className="eyebrow">ACCOUNT / SECURITY</span>
          <h2>Desk controls</h2>
        </div>
        <div className="security-chip">
          <StateIcon name="lock" /> PROTECTED
        </div>
      </div>
      <GradientPanel className="profile-card">
        <div className="top-avatar">{initials}</div>
        <div>
          <strong>{data.user.first_name || "Telegram user"}</strong>
          <small>
            {data.user.username ? `@${data.user.username}` : "No username"} /{" "}
            {data.user.tier}
          </small>
        </div>
        <span className="status-chip running">
          <i />
          protected
        </span>
      </GradientPanel>
      <div className="account-actions">
        <button className="account-action" onClick={() => setModal("code")}>
          <span>
            <ShieldCheck />
          </span>
          <div>
            <strong>Withdrawal security code</strong>
            <small>Set or change your approval code</small>
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
                Object.values(notificationState).some(Boolean)
                  ? "bell"
                  : "bell-off"
              }
              swapKey={
                Object.values(notificationState).some(Boolean)
                  ? "notifications-on"
                  : "notifications-off"
              }
            />
          </span>
          <div>
            <strong>Notifications</strong>
            <small>
              {Object.values(notificationState).filter(Boolean).length} alerts
              enabled
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
            <small>Save a verified destination</small>
          </div>
          <ChevronRight />
        </button>
        <button className="account-action" onClick={() => setModal("support")}>
          <span>
            <NavIcon name="help" />
          </span>
          <div>
            <strong>Help & support</strong>
            <small>Open a tracked support request</small>
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
            <small>Never changes balances or financial history</small>
          </div>
          <ChevronRight />
        </button>
      </div>
      {modal && (
        <div
          className="modal-backdrop"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setModal("");
          }}
        >
          <GradientPanel
            className="confirm-modal account-modal"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Close"
              onClick={() => setModal("")}
            >
              <X />
            </button>
            {modal === "code" && (
              <>
                <img
                  src="/illustrations/security-key.png"
                  alt="Security key"
                  className="security-key-art"
                  decoding="async"
                />
                <span className="eyebrow">SECURITY / WITHDRAWALS</span>
                <h2>Set security code</h2>
                <p>
                  This six-digit code is required to request a withdrawal. Never
                  share it with support or an administrator.
                </p>
                <label className="amount-field">
                  <span>SIX-DIGIT CODE</span>
                  <div className="secure-code-field">
                    <input
                      type={showCode ? "text" : "password"}
                      value={code}
                      onChange={(event) =>
                        setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      inputMode="numeric"
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
                <button
                  className="primary-action"
                  disabled={code.length !== 6}
                  onClick={() =>
                    post(
                      "/v1/account/security-code",
                      { code },
                      "Withdrawal security code saved.",
                    )
                  }
                >
                  Save security code <ShieldCheck />
                </button>
              </>
            )}
            {modal === "notifications" && (
              <>
                <span className="eyebrow">ACCOUNT / NOTIFICATIONS</span>
                <h2>Keep me informed</h2>
                  {[
                  ["fills", "Trade fills"],
                  ["fees", "Fees charged"],
                  ["deposits", "Deposits"],
                  ["tank_low", "Tank low"],
                  ["hwm_breaks", "High-water mark"],
                ].map(([key, label]) => {
                  const enabled = Boolean(notificationState[key]);
                  return (
                  <label className="toggle-row" key={key}>
                    <span>
                      {label}
                      <small>Send this alert through Telegram</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={notificationPending === key}
                      onChange={() => void updateNotification(key, label, enabled)}
                    />
                    <StateSwapIcon
                      name={enabled ? "bell" : "bell-off"}
                      swapKey={`${key}-${enabled ? "on" : "off"}`}
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
                  disabled={!address || !nickname.trim()}
                  onClick={() =>
                    post(
                      "/v1/account/whitelist",
                      { chain, nickname, address },
                      "Destination saved with the configured cooling period.",
                    )
                  }
                >
                  Save destination <ShieldCheck />
                </button>
              </>
            )}
            {modal === "support" && (
              <>
                <span className="eyebrow">HELP / SUPPORT</span>
                <h2>How can we help?</h2>
                <p>
                  Include the transaction reference and network if your request
                  concerns a transfer.
                </p>
                <textarea
                  value={support}
                  onChange={(event) => setSupport(event.target.value)}
                  placeholder="Describe the issue"
                />
                <button
                  className="primary-action"
                  disabled={!support.trim()}
                  onClick={() =>
                    post(
                      "/v1/support/tickets",
                      { topic: "Web desk support", message: support },
                      "Support request opened.",
                    )
                  }
                >
                  Open support request <Send />
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
                  security code, trial history, or fee credit.
                </p>
                <button
                  className="danger-action"
                  onClick={() =>
                    post(
                      "/v1/account/reset",
                      {},
                      "Desk preferences reset. Financial records remain intact.",
                    )
                  }
                >
                  Reset preferences <X />
                </button>
                <button className="ghost-action" onClick={() => setModal("")}>
                  Keep my settings
                </button>
              </>
            )}
          </GradientPanel>
        </div>
      )}
    </div>
  );
}

function LiveBotsScreen({
  data,
  request,
  reload,
  onNotice,
  onOpenDemo,
  initialBotId = null,
}: {
  data: LiveDashboard;
  request: (path: string, options?: RequestInit) => Promise<any>;
  reload: () => Promise<void>;
  onNotice: (message: string) => void;
  onOpenDemo: () => void;
  initialBotId?: number | null;
}) {
  const [view, setView] = useState<"fleet" | "create" | "detail">(
    initialBotId ? "detail" : "fleet",
  );
  const [product, setProduct] = useState<"memecoin" | "synthetic">("memecoin");
  const [amount, setAmount] = useState("20");
  const [review, setReview] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(initialBotId);
  const [pendingAction, setPendingAction] = useState(false);
  const [pendingActionType, setPendingActionType] = useState<string | null>(null);
  const [compoundOverrides, setCompoundOverrides] = useState<Record<number, number>>({});
  const [allocationDeltas, setAllocationDeltas] = useState<Record<number, number>>({});
  const [stateOverrides, setStateOverrides] = useState<Record<number, string>>({});
  const [closedBotIds, setClosedBotIds] = useState<number[]>([]);
  const [memecoinMarket, setMemecoinMarket] = useState("DOGE");
  const [memecoinAssets, setMemecoinAssets] = useState<string[]>(["DOGE", "SHIB", "PEPE", "WIF", "BONK"]);
  const [memecoinLeverage, setMemecoinLeverage] = useState(3);
  const [memecoinCadence, setMemecoinCadence] = useState(300);
  const [includeTrench, setIncludeTrench] = useState(false);
  const [memecoinSnapshot, setMemecoinSnapshot] = useState<{ points?: MarketPoint[]; positions?: Array<{ id: string; symbol: string; direction: string; status: string; margin_usd: number; entry_price: number; mark_price?: number; realized_pnl?: number }>; events?: Array<{ id: string; kind: string; created_at: number; payload?: Record<string, unknown> }> }>({});
  useEffect(() => {
    setSelectedId(initialBotId);
    setView(initialBotId ? "detail" : "fleet");
  }, [initialBotId]);
  const displayBots = data.bots
    .filter((bot) => !closedBotIds.includes(bot.id))
    .map((bot) => ({
      ...bot,
      state: stateOverrides[bot.id] ?? bot.state,
      compound_percent: compoundOverrides[bot.id] ?? bot.compound_percent,
      capital_usd: bot.capital_usd + (allocationDeltas[bot.id] || 0),
    }));
  const selected =
    displayBots.find((bot) => bot.id === selectedId) || displayBots[0];
  useEffect(() => {
    if (!selected || selected.product !== "memecoin") return;
    let cancelled = false;
    const refresh = () => {
      void request(`/v1/memecoin/snapshot?bot_id=${selected.id}&symbol=${memecoinMarket}`)
        .then((snapshot) => { if (!cancelled) setMemecoinSnapshot(snapshot || {}); })
        .catch(() => { if (!cancelled) setMemecoinSnapshot({}); });
    };
    refresh();
    const timer = window.setInterval(refresh, 1000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [selected?.id, selected?.product, memecoinMarket, request]);
  const run = async (path: string, payload: Record<string, unknown>) => {
    if (pendingAction) return;
    setPendingAction(true);
    setPendingActionType(String(payload.action || "action"));
    try {
      const response = await request(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onNotice(response.message || "Saved successfully.");
      // Server state is shared with Telegram. Always refresh it instead of
      // showing an optimistic pause, close, top-up, or recompound result.
      await reload();
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setPendingAction(false);
      setPendingActionType(null);
    }
  };
  const productLabel =
    product === "memecoin" ? "Memecoin" : "Synthetic Indices";
  if (view === "create")
    return (
      <div className="bot-flow">
        <button
          className="back-action"
          onClick={() => {
            setReview(false);
            setView("fleet");
          }}
        >
          <StateIcon name="arrow-left" /> Fleet overview
        </button>
        <div className="flow-kicker">
          <span className="eyebrow">NEW AUTOMATION</span>
          <h2>Choose a product</h2>
          <p>
            Each account can operate one Memecoin bot and one Synthetic Indices
            bot at the same time.
          </p>
        </div>
        <div className="product-grid">
          <BotProductCard
            name="Memecoin"
            description="Automated crypto strategy"
            icon="M"
            selected={product === "memecoin"}
            onClick={() => setProduct("memecoin")}
          />
          <BotProductCard
            name="Synthetic Indices"
            description="Trade the shared synthetic engine"
            icon="S"
            selected={product === "synthetic"}
            onClick={() => setProduct("synthetic")}
          />
        </div>
        <div className="amount-input">
          <span>$</span>
          <input
            value={amount}
            onChange={(event) =>
              setAmount(event.target.value.replace(/[^0-9.]/g, ""))
            }
            inputMode="decimal"
            aria-label="Allocation amount"
          />
        </div>
        <div className="available-line">
          <span>AVAILABLE TO DEPLOY</span>
          <strong>{money(data.wallet.available)}</strong>
        </div>
        <p className="minimum-hint">
          Minimum allocation is $20.00. Your allocation cannot exceed your
          available balance.
        </p>
        <button
          className="primary-action"
          disabled={
            Number(amount) < 20 || Number(amount) > data.wallet.available
          }
          onClick={() => setReview(true)}
        >
          Review allocation <ChevronRight />
        </button>
        {review && (
          <div className="modal-backdrop">
            <GradientPanel className="confirm-modal">
              <span className="eyebrow">FINAL REVIEW</span>
              <h2>Confirm deployment</h2>
              <div className="fact-block">
                <span>
                  PRODUCT <b>{productLabel}</b>
                </span>
                <span>
                  ALLOCATION <b>{money(Number(amount))}</b>
                </span>
                <span>
                  AVAILABLE AFTER{" "}
                  <b>
                    {money(Math.max(0, data.wallet.available - Number(amount)))}
                  </b>
                </span>
                <span>
                  COMPOUNDING <b>0%</b>
                </span>
                {product === "memecoin" && <span>STATUS <b>AUTHORIZATION REQUIRED</b></span>}
              </div>
              {product === "memecoin" && <p>Live market data is used to internally settle results against this Memecoin allocation. No external exchange order is placed.</p>}
              <button
                className="primary-action"
                onClick={async () => {
                  await run("/v1/bots", { product, amount: Number(amount) });
                  setReview(false);
                  setView("fleet");
                }}
              >
                Start trade <Zap />
              </button>
              <button className="ghost-action" onClick={() => setReview(false)}>
                Go back
              </button>
            </GradientPanel>
          </div>
        )}
      </div>
    );
  if (view === "detail" && selected) {
    const paused = selected.state === "paused";
    const awaitingAuthorization = selected.product === "memecoin" && selected.state === "awaiting_authorization";
    return (
      <div className="bot-detail">
        <button className="back-action" onClick={() => setView("fleet")}>
          <StateIcon name="arrow-left" /> Fleet overview
        </button>
        <GradientPanel className="detail-hero">
          <div className="detail-ring">
            <BotRing
              percent={paused || awaitingAuthorization ? 0 : 72}
              state={paused || awaitingAuthorization ? "paused" : "running"}
            />
          </div>
          <div>
            <span className="eyebrow">{selected.name.toUpperCase()} BOT</span>
            <h2>{selected.name}</h2>
            <span className={`status-chip ${paused || awaitingAuthorization ? "paused" : "running"}`}>
              <i />
              {awaitingAuthorization ? "authorization required" : paused ? "paused" : "running"}
            </span>
          </div>
        </GradientPanel>
        <div className="detail-stats">
          <GradientPanel>
            <span>ALLOCATION</span>
            <strong>{money(selected.capital_usd)}</strong>
          </GradientPanel>
          <GradientPanel>
            <span>COMPOUNDING</span>
            <strong>{selected.compound_percent}%</strong>
          </GradientPanel>
          <GradientPanel>
            <span>HIGH-WATER MARK</span>
            <strong>{money(data.wallet.hwm)}</strong>
          </GradientPanel>
        </div>
        {selected.product === "memecoin" && (
          <GradientPanel className="compound-panel">
            <span className="eyebrow">LIVE MEMECOIN MARKET</span>
            <div className="segment-control">
              {["DOGE", "SHIB", "PEPE", "WIF", "BONK"].map((symbol) => (
                <button className={memecoinMarket === symbol ? "active" : ""} key={symbol} onClick={() => setMemecoinMarket(symbol)}>{symbol}</button>
              ))}
            </div>
            <MarketChart points={memecoinSnapshot.points || []} market={`${memecoinMarket}/USDT`} />
            {(memecoinSnapshot.positions || []).length > 0 && (
              <div className="support-ticket-list">
                {(memecoinSnapshot.positions || []).slice(0, 5).map((position) => (
                  <div className="activity-row" key={position.id}>
                    <div className="activity-info">
                      <strong>{position.symbol} · {position.direction.toUpperCase()} · {position.status}</strong>
                      <small>Margin {money(position.margin_usd)} · Entry {formatMarketPrice(position.entry_price)}</small>
                    </div>
                    {position.status === "open" && <button className="small-action" disabled={pendingAction} onClick={() => run(`/v1/memecoin/positions/${position.id}/close`, {})}>Close <X /></button>}
                  </div>
                ))}
              </div>
            )}
            {(memecoinSnapshot.events || []).slice(-4).map((event) => (
              <p key={event.id}><b>{event.kind.replaceAll("_", " ")}</b> · {new Date(event.created_at * 1000).toLocaleTimeString()}</p>
            ))}
          </GradientPanel>
        )}
        <GradientPanel className="compound-panel">
          <span className="eyebrow">COMPOUNDING</span>
          <div className="segment-control">
            {[0, 50, 100].map((percent) => (
              <button
                className={
                  selected.compound_percent === percent ? "active" : ""
                }
                key={percent}
                disabled={pendingAction}
                onClick={() =>
                  run(`/v1/bots/${selected.id}/actions`, {
                    action: "compound",
                    percent,
                  })
                }
              >
                {percent}%
              </button>
            ))}
          </div>
        </GradientPanel>
        {awaitingAuthorization && (
          <GradientPanel className="compound-panel">
            <span className="eyebrow">FUNDED MEMECOIN BOT BETA</span>
            <p>
              Your assigned Memecoin allocation is the capital at risk. TradePulse uses live market data and internally settles results; no external exchange order is placed.
            </p>
            <span className="eyebrow">CURATED BASKET</span>
            <div className="segment-control">
              {["DOGE", "SHIB", "PEPE", "WIF", "BONK"].map((symbol) => (
                <button key={symbol} className={memecoinAssets.includes(symbol) ? "active" : ""} onClick={() => setMemecoinAssets((current) => current.includes(symbol) ? current.filter((item) => item !== symbol) : [...current, symbol])}>{symbol}</button>
              ))}
            </div>
            <span className="eyebrow">LEVERAGE</span>
            <div className="segment-control">
              {[1, 3, 5, 10].map((value) => <button key={value} className={memecoinLeverage === value ? "active" : ""} onClick={() => setMemecoinLeverage(value)}>{value}×</button>)}
            </div>
            <span className="eyebrow">DECISION CADENCE</span>
            <div className="segment-control">
              {[60, 300, 900].map((value) => <button key={value} className={memecoinCadence === value ? "active" : ""} onClick={() => setMemecoinCadence(value)}>{value === 60 ? "1m" : value === 300 ? "5m" : "15m"}</button>)}
            </div>
            <button className={includeTrench ? "small-action active" : "small-action"} onClick={() => setIncludeTrench((current) => !current)}>Include Trench Mode</button>
            <button
              className="primary-action"
              disabled={pendingAction || memecoinAssets.length === 0}
              onClick={() => run(`/v1/bots/${selected.id}/actions`, { action: "authorize", settings: { basket: "curated", assets: memecoinAssets, auto_enabled: true, include_trench: includeTrench, cadence_seconds: memecoinCadence, leverage: memecoinLeverage } })}
            >
              Authorize Memecoin Bot Beta <StateIcon name="check" />
            </button>
          </GradientPanel>
        )}
        <div className="detail-actions">
          <div className="amount-input">
            <span>$</span>
            <input
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value.replace(/[^0-9.]/g, ""))
              }
              inputMode="decimal"
              aria-label="Product top-up amount"
            />
          </div>
          <button
            className="small-action"
            disabled={Number(amount) < 20 || pendingAction}
            onClick={() =>
              run(`/v1/bots/${selected.id}/actions`, {
                action: "topup",
                amount: Number(amount),
              })
            }
          >
            {pendingActionType === "topup" ? "Updating…" : "Top up allocation"} <Plus />
          </button>
          <button
            className="primary-action"
            disabled={awaitingAuthorization || pendingAction}
            onClick={() =>
              run(`/v1/bots/${selected.id}/actions`, { action: "toggle" })
            }
          >
            {paused ? "Resume bot" : "Pause bot"}{" "}
            <StateSwapIcon
              name={paused ? "play" : "pause"}
              swapKey={paused ? "bot-resume" : "bot-pause"}
            />
          </button>
          <button
            className="danger-action"
            onClick={() => {
              if (
                window.confirm(
                  `Close ${selected.name}? Its current allocation will return to your available balance.`,
                )
              )
                void run(`/v1/bots/${selected.id}/actions`, {
                  action: "close",
                });
            }}
          >
            Close bot <X />
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="bots-screen">
      <GradientPanel className="fleet-hero">
        <div>
          <span className="eyebrow">BOT FLEET</span>
          <h2>Bot fleet</h2>
          <p>
            {displayBots.filter((bot) => bot.state === "running").length} running
            strategy
            {displayBots.filter((bot) => bot.state === "running").length === 1
              ? ""
              : "ies"}{" "}
            / {money(displayBots.reduce((sum, bot) => sum + bot.capital_usd, 0))}{" "}
            deployed
          </p>
        </div>
        <strong>
          {money(displayBots.reduce((sum, bot) => sum + bot.capital_usd, 0))}
        </strong>
      </GradientPanel>
      <div className="fleet-heading">
        <div>
          <span className="eyebrow">YOUR STRATEGIES</span>
          <h2>
            My bots{" "}
            <small>{String(displayBots.length).padStart(2, "0")} / 02</small>
          </h2>
        </div>
        <button
          className="primary-action"
          onClick={() => setView("create")}
          disabled={displayBots.length >= 2 || pendingAction}
        >
          <Plus /> Start trade
        </button>
      </div>
      {displayBots.length ? (
        <div className="fleet-bot-grid">
          {displayBots.map((bot) => (
            <GradientPanel className="fleet-bot-card reveal-card" key={bot.id}>
              <div className="fleet-bot-head">
                <BotRing
                  percent={bot.state === "running" ? 72 : 0}
                  state={bot.state === "paused" ? "paused" : "running"}
                />
                <div>
                  <div className="bot-title">
                    <strong>{bot.name}</strong>
                    <span className={`status-chip ${bot.state}`}>
                      <i />
                      {bot.state}
                    </span>
                  </div>
                  <span className="eyebrow">ALLOCATION</span>
                  <strong className="fleet-amount">
                    {money(bot.capital_usd)}
                  </strong>
                </div>
              </div>
              <div className="fleet-metrics">
                <div>
                  <span>COMPOUND</span>
                  <strong>{bot.compound_percent}%</strong>
                </div>
                <div>
                  <span>STATUS</span>
                  <strong className={bot.state === "running" ? "up" : "down"}>
                    {bot.state}
                  </strong>
                </div>
                <MiniSparkline negative={bot.state === "paused"} />
              </div>
              <div className="fleet-bot-actions">
                <span className="compound-chip">
                  COMPOUND {bot.compound_percent}%
                </span>
                <button
                  className="small-action"
                  onClick={() => {
                    setSelectedId(bot.id);
                    setView("detail");
                  }}
                >
                  Open detail <ChevronRight />
                </button>
              </div>
            </GradientPanel>
          ))}
        </div>
      ) : (
        <EmptyBots onLaunch={() => setView("create")} />
      )}
      {displayBots.some((bot) => bot.state === "paused") && (
        <GradientPanel className="bot-card">
          <img
            src="/illustrations/engine-paused.png"
            alt="Paused bot engine"
            className="illustration-engine-paused"
            decoding="async"
          />
          <div>
            <span className="eyebrow">BOT PAUSED</span>
            <h2>One or more bots are paused</h2>
            <p>
              Paused bots retain allocation and do not process new strategy runs
              until resumed.
            </p>
          </div>
        </GradientPanel>
      )}
      {data.demo && (
        <button
          className="demo-link"
          onClick={onOpenDemo}
        >
          Explore the {money(data.demo.grant_usd || 2000)} virtual demo{" "}
          <ChevronRight />
        </button>
      )}
    </div>
  );
}

function LiveWalletScreen({
  data,
  request,
  onWalletUpdate,
  onNotice,
  initialView = "overview",
}: {
  data: LiveDashboard;
  request: (path: string, options?: RequestInit) => Promise<any>;
  onWalletUpdate: (update: {
    wallet?: Partial<LiveDashboard["wallet"]>;
    withdrawal?: LiveDashboard["withdrawals"][number];
    deposits?: LiveDashboard["deposits"];
  }) => void;
  onNotice: (message: string) => void;
  initialView?: "overview" | "deposit" | "withdraw" | "history" | "activity" | "gas";
}) {
  const [view, setView] = useState<
    "overview" | "deposit" | "withdraw" | "history" | "activity" | "gas"
  >("overview");
  useEffect(() => {
    setView(initialView);
  }, [initialView]);
  const [step, setStep] = useState(0);
  const [asset, setAsset] = useState("USDT");
  const [chain, setChain] = useState("ERC20");
  const [expectedAmount, setExpectedAmount] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [intent, setIntent] = useState<
    LiveDashboard["deposits"][number] | null
  >(null);
  const [depositPending, setDepositPending] = useState(false);
  const [withdrawAsset, setWithdrawAsset] = useState("USDT");
  const [withdrawChain, setWithdrawChain] = useState("ERC20");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawCode, setWithdrawCode] = useState("");
  const [reviewWithdrawal, setReviewWithdrawal] = useState(false);
  const [submittedWithdrawal, setSubmittedWithdrawal] = useState<{
    asset: string;
    chain: string;
    amount: number;
  } | null>(null);
  const [tankAmount, setTankAmount] = useState("20");
  const [tankAutofill, setTankAutofill] = useState(data.wallet.tank_autofill);
  const [balancesVisible, setBalancesVisible] = useState(true);
  const [walletPending, setWalletPending] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<
    "all" | "deposit" | "withdraw" | "bot"
  >("all");
  const requestRef = useRef(request);
  const walletUpdateRef = useRef(onWalletUpdate);
  useEffect(() => {
    requestRef.current = request;
    walletUpdateRef.current = onWalletUpdate;
  }, [request, onWalletUpdate]);
  useEffect(() => {
    setTankAutofill(data.wallet.tank_autofill);
  }, [data.wallet.tank_autofill]);
  useEffect(() => {
    if (!intent) {
      setQrDataUrl("");
      return;
    }
    let cancelled = false;
    void request(`/v1/deposits/${intent.id}/qr`)
      .then((result) => {
        if (!cancelled) setQrDataUrl(String(result.data_url || ""));
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [intent?.id]);
  useEffect(() => {
    const trackedStatuses = new Set([
      "watching",
      "confirming",
      "pending_dust",
      "confirmed_pending_sweep",
      "sweeping",
      "sweep_confirming",
    ]);
    if (!intent?.watch_enabled || !trackedStatuses.has(intent.status.toLowerCase())) return;
    let cancelled = false;
    const refreshDepositStatus = () => {
      void requestRef.current("/v1/dashboard")
        .then((snapshot: LiveDashboard) => {
          const updatedIntent = snapshot.deposits.find((row) => row.id === intent.id);
          if (cancelled || !updatedIntent) return;
          setIntent(updatedIntent);
          walletUpdateRef.current({
            wallet: snapshot.wallet,
            deposits: snapshot.deposits,
          });
        })
        .catch(() => undefined);
    };
    refreshDepositStatus();
    const timer = window.setInterval(refreshDepositStatus, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [intent?.id, intent?.status, intent?.watch_enabled]);
  const networks = [
    ["ERC20", "Ethereum"],
    ["BEP20", "BNB Chain"],
    ["BASE", "Base"],
    ["ARBITRUM", "Arbitrum"],
    ["POLYGON", "Polygon"],
    ["SPL", "Solana"],
  ];
  const showOverview = () => {
    setView("overview");
    setStep(0);
    setIntent(null);
    setDepositPending(false);
    setReviewWithdrawal(false);
    setSubmittedWithdrawal(null);
  };
  const toggleTankAutofill = async () => {
    if (walletPending) return;
    const previous = tankAutofill;
    setTankAutofill(!previous);
    setWalletPending(true);
    try {
      const result = await request("/v1/tank/actions", {
        method: "POST",
        body: JSON.stringify({ action: "autofill" }),
      });
      onWalletUpdate({ wallet: { tank_autofill: Boolean(result.enabled) } });
      onNotice(`Auto-fill ${previous ? "disabled" : "enabled"}.`);
    } catch (error) {
      setTankAutofill(previous);
      onNotice(
        error instanceof Error ? error.message : "Could not update auto-fill.",
      );
    } finally {
      setWalletPending(false);
    }
  };
  const topUpTank = async () => {
    if (walletPending) return;
    setWalletPending(true);
    try {
      const result = await request("/v1/tank/actions", {
        method: "POST",
        body: JSON.stringify({ action: "topup", amount: Number(tankAmount) }),
      });
      onWalletUpdate({
        wallet: result.wallet || {
          available: Math.max(0, data.wallet.available - Number(tankAmount)),
          tank: Number(result.tank_usd ?? data.wallet.tank),
        },
      });
      onNotice("Gas tank top-up applied.");
    } catch (error) {
      onNotice(
        error instanceof Error ? error.message : "Could not top up the gas tank.",
      );
    } finally {
      setWalletPending(false);
    }
  };
  const isEvmAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value);
  const isSolanaAddress = (value: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
  const isWithdrawalAddress = (value: string) =>
    withdrawChain === "SPL" ? isSolanaAddress(value) : isEvmAddress(value);
  const filteredLedger = data.ledger.filter((entry) => {
    if (historyFilter === "all") return true;
    const kind = entry.kind.toLowerCase();
    if (historyFilter === "deposit") return kind.includes("deposit");
    if (historyFilter === "withdraw") return kind.includes("withdraw");
    return (
      kind.includes("bot") || kind.includes("trade") || kind.includes("engine")
    );
  });
  const createRoute = async () => {
    if (depositPending || !asset || !chain) return;
    setDepositPending(true);
    try {
      const result = await request("/v1/deposits/routes", {
        method: "POST",
        body: JSON.stringify({
          asset,
          chain,
          expected_amount: expectedAmount || null,
        }),
      });
      setIntent(result.intent);
      setStep(2);
      onNotice(
        "Deposit route created. Send only the selected asset on the selected network.",
      );
    } catch (error) {
      onNotice(
        error instanceof Error
          ? error.message
          : "Could not create the deposit route.",
      );
    } finally {
      setDepositPending(false);
    }
  };
  const submitWithdrawal = async () => {
    if (walletPending) return;
    setWalletPending(true);
    try {
      const result = await request("/v1/withdrawals", {
        method: "POST",
        body: JSON.stringify({
          asset: withdrawAsset,
          chain: withdrawChain,
          address: withdrawAddress,
          amount: Number(withdrawAmount),
          security_code: withdrawCode,
        }),
      });
      onWalletUpdate({
        wallet: result.wallet || {
          available: Math.max(0, data.wallet.available - Number(withdrawAmount)),
          locked: data.wallet.locked + Number(withdrawAmount),
        },
        withdrawal: result.withdrawal || {
          id: String(result.withdrawal_id || `pending-${Date.now()}`),
          asset: withdrawAsset,
          chain: withdrawChain,
          address: withdrawAddress,
          amount_usd: Number(withdrawAmount),
          status: "pending_admin_release",
        },
      });
      onNotice(
        `Withdrawal ${String(result.withdrawal_id || "request").slice(0, 8)} is queued for review.`,
      );
      setSubmittedWithdrawal({
        asset: withdrawAsset,
        chain: withdrawChain,
        amount: Number(withdrawAmount),
      });
      setWithdrawAddress("");
      setWithdrawAmount("");
      setWithdrawCode("");
      setReviewWithdrawal(false);
    } catch (error) {
      onNotice(
        error instanceof Error
          ? error.message
          : "Could not create the withdrawal request.",
      );
    } finally {
      setWalletPending(false);
    }
  };
  if (view === "deposit")
    return (
      <div className="wallet-flow">
        <button className="back-action" onClick={showOverview}>
          <StateIcon name="arrow-left" /> Wallet overview
        </button>
        <StepRail current={step} />
        <GradientPanel className="flow-card">
          <div className="flow-title">
            <div>
              <span className="eyebrow">DEPOSIT / ONE-TIME ROUTE</span>
              <h2>
                {step === 0
                  ? "Choose an asset"
                  : step === 1
                    ? "Choose a network"
                    : `Send ${asset} to TradePulse`}
              </h2>
            </div>
            <span className="secure-chip">
              <StateIcon name="lock" /> PROTECTED
            </span>
          </div>
          {step === 0 && (
            <div className="choice-grid">
              {["USDT", "USDC"].map((item) => (
                <button
                  type="button"
                  key={item}
                  className={asset === item ? "selected" : ""}
                  onClick={() => {
                    setAsset(item);
                    setStep(1);
                  }}
                >
                  <PaymentMark asset={item} />
                  <strong>{item}</strong>
                  <small>{item === "USDT" ? "Tether USD" : "USD Coin"}</small>
                  <ChevronRight />
                </button>
              ))}
            </div>
          )}
          {step === 1 && (
            <>
              <div className="choice-grid">
                {networks.map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    className={chain === value ? "selected" : ""}
                    onClick={() => {
                      setChain(value);
                      setIntent(null);
                      setStep(2);
                    }}
                  >
                    <PaymentMark asset={value} />
                    <strong>{label}</strong>
                    <small>Use only this matching network</small>
                    <ChevronRight />
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 2 && !intent && (
            <>
              <div className="minimum-warning">
                <span>✓</span>
                <div>
                  <strong>
                    {asset} on {networks.find(([value]) => value === chain)?.[1] || chain}
                  </strong>
                  <p>Use this matching network for your one-time deposit route.</p>
                  <button type="button" className="small-action" onClick={() => setStep(1)}>
                    Change network
                  </button>
                </div>
              </div>
              <label className="amount-field">
                <span>EXPECTED AMOUNT / OPTIONAL</span>
                <input
                  value={expectedAmount}
                  onChange={(event) => setExpectedAmount(event.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </label>
              <button
                type="button"
                className="primary-action"
                disabled={depositPending || !asset || !chain}
                onClick={createRoute}
              >
                {depositPending ? "Preparing route…" : "Create secure route"}{" "}
                {!depositPending && <ChevronRight />}
              </button>
            </>
          )}
          {step === 2 && intent && (
            <>
              {intent.status.toLowerCase() === "credited_and_closed" && (
                <div className="success-state">
                  <img
                    src="/illustrations/deposit-credited.png"
                    alt="Deposit credited into TradePulse"
                    className="deposit-credited-art"
                    decoding="async"
                  />
                  <strong>Deposit credited</strong>
                  <small>Your verified transfer is now in your available wallet balance.</small>
                </div>
              )}
              {intent.status.toLowerCase() === "pending_dust" && (
                <div className="below-minimum-card">
                  <img
                    src="/illustrations/below-minimum.png"
                    alt="Deposit below the required minimum"
                    className="below-minimum-art"
                    decoding="async"
                  />
                  <div>
                    <strong>Deposit below minimum</strong>
                    <small>Send the remaining amount to this same route to complete the credit.</small>
                  </div>
                </div>
              )}
              <div className="qr-placeholder">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Scan ${intent.asset} deposit address`}
                    width={128}
                    height={128}
                  />
                ) : (
                  <div className="qr-grid" />
                )}
                <small>
                  SCAN TO DEPOSIT {intent.asset} ON {intent.chain}
                </small>
              </div>
              <div className="copy-field">
                <code>{intent.address}</code>
                <button
                  aria-label="Copy deposit address"
                  onClick={async () => {
                    await navigator.clipboard?.writeText(intent.address);
                    setCopiedAddress(true);
                    window.setTimeout(() => setCopiedAddress(false), 1200);
                  }}
                >
                  <StateSwapIcon
                    name={copiedAddress ? "check" : "copy"}
                    swapKey={copiedAddress ? "address-copied" : "address-copy"}
                  />
                </button>
              </div>
              <div className="warning-block">
                <strong>
                  Send {intent.asset} on {intent.chain} only
                </strong>
                <span>
                  This is a one-time route. Another asset or network cannot be
                  credited automatically.
                </span>
              </div>
              <button
                className="primary-action"
                onClick={async () => {
                  try {
                    const result = await request(
                      `/v1/deposits/${intent.id}/watch`,
                      { method: "POST", body: "{}" },
                    );
                    setIntent((current) =>
                      current
                        ? {
                            ...current,
                            status: String(result.status || current.status),
                            watch_enabled: true,
                          }
                        : current,
                    );
                    onNotice(
                      result.detected
                        ? `Transfer detected. Status: ${result.status}. Credit happens after confirmation.`
                        : `Monitoring started. No transfer detected yet; nothing was credited.`,
                    );
                  } catch (error) {
                    onNotice(
                      error instanceof Error
                        ? error.message
                        : "Could not start deposit monitoring.",
                    );
                  }
                }}
              >
                I made this deposit <ChevronRight />
              </button>
              <div className="timeline">
                <span className="eyebrow">DEPOSIT STATUS</span>
                {["Detected", "Verified", "Credited"].map((label, index) => {
                  const status = intent.status.toLowerCase();
                  const complete =
                    index === 0
                      ? !["watching", "pending"].includes(status)
                      : index === 1
                        ? [
                            "confirmed_pending_sweep",
                            "sweeping",
                            "sweep_confirming",
                            "credited_and_closed",
                          ].includes(status)
                        : status === "credited_and_closed";
                  return (
                    <div className="timeline-row" key={label}>
                      <i className={complete ? "active" : ""}>
                        {complete ? "✓" : index + 1}
                      </i>
                      <div>
                        <strong>{label}</strong>
                        <small>
                          {index === 0
                            ? "Waiting for the selected route to detect your transaction."
                            : index === 1
                              ? "On-chain confirmation is required before a balance credit."
                              : "Your available balance updates after the route is fully settled."}
                        </small>
                      </div>
                      <span
                        className={`status-chip ${complete ? "running" : "review"}`}
                      >
                        {complete ? "complete" : "pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </GradientPanel>
        {data.deposits.length > 0 && (
          <GradientPanel className="ledger-card">
            <span className="eyebrow">MY DEPOSIT ROUTES</span>
            {data.deposits.map((route) => (
              <div className="ledger-row" key={route.id}>
                <div>
                  <strong>
                    {route.asset} / {route.chain}
                  </strong>
                  <small>{route.address}</small>
                </div>
                <span
                  className={`activity-status ${route.status.includes("fail") ? "review" : "complete"}`}
                >
                  {route.status}
                </span>
                <button
                  className="small-action"
                  onClick={() => {
                    setIntent(route);
                    setAsset(route.asset);
                    setChain(route.chain);
                    setStep(2);
                  }}
                >
                  Open
                </button>
              </div>
            ))}
          </GradientPanel>
        )}
      </div>
    );
  if (view === "withdraw" && submittedWithdrawal)
    return (
      <div className="wallet-flow">
        <button className="back-action" onClick={showOverview}>
          <StateIcon name="arrow-left" /> Wallet overview
        </button>
        <StepRail current={2} />
        <GradientPanel className="flow-card">
          <div className="success-state">
            <img
              src="/illustrations/withdrawal-sent.png"
              alt="Withdrawal queued for secure review"
              className="withdrawal-sent-art"
              decoding="async"
            />
            <strong>Withdrawal queued</strong>
            <small>
              {money(submittedWithdrawal.amount)} {submittedWithdrawal.asset} on{" "}
              {submittedWithdrawal.chain} is reserved for review.
            </small>
          </div>
          <button className="primary-action" onClick={showOverview}>
            Back to wallet <ChevronRight />
          </button>
          <button className="ghost-action" onClick={() => setView("history")}>
            View withdrawal history
          </button>
        </GradientPanel>
      </div>
    );
  if (view === "withdraw")
    return (
      <div className="wallet-flow">
        <button className="back-action" onClick={showOverview}>
          <StateIcon name="arrow-left" /> Wallet overview
        </button>
        <StepRail current={2} />
        <GradientPanel className="flow-card">
          <div className="flow-title">
            <div>
              <span className="eyebrow">WITHDRAW / CROSS-CHECK</span>
              <h2>Send funds safely</h2>
            </div>
            <span className="secure-chip">
              <ShieldCheck /> SECURE
            </span>
          </div>
          <div className="withdrawable-summary">
            <div>
              <span>Withdrawable now</span>
              <strong>{money(data.wallet.available)}</strong>
            </div>
            <div>
              <span>Locked in bots</span>
              <strong>{money(data.wallet.locked)}</strong>
            </div>
            <small>
              Only available wallet balance can be withdrawn. Check every
              destination character before continuing.
            </small>
          </div>
          <label className="amount-field">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <PaymentMark asset={withdrawAsset} compact /> ASSET · {withdrawAsset}
            </span>
            <select
              value={withdrawAsset}
              onChange={(event) => setWithdrawAsset(event.target.value)}
            >
              <option>USDT</option>
              <option>USDC</option>
            </select>
          </label>
          <label className="amount-field">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <PaymentMark asset={withdrawChain} compact /> NETWORK · {networks.find(([value]) => value === withdrawChain)?.[1] || withdrawChain}
            </span>
            <select
              value={withdrawChain}
              onChange={(event) => setWithdrawChain(event.target.value)}
            >
              {networks.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="amount-field">
            <span>DESTINATION ADDRESS</span>
            <input
              value={withdrawAddress}
              onChange={(event) =>
                setWithdrawAddress(event.target.value.replace(/\s/g, ""))
              }
              placeholder="Paste the full destination address"
              autoComplete="off"
            />
          </label>
          {data.whitelist.filter((route) => route.chain === withdrawChain)
            .length > 0 && (
            <div className="saved-destinations">
              <span className="field-caption">SAVED DESTINATIONS</span>
              {data.whitelist
                .filter((route) => route.chain === withdrawChain)
                .map((route) => {
                  const cooling =
                    Number(route.cooling_until || 0) * 1000 > Date.now();
                  return (
                    <button
                      type="button"
                      className="saved-destination"
                      key={route.id}
                      disabled={cooling}
                      onClick={() => setWithdrawAddress(route.address)}
                    >
                      <span>{route.nickname}</span>
                      <small>
                        {route.address.slice(0, 8)}…{route.address.slice(-6)}{" "}
                        {cooling ? "· cooling" : ""}
                      </small>
                      <ChevronRight />
                    </button>
                  );
                })}
            </div>
          )}
          <label className="amount-field">
            <span>AMOUNT / USD</span>
            <input
              value={withdrawAmount}
              onChange={(event) =>
                setWithdrawAmount(event.target.value.replace(/[^0-9.]/g, ""))
              }
              inputMode="decimal"
              placeholder="0.00"
            />
          </label>
          <label className="amount-field">
            <span>SIX-DIGIT SECURITY CODE</span>
            <input
              type="password"
              value={withdrawCode}
              onChange={(event) =>
                setWithdrawCode(
                  event.target.value.replace(/\D/g, "").slice(0, 6),
                )
              }
              inputMode="numeric"
              placeholder="••••••"
            />
          </label>
          <button
            className="primary-action"
            disabled={
              walletPending ||
              !withdrawAddress ||
              !isWithdrawalAddress(withdrawAddress) ||
              Number(withdrawAmount) <= 0 ||
              Number(withdrawAmount) > data.wallet.available ||
              withdrawCode.length !== 6
            }
            onClick={() => setReviewWithdrawal(true)}
          >
            Review withdrawal <ChevronRight />
          </button>
        </GradientPanel>
        {reviewWithdrawal && (
          <div className="modal-backdrop">
            <GradientPanel className="confirm-modal">
              <span className="eyebrow">FINAL CROSS-CHECK</span>
              <h2>Verify before sending</h2>
              <div className="mono-review">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <PaymentMark asset={withdrawAsset} compact />
                  <PaymentMark asset={withdrawChain} compact />
                  {withdrawAsset} / {withdrawChain}
                </span>
                <code>{withdrawAddress}</code>
                <span>AMOUNT / {money(Number(withdrawAmount))}</span>
              </div>
              <p>
                Withdrawal requests are reviewed before release. Confirm only
                when the address and network are correct.
              </p>
              <button className="primary-action" disabled={walletPending} onClick={submitWithdrawal}>
                {walletPending ? "Submitting…" : "Confirm withdrawal"} <Send />
              </button>
              <button
                className="ghost-action"
                onClick={() => setReviewWithdrawal(false)}
              >
                Go back
              </button>
            </GradientPanel>
          </div>
        )}
      </div>
    );
  if (view === "history")
    return (
      <div className="ledger-screen">
        <button className="back-action" onClick={showOverview}>
          <StateIcon name="arrow-left" /> Wallet overview
        </button>
        <div className="ledger-header">
          <div>
            <span className="eyebrow">WALLET / HISTORY</span>
            <h2>Ledger history</h2>
          </div>
        </div>
        <div className="filter-chips">
          {(["all", "deposit", "withdraw", "bot"] as const).map((filter) => (
            <button
              key={filter}
              className={historyFilter === filter ? "active" : ""}
              onClick={() => setHistoryFilter(filter)}
            >
              {filter === "all"
                ? "All"
                : filter === "deposit"
                  ? "Deposits"
                  : filter === "withdraw"
                    ? "Withdrawals"
                    : "Bot activity"}
            </button>
          ))}
        </div>
        <GradientPanel className="ledger-card">
          {filteredLedger.length ? (
            filteredLedger.map((entry, index) => {
              const amount = signedActivityAmount(entry.kind, entry.status, entry.amount_usd);
              return (
              <div className="ledger-row" key={`${entry.created_at}-${index}`}>
                <div>
                  <strong>{entry.kind.replace(/_/g, " ")}</strong>
                  <small>
                    {entry.asset} / {entry.status}
                  </small>
                </div>
                <span
                  className={`activity-status ${activityTone(entry.kind, entry.status)}`}
                >
                  {entry.status}
                </span>
                <code className={amount >= 0 ? "mint" : "down"}>
                  {amount >= 0 ? "+" : ""}
                  {money(amount)}
                </code>
              </div>
              );
            })
          ) : (
            <div className="empty-wallet-state">
              <img src="/illustrations/empty-wallet.png" alt="Empty wallet" />
              <strong>No wallet activity yet</strong>
              <small>
                Your verified deposits, withdrawals, and bot allocations will
                appear here.
              </small>
            </div>
          )}
        </GradientPanel>
      </div>
    );
  if (view === "activity")
    return (
      <div className="ledger-screen">
        <button className="back-action" onClick={showOverview}>
          <StateIcon name="arrow-left" /> Wallet overview
        </button>
        <div className="ledger-header">
          <div>
            <span className="eyebrow">WALLET / ACTIVITY</span>
            <h2>Activity</h2>
          </div>
        </div>
        <GradientPanel className="ledger-card">
          {[...data.engine, ...data.ledger].length ? (
            [
              ...data.engine.map((entry) => ({
                kind: entry.status,
                asset: "Engine",
                amount_usd: entry.net_realized,
                status: entry.status,
                created_at: entry.created_at,
              })),
              ...data.ledger,
            ]
              .sort((a, b) => b.created_at - a.created_at)
              .map((entry, index) => {
                const amount = signedActivityAmount(entry.kind, entry.status, entry.amount_usd);
                return (
                <div
                  className="ledger-row"
                  key={`${entry.created_at}-${index}`}
                >
                  <div>
                    <strong>{entry.kind.replace(/_/g, " ")}</strong>
                    <small>
                      {entry.asset} / {entry.status}
                    </small>
                  </div>
                  <span
                    className={`activity-status ${activityTone(entry.kind, entry.status)}`}
                  >
                    {entry.status}
                  </span>
                  <code className={amount >= 0 ? "mint" : "down"}>
                    {amount >= 0 ? "+" : ""}
                    {money(amount)}
                  </code>
                </div>
                );
              })
          ) : (
            <div className="empty-wallet-state">
              <img
                src="/illustrations/empty-wallet.png"
                alt="No wallet activity"
              />
              <strong>No activity yet</strong>
              <small>Verified transfers and bot events will appear here.</small>
            </div>
          )}
        </GradientPanel>
      </div>
    );
  if (view === "gas")
    return (
      <div className="wallet-flow">
        <button className="back-action" onClick={showOverview}>
          <StateIcon name="arrow-left" /> Wallet overview
        </button>
        <GradientPanel className="gas-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">NETWORK GAS TANK</span>
              <h2>Keep actions moving</h2>
            </div>
            <Fuel size={18} />
          </div>
          <div className="gas-meter">
            <div>
              <strong>
                {Math.round(
                  (data.wallet.tank / Math.max(data.wallet.tank_capacity, 1)) *
                    100,
                )}
                %
              </strong>
              <small>
                {money(data.wallet.tank)} of {money(data.wallet.tank_capacity)}
              </small>
            </div>
            <div className="gas-track">
              <i
                style={{
                  width: `${Math.min(100, (data.wallet.tank / Math.max(data.wallet.tank_capacity, 1)) * 100)}%`,
                }}
              />
            </div>
          </div>
          <label className="toggle-row">
            <span>
              Auto-fill when low<small>Uses available balance</small>
            </span>
            <input
              type="checkbox"
              checked={tankAutofill}
              onChange={toggleTankAutofill}
            />
            <i />
          </label>
          <label className="amount-field">
            <span>TOP UP TANK / USD</span>
            <input
              value={tankAmount}
              onChange={(e) => setTankAmount(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <button
            className="primary-action"
            disabled={
              walletPending ||
              Number(tankAmount) <= 0 ||
              Number(tankAmount) > data.wallet.available
            }
            onClick={() => void topUpTank()}
          >
            {walletPending ? "Updating…" : "Top up gas tank"} <Fuel />
          </button>
        </GradientPanel>
      </div>
    );
  const tankPercent = Math.min(
    100,
    (data.wallet.tank / Math.max(data.wallet.tank_capacity, 1)) * 100,
  );
  return (
    <div className="wallet-grid">
      <div className="wallet-stat-grid">
        <WalletCard
          label="AVAILABLE"
          value={money(data.wallet.available)}
          detail="Ready to deploy or withdraw"
          accent="mint"
          masked={!balancesVisible}
        />
        <WalletCard
          label="LOCKED"
          value={money(data.wallet.locked)}
          detail="Allocated to active bots"
          masked={!balancesVisible}
        />
        <WalletCard
          label="TOTAL EQUITY"
          value={money(data.wallet.equity)}
          detail="Account value"
          accent="mint"
          masked={!balancesVisible}
          onToggleVisibility={() => setBalancesVisible((visible) => !visible)}
        />
        <WalletCard
          label="HIGH-WATER MARK"
          value={money(data.wallet.hwm)}
          detail="Performance fee reference"
          masked={!balancesVisible}
        />
      </div>
      <GradientPanel className="gas-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">NETWORK GAS TANK</span>
            <h2>Keep actions moving</h2>
          </div>
          <Fuel size={18} />
        </div>
        <div className="gas-meter">
          <div>
            <strong>{Math.round(tankPercent)}%</strong>
            <small>{money(data.wallet.tank)} remaining</small>
          </div>
          <div className="gas-track">
            <i style={{ width: `${tankPercent}%` }} />
          </div>
        </div>
        <label className="toggle-row">
          <span>
            Auto-fill when low<small>Uses available balance</small>
          </span>
          <input
            type="checkbox"
            checked={tankAutofill}
            onChange={toggleTankAutofill}
          />
          <i />
        </label>
        <label className="amount-field">
          <span>TOP UP TANK / USD</span>
          <input
            value={tankAmount}
            onChange={(event) => setTankAmount(event.target.value)}
            inputMode="decimal"
          />
        </label>
        <button
          className="small-action"
          disabled={walletPending || Number(tankAmount) <= 0 || Number(tankAmount) > data.wallet.available}
          onClick={() => void topUpTank()}
        >
          {walletPending ? "Updating…" : "Top up gas tank"} <Fuel />
        </button>
      </GradientPanel>
      <div className="wallet-actions">
        <button onClick={() => setView("deposit")}>
          <span>
            <Download />
          </span>
          <strong>Deposit</strong>
          <ChevronRight />
        </button>
        <button onClick={() => setView("withdraw")}>
          <span>
            <Send />
          </span>
          <strong>Withdraw</strong>
          <ChevronRight />
        </button>
        <button onClick={() => setView("gas")}>
          <span>
            <Fuel />
          </span>
          <strong>Gas tank</strong>
          <ChevronRight />
        </button>
        <button onClick={() => setView("history")}>
          <span>
            <History />
          </span>
          <strong>History</strong>
          <ChevronRight />
        </button>
        <button onClick={() => setView("activity")}>
          <span>
            <Zap />
          </span>
          <strong>Activity</strong>
          <ChevronRight />
        </button>
      </div>
      <GradientPanel className="wallet-promo">
        <ShieldCheck />
        <div>
          <span className="eyebrow">CUSTODY CONTROL</span>
          <h2>Your funds stay yours.</h2>
          <p>
            Every movement is recorded, verified, and visible in your ledger.
          </p>
        </div>
      </GradientPanel>
    </div>
  );
}

function LiveTradePulse() {
  const [data, setData] = useState<LiveDashboard | null>(null);
  const [tab, setTab] = useState<
    | "Dashboard"
    | "Bots"
    | "Wallet"
    | "Desk"
    | "Account"
    | "Earn"
    | "Help"
    | "Synthetic"
    | "Admin"
  >("Dashboard");
  const [walletEntry, setWalletEntry] = useState<
    "overview" | "deposit" | "withdraw" | "history" | "activity" | "gas"
  >("overview");
  const [botEntryId, setBotEntryId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [openNotificationsRequest, setOpenNotificationsRequest] = useState(0);
  const [seenNoticeIds, setSeenNoticeIds] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("20");
  const [product, setProduct] = useState<"memecoin" | "synthetic">("memecoin");
  const [alertPrice, setAlertPrice] = useState("");
  const [deposit, setDeposit] = useState<{
    id: string;
    asset: string;
    chain: string;
    address: string;
    status: string;
  } | null>(null);
  const [depositAsset, setDepositAsset] = useState("USDT");
  const [depositChain, setDepositChain] = useState("ERC20");
  const [depositExpected, setDepositExpected] = useState("");
  const [withdrawAsset, setWithdrawAsset] = useState("USDT");
  const [withdrawChain, setWithdrawChain] = useState("ERC20");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawCode, setWithdrawCode] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [whitelistChain, setWhitelistChain] = useState("ERC20");
  const [whitelistAddress, setWhitelistAddress] = useState("");
  const [whitelistName, setWhitelistName] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [adminTarget, setAdminTarget] = useState("");
  const [adminAmount, setAdminAmount] = useState("");
  const [adminReason, setAdminReason] = useState("");
  const [settingKey, setSettingKey] = useState("deposit_min_usd");
  const [settingValue, setSettingValue] = useState("");
  const [vaultChain, setVaultChain] = useState("ERC20");
  const [vaultAsset, setVaultAsset] = useState("USDT");
  const [vaultAddress, setVaultAddress] = useState("");
  const [broadcastScope, setBroadcastScope] = useState("user");
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastConfirm, setBroadcastConfirm] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [syntheticMarket, setSyntheticMarket] = useState<"SYN-10" | "SYN-25" | "SYN-50" | "SYN-75" | "SYN-100">(
    "SYN-25",
  );
  const syntheticMarketRef = useRef(syntheticMarket);
  const [webEnvironment, setWebEnvironment] = useState<"mainnet" | "testnet">(
    "mainnet",
  );
  const [feeCapital, setFeeCapital] = useState("1000");
  const [feeGross, setFeeGross] = useState("80");
  const [charts, setCharts] = useState<
    Record<
      string,
      {
        market: string;
        points: Array<{ price: number; timestamp?: number }>;
        positions: Array<{
          id: string;
          market: string;
          direction: string;
          entry_price?: number;
          status: string;
        }>;
        activity: Array<{ created_at: number; net_realized: number }>;
        updated_at: number;
      }
    >
  >({});
  const [recoveryNetwork, setRecoveryNetwork] = useState("ERC20");
  const [recoveryAsset, setRecoveryAsset] = useState("USDT");
  const [recoveryHash, setRecoveryHash] = useState("");
  const [recoveryDestination, setRecoveryDestination] = useState("");
  const [syntheticAmount, setSyntheticAmount] = useState("20");
  const [synthetic, setSynthetic] = useState<{
    market: string;
    latest: { price?: number; reference?: number };
    ticks: Array<{ price?: number; reference?: number; timestamp?: number; created_at?: number }>;
    account?: {
      available_usd: number;
      locked_usd: number;
      realised_pnl_usd: number;
    };
    positions: Array<{
      id: string;
      market: string;
      direction: string;
      margin_usd: number;
      status: string;
      entry_price?: number;
      realized_pnl_usd?: number;
      clearing_type?: string;
      spread_charged_usd?: number;
      tier_fee_usd?: number;
      environment?: string;
    }>;
    live_disclosure_accepted?: boolean;
    execution_mode?: "MANUAL" | "AUTO";
    settings?: Record<string, string>;
  } | null>(null);
  const [syntheticSignals, setSyntheticSignals] = useState<Array<{
    id: string;
    market: string;
    direction: string;
    reference_price: number;
    expires_at: number;
  }>>([]);
  const [admin, setAdmin] = useState<LiveTradePulseAdmin | null>(null);
  // Keep the pending action identity so a top-up, order, approval, or close
  // cannot make an unrelated control render the wrong loading label.
  const [pendingActions, setPendingActions] = useState<Record<string, boolean>>({});
  const actionPending = Object.values(pendingActions).some(Boolean);
  const isActionPending = (key: string) => Boolean(pendingActions[key]);
  const headers = (targetEnvironment = webEnvironment) => ({
    "Content-Type": "application/json",
    "X-Telegram-Init-Data": telegramInitData(),
    "X-TradePulse-Environment": targetEnvironment,
  });
  const request = async (
    path: string,
    options: RequestInit = {},
    targetEnvironment = webEnvironment,
  ) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(`/api${path}`, {
        ...options,
        signal: controller.signal,
        headers: { ...headers(targetEnvironment), ...(options.headers || {}) },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Request failed.");
      return body;
    } finally {
      window.clearTimeout(timeout);
    }
  };
  const load = async (targetEnvironment = webEnvironment) => {
    // Keep the current desk mounted during background refreshes. This lets
    // optimistic toggles and button feedback render immediately instead of
    // replacing the whole surface with the boot screen after every action.
    const showBootScreen = !data;
    if (showBootScreen) setLoading(true);
    try {
      const webApp = await waitForTelegramWebApp();
      webApp?.ready?.();
      webApp?.expand?.();
      const next = await request("/v1/dashboard", {}, targetEnvironment);
      setData(next);
      setWebEnvironment(next.environment);
    } catch (error) {
      setNotice(
        error instanceof DOMException && error.name === "AbortError"
          ? "The desk took too long to respond. Please retry from Telegram."
          : error instanceof Error
            ? error.message
            : "Unable to load your desk.",
      );
    } finally {
      if (showBootScreen) setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 6500);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!data || notice || !data.notices?.length) return;
    const key = "tradepulse.web-notices";
    const now = Date.now();
    let seen: Record<string, number> = {};
    try {
      seen = JSON.parse(window.localStorage.getItem(key) || "{}");
    } catch {
      /* storage is optional */
    }
    const next = data.notices.find(
      (item) => !seen[item.id] || seen[item.id] < now,
    );
    if (!next) return;
    seen[next.id] = now + Math.max(30, data.popup_ttl_seconds || 600) * 1000;
    setSeenNoticeIds(seen);
    try {
      window.localStorage.setItem(key, JSON.stringify(seen));
    } catch {
      /* the in-memory toast still works */
    }
    setNotice(`${next.title} — ${next.body}`);
  }, [data, notice]);
  useEffect(() => {
    try {
      setSeenNoticeIds(JSON.parse(window.localStorage.getItem("tradepulse.web-notices") || "{}"));
    } catch {
      /* storage is optional */
    }
  }, []);
  useEffect(() => {
    if (tab !== "Synthetic" || !data) return;
    let cancelled = false;
    // A market snapshot is atomic. Clear the previous market immediately so
    // its chart, signals, price, and order controls cannot be shown under a
    // newly selected market label.
    setSynthetic(null);
    setSyntheticSignals([]);
    const refreshSynthetic = () => Promise.all([
      request(`/v1/synthetic/${syntheticMarket}`),
      request(`/v1/synthetic/signals?market=${syntheticMarket}&limit=10`),
    ]).then(([snapshot, signalData]) => {
      if (cancelled || snapshot.market !== syntheticMarket || snapshot.market !== syntheticMarketRef.current) return;
      setSynthetic(snapshot);
      setSyntheticSignals(signalData.signals || []);
    })
      .catch((error) => setNotice(error.message));
    void refreshSynthetic();
    const timer = window.setInterval(refreshSynthetic, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [tab, data, syntheticMarket, webEnvironment]);
  useEffect(() => {
    if (tab !== "Synthetic" || !data) return;
    let cancelled = false;
    let inFlight = false;
    const refreshSyntheticTick = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      try {
        const stream = await request(
          `/v1/synthetic/stream?market=${syntheticMarket}`,
          {},
          webEnvironment,
        );
        if (cancelled || !stream?.latest) return;
        const latest = stream.latest as {
          reference?: number;
          price?: number;
          timestamp?: number;
        };
        const price = Number(latest.reference ?? latest.price);
        if (!Number.isFinite(price) || price <= 0) return;
        setSynthetic((current) => {
          if (!current || current.market !== syntheticMarket) return current;
          const last = current.ticks.at(-1);
          if (
            last &&
            last.timestamp === latest.timestamp &&
            Number(last.reference ?? last.price) === price
          ) {
            return current;
          }
          return {
            ...current,
            latest,
            ticks: [...current.ticks, { ...latest, reference: price }].slice(-240),
            positions: stream.positions || current.positions,
          };
        });
      } catch {
        // The snapshot poll remains the recovery path if a tick poll is missed.
      } finally {
        inFlight = false;
      }
    };
    void refreshSyntheticTick();
    const timer = window.setInterval(refreshSyntheticTick, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [tab, data, syntheticMarket, webEnvironment]);
  useEffect(() => {
    if (tab !== "Admin" || !data?.user.is_admin) return;
    request("/v1/admin/overview")
      .then(setAdmin)
      .catch((error) => setNotice(error.message));
  }, [tab, data?.user.is_admin]);
  useEffect(() => {
    if (tab !== "Dashboard" || !data) return;
    const active = [
      ...new Set(
        data.bots
          .filter(
            (bot) =>
              bot.product === "memecoin" &&
              ["running", "paused"].includes(bot.state),
          )
          .map((bot) => bot.product),
      ),
    ];
    let cancelled = false;
    const refresh = () => {
      const chartRequests: Array<Promise<{ product: string; value: any } | null>> = [
        ...active.map((product) =>
          request(`/v1/charts/${product}`)
            .then((value) => ({ product, value }))
            .catch(() => null),
        ),
        // Synthetic prices are shared market data, so the live graph must not
        // depend on a user already having an open synthetic allocation.
        request("/v1/synthetic/SYN-25")
          .then((snapshot) => ({
            product: "synthetic",
            value: {
              market: snapshot.market || "SYN-25",
              points: (snapshot.ticks || []).map((tick: { price?: number; reference?: number; timestamp?: number; created_at?: number }) => ({
                price: Number(tick.reference ?? tick.price),
                timestamp: tick.timestamp ?? tick.created_at,
              })),
              positions: snapshot.positions || [],
              activity: [],
              updated_at: Date.now(),
            },
          }))
          .catch(() => null),
      ];
      return Promise.all(chartRequests).then((results) => {
        if (cancelled) return;
        setCharts((current) => ({
          ...current,
          ...Object.fromEntries(
            results.filter(Boolean).map((item) => [item!.product, item!.value]),
          ),
        }));
      });
    };
    void refresh();
    // Refresh the read-only market history frequently enough that the chart
    // does not appear frozen; execution still uses the authoritative engine.
    const timer = window.setInterval(refresh, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [tab, data?.bots]);
  useEffect(() => {
    if (tab !== "Dashboard" || !data) return;
    let cancelled = false;
    let inFlight = false;
    const refreshSyntheticTick = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      try {
        const stream = await request(
          "/v1/synthetic/stream?market=SYN-25",
          {},
          webEnvironment,
        );
        if (cancelled || !stream?.latest) return;
        const latest = stream.latest as {
          reference?: number;
          price?: number;
          timestamp?: number;
        };
        const price = Number(latest.reference ?? latest.price);
        if (!Number.isFinite(price) || price <= 0) return;
        const timestamp = latest.timestamp;
        setCharts((current) => {
          const existing = current.synthetic;
          const last = existing?.points.at(-1);
          if (last && last.timestamp === timestamp && last.price === price) {
            return current;
          }
          const points = [...(existing?.points || []), { price, timestamp }].slice(-240);
          return {
            ...current,
            synthetic: {
              market: existing?.market || "SYN-25",
              points,
              positions: stream.positions || existing?.positions || [],
              activity: existing?.activity || [],
              updated_at: Date.now(),
            },
          };
        });
      } catch {
        // The slower history refresh remains the recovery path if a tick poll is missed.
      } finally {
        inFlight = false;
      }
    };
    void refreshSyntheticTick();
    const timer = window.setInterval(refreshSyntheticTick, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [tab, data, webEnvironment]);
  const applyActionResult = (path: string, payload: Record<string, unknown>, response: Record<string, unknown>) => {
    const botAction = path.match(/^\/v1\/bots\/(\d+)\/actions$/);
    if (botAction) {
      const botId = Number(botAction[1]);
      const action = String(payload.action || "");
      const amount = Number(payload.amount || 0);
      const percent = Number(payload.percent || 0);
      const returnedBot = response.bot && typeof response.bot === "object"
        ? response.bot as Partial<LiveDashboard["bots"][number]>
        : null;
      const returnedWallet = response.wallet && typeof response.wallet === "object"
        ? response.wallet as Partial<LiveDashboard["wallet"]>
        : null;
      setData((current) => {
        if (!current) return current;
        const nextBots = returnedBot
          ? current.bots.map((bot) => bot.id === botId ? { ...bot, ...returnedBot } : bot)
          : action === "close"
            ? current.bots.filter((bot) => bot.id !== botId)
            : current.bots.map((bot) =>
                bot.id !== botId
                  ? bot
                  : action === "compound" && Number.isFinite(percent)
                    ? { ...bot, compound_percent: percent }
                    : action === "topup" && Number.isFinite(amount)
                      ? { ...bot, capital_usd: bot.capital_usd + amount }
                      : bot,
              );
        return {
          ...current,
          wallet: returnedWallet ? { ...current.wallet, ...returnedWallet } : current.wallet,
          bots: nextBots,
        };
      });
    }
    if (response.position && typeof response.position === "object") {
      const position = response.position as { id?: string };
      setSynthetic((current) =>
        current
          ? {
              ...current,
              positions: [
                position as (typeof current.positions)[number],
                ...current.positions.filter((item) => item.id !== position.id),
              ],
            }
          : current,
      );
    }
    if (path === "/v1/synthetic/disclosure" && response.accepted) {
      setSynthetic((current) =>
        current ? { ...current, live_disclosure_accepted: true } : current,
      );
    }
    if (path === "/v1/synthetic/settings/execution-mode" && response.execution_mode) {
      setSynthetic((current) =>
        current
          ? { ...current, execution_mode: response.execution_mode as "MANUAL" | "AUTO" }
          : current,
      );
    }
    if (path === "/v1/demo/start" && response.trial && typeof response.trial === "object") {
      setData((current) =>
        current ? { ...current, demo: response.trial as LiveDashboard["demo"] } : current,
      );
    }
  };
  const act = async (path: string, payload: Record<string, unknown>) => {
    const actionKey = path.includes("/synthetic/orders")
      ? String(payload.direction || "order")
      : path.includes("/synthetic/signals/")
        ? "approve"
        : path.includes("/synthetic/positions/")
          ? "close"
          : path.match(/^\/v1\/bots\/\d+\/actions$/)
            ? String(payload.action || "bot-action")
            : path.includes("execution-mode")
              ? String(payload.execution_mode || "execution-mode").toLowerCase()
              : path.includes("disclosure")
                ? "disclosure"
                : "action";
    if (isActionPending(actionKey)) return;
    setPendingActions((current) => ({ ...current, [actionKey]: true }));
    try {
      const response = await request(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      applyActionResult(path, payload, response);
      setNotice(response.message || "Saved successfully.");
      // The visible product/position is updated locally. Avoid reloading the
      // entire desk after a single click, which can interrupt unrelated work.
      if (tab === "Synthetic") {
        void request(`/v1/synthetic/${syntheticMarket}`)
          .then((snapshot) => {
            if (snapshot?.market === syntheticMarketRef.current) setSynthetic(snapshot);
          })
          .catch(() => undefined);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setPendingActions((current) => {
        const next = { ...current };
        delete next[actionKey];
        return next;
      });
    }
  };
  if (loading)
    return (
      <div className="boot-screen">
        <div className="boot-copy">
          <strong>
            TRADE<span>PULSE</span>
          </strong>
          <div className="boot-status">
            <span className="status-dot" />
            Loading your desk…
          </div>
        </div>
      </div>
    );
  if (!data)
    return (
      <div className="onboarding-screen">
        <img
          src="/illustrations/session-door-clean.png"
          alt="Secure Telegram session required"
          className="onboarding-hero"
        />
        <div className="onboarding-copy">
          <span className="eyebrow">SECURE ACCESS</span>
          <h1>
            {openedInsideTelegram()
              ? "Telegram session unavailable."
              : "Open TradePulse with Telegram."}
          </h1>
          <p>
            {notice ||
              (openedInsideTelegram()
                ? "Close this Mini App, return to @demo1vbot, and open TradePulse again from its menu button."
                : "Continue once in Telegram. When your identity is confirmed, this browser returns to your desk automatically.")}
          </p>
          {openedInsideTelegram() ? (
            <a
              className="primary-action"
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noreferrer"
            >
              Return to TradePulse <ChevronRight />
            </a>
          ) : (
            <BrowserBotHandoff />
          )}
          <small>
            TradePulse never asks for a password, seed phrase, or security code
            to connect a browser.
          </small>
        </div>
      </div>
    );
  if (!data.user.onboarding_complete)
    return (
      <div className="onboarding-screen">
        <img
          src="/illustrations/onboarding-welcome.png"
          alt="TradePulse welcome"
          className="onboarding-hero"
        />
        <div className="onboarding-copy">
          <span className="eyebrow">WELCOME TO TRADEPULSE</span>
          <h1>Before you start</h1>
          <p>
            By continuing, you accept the same Terms and risk disclosures
            required in Telegram. Deposits require on-chain confirmation;
            trading and demo results are not guaranteed; virtual demo funds are
            not withdrawable.
          </p>
          <button
            className="primary-action"
            onClick={async () => {
              try {
                await request("/v1/onboarding/accept", {
                  method: "POST",
                  body: "{}",
                });
                await load();
              } catch (error) {
                setNotice(
                  error instanceof Error
                    ? error.message
                    : "Could not save your acceptance.",
                );
              }
            }}
          >
            Accept terms and continue
          </button>
        </div>
      </div>
    );
  const gasLow = data.wallet.tank < data.wallet.tank_capacity * 0.25;
  const chartPoints = (synthetic?.ticks || [])
    .slice(-80)
    .map((tick) => ({
      price: Number(tick.reference ?? tick.price),
      timestamp: tick.timestamp ?? tick.created_at,
    }))
    .filter((tick) => Number.isFinite(tick.price) && tick.price > 0);
  const profileName =
    data.user.first_name || data.user.username || "Telegram user";
  const unreadNoticeCount = data.notices.filter(
    (item) => !seenNoticeIds[item.id] || seenNoticeIds[item.id] < Date.now(),
  ).length;
  const visualBots: Bot[] = data.bots.map((bot) => ({
    id: bot.id,
    name: bot.product === "memecoin" ? "Memecoin" : "Synthetic Indices",
    allocation: money(bot.capital_usd),
    equity: money(bot.capital_usd),
    percent: bot.state === "running" ? 72 : 0,
    gain: bot.state === "running" ? "Live" : "Paused",
    state: bot.state === "paused" ? "paused" : "running",
    compound: `${bot.compound_percent}%`,
  }));
  const visualModel: VisualDeskModel = {
    wallet: data.wallet,
    tier: data.user.tier,
    alerts: data.alerts.length,
    quotes: data.quotes,
    ledger: data.ledger,
    demo: data.demo,
  };
  const chromeActive = tab === "Desk" ? "Live Desk" : tab;
  const selectChromeTab = (value: string) => {
    if (value === "Live Desk") return setTab("Desk");
    if (value === "Community") {
      window.open(data.community_url, "_blank", "noopener,noreferrer");
      return;
    }
    if (value === "Admin" && !data.user.is_admin) return;
    if (
      [
        "Dashboard",
        "Bots",
        "Wallet",
        "Earn",
        "Account",
        "Help",
        "Synthetic",
        "Admin",
      ].includes(value)
    ) {
      if (value === "Bots") setBotEntryId(null);
      if (value === "Wallet") setWalletEntry("overview");
      setTab(value as typeof tab);
    }
  };
  const switchAdminEnvironment = async (
    nextEnvironment: "mainnet" | "testnet",
  ) => {
    try {
      await request("/v1/admin/environment", {
        method: "POST",
        body: JSON.stringify({ environment: nextEnvironment }),
      });
      setWebEnvironment(nextEnvironment);
      await load(nextEnvironment);
      setAdmin(await request("/v1/admin/overview", {}, nextEnvironment));
      setNotice(
        `Admin workspace switched to ${nextEnvironment}. Other admins and users are unaffected.`,
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Could not switch the admin workspace.",
      );
    }
  };
  const refreshAdmin = async () => {
    setAdmin(await request("/v1/admin/overview"));
    await load();
  };
  return (
    <div className="app-shell">
      <Sidebar
        active={chromeActive}
        setActive={selectChromeTab}
        profileName={profileName}
        profileTier={data.user.tier || "TradePulse account"}
        isAdmin={data.user.is_admin}
      />
      <main className="main-content">
        <Header
          setActive={selectChromeTab}
          onNotifications={() => {
            setTab("Account");
            setOpenNotificationsRequest((request) => request + 1);
          }}
          profileName={profileName}
          environment={data.environment.toUpperCase()}
          isAdmin={data.user.is_admin}
          pageTitle={chromeActive}
          notificationCount={unreadNoticeCount}
        />
        <div className="content-wrap">
          {notice && (
            <div className="toast-inline" role="status">
              <span className="status-dot" />
              {notice}
              <button className="icon-button" onClick={() => setNotice("")}>
                <X />
              </button>
            </div>
          )}
          {false && tab === "Dashboard" && (
            <div className="dashboard-grid">
              <GradientPanel className="balance-hero">
                <div className="panel-heading">
                  <span className="eyebrow">TOTAL EQUITY</span>
                  <span className="positive-chip">LIVE</span>
                </div>
                <div className="balance">{money(data.wallet.equity)}</div>
                <div className="balance-breakdown">
                  <div>
                    <span>AVAILABLE</span>
                    <strong>{money(data.wallet.available)}</strong>
                  </div>
                  <div>
                    <span>INVESTED</span>
                    <strong>{money(data.wallet.locked)}</strong>
                  </div>
                  <div>
                    <span>HIGH-WATER</span>
                    <strong>{money(data.wallet.hwm)}</strong>
                  </div>
                </div>
              </GradientPanel>
              <GradientPanel className="activity-card">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">YOUR LIVE FLEET</span>
                    <h2>My bots</h2>
                  </div>
                  <span className="mono">{data.bots.length} TOTAL</span>
                </div>
                {data.bots.map((bot) => (
                  <div className="activity-row" key={bot.id}>
                    <div className="activity-info">
                      <strong>
                        {bot.product === "memecoin"
                          ? "Memecoin"
                          : "Synthetic Indices"}
                      </strong>
                      <small>
                        {money(bot.capital_usd)} · Compounding{" "}
                        {bot.compound_percent}%
                      </small>
                    </div>
                    <span className={`status-chip ${bot.state}`}>
                      {bot.state}
                    </span>
                  </div>
                ))}
              </GradientPanel>
              {data.demo?.state === "issued" && (
                <GradientPanel className="demo-banner">
                  <div>
                    <span className="eyebrow">
                      MEMECOIN DEMO · VIRTUAL ONLY
                    </span>
                    <h2>{money(data.demo.grant_usd || 2000)} launch offer</h2>
                    <p>
                      Starts once, lasts 14 days after activation, and is never
                      wallet money or withdrawable. A future qualifying verified
                      mainnet deposit may create a capped, non-withdrawable fee
                      credit from eligible realised demo profit.
                    </p>
                  </div>
                  <button
                    className="primary-action"
                    onClick={() => act("/v1/demo/start", {})}
                  >
                    Start demo
                  </button>
                </GradientPanel>
              )}
              {data.demo?.state === "active" && (
                <GradientPanel className="demo-banner">
                  <div>
                    <span className="eyebrow">MEMECOIN DEMO ACTIVE</span>
                    <h2>Virtual funds are isolated</h2>
                    <p>
                      The demo and its profit expire under the configured terms.
                      Any eligible bonus is a capped performance-fee credit
                      after a qualifying verified mainnet deposit; it is not
                      cash or a balance.
                    </p>
                  </div>
                </GradientPanel>
              )}
              {gasLow && (
                <GradientPanel className="gas-low-banner">
                  <img
                    src="/illustrations/gas-gauge.png"
                    alt="Low gas tank"
                    className="gas-gauge-art"
                  />
                  <div>
                    <span className="eyebrow">NETWORK FEES</span>
                    <strong>Gas tank needs attention</strong>
                    <small>
                      {money(data.wallet.tank)} of{" "}
                      {money(data.wallet.tank_capacity)} remains. Top up before
                      a bot or withdrawal needs network coverage.
                    </small>
                  </div>
                  <button
                    className="primary-action"
                    onClick={() => setTab("Wallet")}
                  >
                    Top up
                  </button>
                </GradientPanel>
              )}
            </div>
          )}
          {tab === "Dashboard" && (
            <Dashboard
              bots={visualBots}
              model={visualModel}
              onManage={() => {
                setBotEntryId(null);
                setTab("Bots");
              }}
              onTopUp={() => {
                setWalletEntry("gas");
                setTab("Wallet");
              }}
              onStartDemo={() => act("/v1/demo/start", {})}
              onViewActivity={() => {
                setWalletEntry("activity");
                setTab("Wallet");
              }}
              onOpenBot={(bot) => {
                setBotEntryId(bot.id || null);
                setTab("Bots");
              }}
            />
          )}
          {tab === "Dashboard" &&
            Object.entries(charts).map(([product, chart]) => (
              <GradientPanel className="synthetic-pilot" key={product}>
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">
                      {product === "memecoin"
                        ? "MEMECOIN MARKET"
                        : "SYNTHETIC INDICES"}
                    </span>
                    <h2>{chart.market} live chart</h2>
                  </div>
                  <span className="live-indicator">
                    <i />
                    {product === "synthetic" ? "LIVE · 1s" : "quotes · 10s"}
                  </span>
                </div>
                <MarketChart
                  points={chart.points}
                  market={chart.market}
                  accent={product === "memecoin" ? "#60a5fa" : "#34d399"}
                />
                <div className="activity-row">
                  <div className="activity-info">
                    <strong>
                      {chart.points.length
                        ? Number(chart.points.at(-1)?.price || 0).toFixed(5)
                        : "Loading price…"}
                    </strong>
                    <small>
                      {chart.positions.length
                        ? `${chart.positions.length} of your own open position(s) overlaid below`
                        : "No open positions for this account"}
                    </small>
                  </div>
                </div>
                {chart.positions
                  .filter((position) => position.status === "open")
                  .map((position) => (
                    <div className="activity-row" key={position.id}>
                      <div className="activity-info">
                        <strong>
                          {position.market} · {position.direction}
                        </strong>
                        <small>
                          Entry {Number(position.entry_price || 0).toFixed(5)} ·
                          only visible to you
                        </small>
                      </div>
                    </div>
                  ))}
              </GradientPanel>
            ))}
          {tab === "Dashboard" && !data.bots.length && (
            <GradientPanel className="empty-bots">
              <img
                src="/illustrations/empty-bots.png"
                alt="No bots running"
                className="illustration-empty-bots"
                decoding="async"
              />
              <span className="eyebrow">YOUR BOT FLEET</span>
              <h2>Start your first trade</h2>
              <p>
                Choose Memecoin or Synthetic Indices when at least $20 is
                available.
              </p>
              <button className="primary-action" onClick={() => setTab("Bots")}>
                Start trade
              </button>
            </GradientPanel>
          )}
          {tab === "Dashboard" &&
            data.bots.some((bot) => bot.state === "paused") && (
              <GradientPanel className="bot-card">
                <img
                  src="/illustrations/engine-paused.png"
                  alt="Paused bot engine"
                  className="illustration-engine-paused"
                  decoding="async"
                />
                <div>
                  <span className="eyebrow">BOT PAUSED</span>
                  <h2>One or more bots are paused</h2>
                  <p>
                    Paused bots retain their allocation but do not process new
                    strategy runs until you resume them.
                  </p>
                  <button
                    className="primary-action"
                    onClick={() => setTab("Bots")}
                  >
                    Manage bots
                  </button>
                </div>
              </GradientPanel>
            )}
          {tab === "Dashboard" && data.demo?.state === "issued" && (
            <GradientPanel className="demo-banner">
              <img
                src="/illustrations/demo-banner.png"
                alt="Virtual memecoin demo"
                className="illustration-demo-banner"
                decoding="async"
              />
              <div>
                <span className="eyebrow">VIRTUAL DEMO</span>
                <h2>Explore before you fund</h2>
                <p>
                  Your virtual demo is isolated from wallet funds and cannot be
                  withdrawn.
                </p>
              </div>
            </GradientPanel>
          )}
          {tab === "Bots" && (
            <LiveBotsScreen
              data={data}
              request={request}
              reload={load}
              onNotice={setNotice}
              onOpenDemo={() => setTab("Dashboard")}
              initialBotId={botEntryId}
            />
          )}
          {false && tab === "Bots" && (
            <div className="wallet-grid">
              <GradientPanel className="flow-card">
                <span className="eyebrow">START TRADE</span>
                <h2>One bot per product</h2>
                <p>
                  Minimum allocation is $20. Capital cannot exceed your
                  available balance.
                </p>
                <div className="segment-control">
                  {(["memecoin", "synthetic"] as const).map((item) => (
                    <button
                      className={product === item ? "active" : ""}
                      key={item}
                      onClick={() => setProduct(item)}
                    >
                      {item === "memecoin" ? "Memecoin" : "Synthetic Indices"}
                    </button>
                  ))}
                </div>
                <label className="amount-field">
                  <span>ALLOCATION (USD)</span>
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    inputMode="decimal"
                  />
                </label>
                <button
                  className="primary-action"
                  onClick={() =>
                    act("/v1/bots", { product, amount: Number(amount) })
                  }
                >
                  Start trade <Plus />
                </button>
              </GradientPanel>
              {data.bots.map((bot) => (
                <GradientPanel className="bot-card" key={bot.id}>
                  <div className="bot-title">
                    <strong>{bot.name}</strong>
                    <span className={`status-chip ${bot.state}`}>
                      {bot.state}
                    </span>
                  </div>
                  <div className="bot-equity">
                    <strong>{money(bot.capital_usd)}</strong>
                    <span>Compound {bot.compound_percent}%</span>
                  </div>
                  <div className="button-row">
                    <button
                      className="small-action"
                      onClick={() =>
                        act(`/v1/bots/${bot.id}/actions`, { action: "toggle" })
                      }
                    >
                      {bot.state === "running" ? "Pause" : "Resume"}
                    </button>
                    <button
                      className="danger-action"
                      onClick={() =>
                        act(`/v1/bots/${bot.id}/actions`, { action: "close" })
                      }
                    >
                      Close bot
                    </button>
                  </div>
                  <div className="button-row">
                    <button
                      className="ghost-action"
                      disabled={actionPending}
                      onClick={() =>
                        act(`/v1/bots/${bot.id}/actions`, {
                          action: "compound",
                          percent: 0,
                        })
                      }
                    >
                      Compound 0%
                    </button>
                    <button
                      className="ghost-action"
                      disabled={actionPending}
                      onClick={() =>
                        act(`/v1/bots/${bot.id}/actions`, {
                          action: "compound",
                          percent: 50,
                        })
                      }
                    >
                      Compound 50%
                    </button>
                    <button
                      className="ghost-action"
                      onClick={() =>
                        act(`/v1/bots/${bot.id}/actions`, {
                          action: "compound",
                          percent: 100,
                        })
                      }
                    >
                      Compound 100%
                    </button>
                  </div>
                </GradientPanel>
              ))}
            </div>
          )}
          {tab === "Wallet" && (
            <LiveWalletScreen
              data={data}
              request={request}
              onWalletUpdate={({ wallet, withdrawal, deposits }) =>
                setData((current) =>
                  current
                    ? {
                        ...current,
                        wallet: wallet ? { ...current.wallet, ...wallet } : current.wallet,
                        deposits: deposits || current.deposits,
                        withdrawals: withdrawal
                          ? [withdrawal, ...current.withdrawals.filter((row) => row.id !== withdrawal.id)]
                          : current.withdrawals,
                      }
                    : current,
                )
              }
              onNotice={setNotice}
              initialView={walletEntry}
            />
          )}
          {false && tab === "Wallet" && (
            <div className="wallet-grid">
              <div className="wallet-stat-grid">
                {[
                  ["Available", data.wallet.available],
                  ["Locked", data.wallet.locked],
                  ["Equity", data.wallet.equity],
                  ["Gas tank", data.wallet.tank],
                ].map(([label, value]) => (
                  <GradientPanel className="wallet-stat" key={String(label)}>
                    <span className="eyebrow">{label}</span>
                    <strong>{money(Number(value))}</strong>
                  </GradientPanel>
                ))}
              </div>
              <GradientPanel className="flow-card">
                <span className="eyebrow">DEPOSIT · ONE-TIME ROUTE</span>
                <h2>Fund your desk</h2>
                <div className="alert-fields">
                  <select
                    value={depositAsset}
                    onChange={(event) => setDepositAsset(event.target.value)}
                  >
                    <option>USDT</option>
                    <option>USDC</option>
                  </select>
                  <select
                    value={depositChain}
                    onChange={(event) => setDepositChain(event.target.value)}
                  >
                    <option value="ERC20">Ethereum</option>
                    <option value="BEP20">BNB Chain</option>
                    <option value="BASE">Base</option>
                    <option value="ARBITRUM">Arbitrum</option>
                    <option value="POLYGON">Polygon</option>
                  </select>
                </div>
                <label className="amount-field">
                  <span>EXPECTED AMOUNT · OPTIONAL</span>
                  <input
                    value={depositExpected}
                    onChange={(event) => setDepositExpected(event.target.value)}
                    inputMode="decimal"
                    placeholder="Used for your route card; on-chain amount controls credit"
                  />
                </label>
                <button
                  className="primary-action"
                  onClick={async () => {
                    try {
                      const result = await request("/v1/deposits/routes", {
                        method: "POST",
                        body: JSON.stringify({
                          asset: depositAsset,
                          chain: depositChain,
                          expected_amount: depositExpected || null,
                        }),
                      });
                      setDeposit(result.intent);
                      setNotice(
                        "Deposit route ready. Send only the selected asset and network.",
                      );
                    } catch (error) {
                      setNotice(
                        error instanceof Error
                          ? error.message
                          : "Could not create a deposit route.",
                      );
                    }
                  }}
                >
                  Create deposit route <Plus />
                </button>
                {deposit && (
                  <div className="minimum-warning">
                    <span>!</span>
                    <div>
                      <strong>
                        {deposit.asset} on {deposit.chain}
                      </strong>
                      <p>
                        <code>{deposit.address}</code>
                      </p>
                      <p>
                        Use this address once. Do not send another asset or
                        network.
                      </p>
                      <button
                        className="small-action"
                        onClick={async () => {
                          try {
                            const result = await request(
                              `/v1/deposits/${deposit.id}/watch`,
                              { method: "POST", body: "{}" },
                            );
                            setNotice(
                              `Monitoring started · ${result.status}. No credit is assumed until on-chain confirmation.`,
                            );
                            await load();
                          } catch (error) {
                            setNotice(
                              error instanceof Error
                                ? error.message
                                : "Could not start monitoring.",
                            );
                          }
                        }}
                      >
                        I made this deposit
                      </button>
                    </div>
                  </div>
                )}
              </GradientPanel>
              <GradientPanel className="flow-card">
                <span className="eyebrow">WITHDRAW · REVIEW REQUIRED</span>
                <h2>Request a withdrawal</h2>
                <div className="alert-fields">
                  <select
                    value={withdrawAsset}
                    onChange={(event) => setWithdrawAsset(event.target.value)}
                  >
                    <option>USDT</option>
                    <option>USDC</option>
                  </select>
                  <select
                    value={withdrawChain}
                    onChange={(event) => setWithdrawChain(event.target.value)}
                  >
                    <option value="ERC20">Ethereum</option>
                    <option value="BEP20">BNB Chain</option>
                    <option value="BASE">Base</option>
                    <option value="ARBITRUM">Arbitrum</option>
                    <option value="POLYGON">Polygon</option>
                  </select>
                </div>
                <label className="amount-field">
                  <span>DESTINATION ADDRESS</span>
                  <input
                    value={withdrawAddress}
                    onChange={(event) => setWithdrawAddress(event.target.value)}
                    placeholder="0x…"
                  />
                </label>
                <label className="amount-field">
                  <span>AMOUNT (USD)</span>
                  <input
                    value={withdrawAmount}
                    onChange={(event) => setWithdrawAmount(event.target.value)}
                    inputMode="decimal"
                  />
                </label>
                <label className="amount-field">
                  <span>SIX-DIGIT SECURITY CODE</span>
                  <input
                    type="password"
                    value={withdrawCode}
                    onChange={(event) =>
                      setWithdrawCode(
                        event.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    inputMode="numeric"
                  />
                </label>
                <button
                  className="primary-action"
                  onClick={async () => {
                    try {
                      const result = await request("/v1/withdrawals", {
                        method: "POST",
                        body: JSON.stringify({
                          asset: withdrawAsset,
                          chain: withdrawChain,
                          address: withdrawAddress,
                          amount: Number(withdrawAmount),
                          security_code: withdrawCode,
                        }),
                      });
                      setNotice(
                        `Withdrawal ${result.withdrawal_id.slice(0, 8)} queued for admin release.`,
                      );
                      setWithdrawAddress("");
                      setWithdrawAmount("");
                      setWithdrawCode("");
                      await load();
                    } catch (error) {
                      setNotice(
                        error instanceof Error
                          ? error.message
                          : "Withdrawal could not be created.",
                      );
                    }
                  }}
                >
                  Review and request withdrawal <Send />
                </button>
              </GradientPanel>
              <GradientPanel className="gas-card">
                <span className="eyebrow">GAS TANK</span>
                <h2>Keep operations funded</h2>
                <div className="gas-meter">
                  <Fuel />
                  <strong>{money(data.wallet.tank)}</strong>
                  <div className="gas-track">
                    <i
                      style={{
                        width: `${Math.min(100, (data.wallet.tank / Math.max(data.wallet.tank_capacity, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <label className="amount-field">
                  <span>TOP-UP FROM AVAILABLE BALANCE</span>
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    inputMode="decimal"
                  />
                </label>
                <button
                  className="primary-action"
                  onClick={() =>
                    act("/v1/tank/actions", {
                      action: "topup",
                      amount: Number(amount),
                    })
                  }
                >
                  Top up gas tank <Fuel />
                </button>
                <button
                  className="ghost-action"
                  onClick={() =>
                    act("/v1/tank/actions", { action: "autofill" })
                  }
                >
                  Auto-fill: {data.wallet.tank_autofill ? "ON" : "OFF"}
                </button>
              </GradientPanel>
              <GradientPanel className="ledger-card">
                <span className="eyebrow">RECENT LEDGER</span>
                {data.ledger.map((entry, index) => (
                  <div
                    className="ledger-row"
                    key={`${entry.created_at}-${index}`}
                  >
                    <div>
                      <strong>{entry.kind}</strong>
                      <small>
                        {entry.asset} · {entry.status}
                      </small>
                    </div>
                    <code>{money(entry.amount_usd)}</code>
                  </div>
                ))}
              </GradientPanel>
            </div>
          )}
          {false && tab === "Wallet" && (
            <div className="wallet-grid">
              <GradientPanel className="ledger-card">
                <span className="eyebrow">MY DEPOSITS</span>
                {data.deposits.map((row) => (
                  <div className="ledger-row" key={row.id}>
                    <div>
                      <strong>
                        {row.asset} · {row.chain}
                      </strong>
                      <small>
                        {row.status} · {row.address}
                      </small>
                    </div>
                    <code>{row.id.slice(0, 8)}</code>
                  </div>
                )) || <p>No deposits yet.</p>}
              </GradientPanel>
              <GradientPanel className="ledger-card">
                <span className="eyebrow">MY WITHDRAWALS</span>
                {data.withdrawals.map((row) => (
                  <div className="ledger-row" key={row.id}>
                    <div>
                      <strong>
                        {money(row.amount_usd)} {row.asset} · {row.chain}
                      </strong>
                      <small>
                        {row.status} · {row.address}
                      </small>
                    </div>
                    <code>{row.id.slice(0, 8)}</code>
                  </div>
                )) || <p>No withdrawals yet.</p>}
              </GradientPanel>
              <GradientPanel className="ledger-card">
                <span className="eyebrow">TRADING ACTIVITY</span>
                {data.engine.map((row, index) => (
                  <div
                    className="ledger-row"
                    key={`${row.created_at}-${index}`}
                  >
                    <div>
                      <strong>{row.status}</strong>
                      <small>Engine run</small>
                    </div>
                    <code>{money(row.net_realized)}</code>
                  </div>
                )) || <p>No engine activity yet.</p>}
              </GradientPanel>
            </div>
          )}
          {tab === "Desk" && (
            <LiveDeskScreen
              data={data}
              request={request}
              reload={load}
              onNotice={setNotice}
            />
          )}
          {false && tab === "Desk" && (
            <div className="desk-screen">
              <GradientPanel className="alert-card">
                <span className="eyebrow">PRICE ALERT</span>
                <h2>Monitor a market condition</h2>
                <div className="alert-fields">
                  <select id="asset">
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
                    <option value="SOL">SOL</option>
                  </select>
                  <select id="operator">
                    <option value="above">above</option>
                    <option value="below">below</option>
                  </select>
                  <input
                    value={alertPrice}
                    onChange={(event) => setAlertPrice(event.target.value)}
                    placeholder="Price"
                    inputMode="decimal"
                  />
                </div>
                <button
                  className="primary-action"
                  onClick={() => {
                    const asset = (
                      document.getElementById("asset") as HTMLSelectElement
                    ).value;
                    const operator = (
                      document.getElementById("operator") as HTMLSelectElement
                    ).value;
                    void act("/v1/alerts", {
                      asset,
                      operator,
                      threshold: Number(alertPrice),
                    });
                  }}
                >
                  Create alert <Bell />
                </button>
              </GradientPanel>
              <GradientPanel className="announcements">
                <span className="eyebrow">SAFE USE</span>
                <h2>Deposit and withdrawal protections</h2>
                <p>
                  Deposit routes are one-time and credit only after detected
                  on-chain confirmation. Withdrawals must be reviewed against
                  the selected network and destination. These actions remain
                  available in the Telegram bot while their web screens are
                  migrated to the signed API.
                </p>
              </GradientPanel>
            </div>
          )}
          {false && tab === "Desk" && (
            <div className="desk-screen">
              <GradientPanel className="alert-card">
                <span className="eyebrow">PRICE ALERT</span>
                <h2>Monitor a market condition</h2>
                <div className="alert-fields">
                  <select id="asset">
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
                    <option value="SOL">SOL</option>
                  </select>
                  <select id="operator">
                    <option value="above">above</option>
                    <option value="below">below</option>
                  </select>
                  <input
                    value={alertPrice}
                    onChange={(event) => setAlertPrice(event.target.value)}
                    placeholder="Price"
                    inputMode="decimal"
                  />
                </div>
                <button
                  className="primary-action"
                  onClick={() => {
                    const asset = (
                      document.getElementById("asset") as HTMLSelectElement
                    ).value;
                    const operator = (
                      document.getElementById("operator") as HTMLSelectElement
                    ).value;
                    void act("/v1/alerts", {
                      asset,
                      operator,
                      threshold: Number(alertPrice),
                    });
                  }}
                >
                  Create alert <Bell />
                </button>
              </GradientPanel>
              <GradientPanel className="announcements">
                <span className="eyebrow">SAFE USE</span>
                <h2>Deposit and withdrawal protections</h2>
                <p>
                  Deposit routes are one-time and credit only after detected
                  on-chain confirmation. Withdrawals require the selected
                  network, destination, available funds, and your existing
                  six-digit security code. The server rejects anything that does
                  not meet those rules.
                </p>
              </GradientPanel>
            </div>
          )}
          {false && tab === "Desk" && (
            <GradientPanel className="ledger-card">
              <span className="eyebrow">MY PRICE ALERTS</span>
              {data.alerts.length ? (
                data.alerts.map((alert) => (
                  <div className="ledger-row" key={alert.id}>
                    <div>
                      <strong>
                        {alert.asset} {alert.operator} {alert.threshold}
                      </strong>
                      <small>Armed price alert</small>
                    </div>
                    <button
                      className="small-action"
                      onClick={() => act(`/v1/alerts/${alert.id}/remove`, {})}
                    >
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <p>No active alerts.</p>
              )}
            </GradientPanel>
          )}
          {false && tab === "Desk" && (
            <GradientPanel className="announcements">
              <span className="eyebrow">LIVE PRICES · INFORMATIONAL</span>
              <h2>Market pulse</h2>
              {Object.entries(data.quotes).map(([asset, value]) => (
                <div className="activity-row" key={asset}>
                  <strong>{asset}</strong>
                  <span>
                    {Number(value).toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: value < 10 ? 4 : 2,
                    })}
                  </span>
                </div>
              ))}
              <p>
                {data.quote_fresh ? "Live" : "Cached"} quote source · updated{" "}
                {data.quote_age}s ago. No momentum or trade signal is claimed
                until a verified feed supplies it.
              </p>
            </GradientPanel>
          )}
          {tab === "Earn" && <LiveEarnScreen data={data} />}
          {false && tab === "Earn" && (
            <div className="desk-screen">
              <GradientPanel className="balance-hero">
                <span className="eyebrow">REFERRAL HQ</span>
                <h2>
                  {data.referral.count} direct invite
                  {data.referral.count === 1 ? "" : "s"}
                </h2>
                <div className="balance-breakdown">
                  <div>
                    <span>ACCRUED THIS CYCLE</span>
                    <strong>{money(data.referral.accrued_usd)}</strong>
                  </div>
                  <div>
                    <span>DIRECT RATE</span>
                    <strong>{data.referral_rates[0] || 0}%</strong>
                  </div>
                  <div>
                    <span>YOUR TIER</span>
                    <strong>{data.user.tier}</strong>
                  </div>
                </div>
                <code>
                  t.me/{data.referral.bot_username}?start=ref_
                  {data.user.id || ""}
                </code>
              </GradientPanel>
              <GradientPanel className="announcements">
                <span className="eyebrow">TIER & FEES</span>
                <h2>High-water-mark fee plans</h2>
                {data.tier_config.map((tier) => (
                  <div className="activity-row" key={tier.name}>
                    <strong>{tier.name}</strong>
                    <small>
                      {money(tier.monthly)}/month · {tier.rate}% above the
                      high-water mark
                    </small>
                  </div>
                ))}
                <p>
                  Fees apply only to new profit above the applicable high-water
                  mark—never deposits, losses, or a flat balance.
                </p>
              </GradientPanel>
            </div>
          )}
          {false && tab === "Earn" && (
            <GradientPanel className="flow-card">
              <span className="eyebrow">FEE SIMULATOR</span>
              <h2>Illustrative HWM calculation</h2>
              <div className="alert-fields">
                <input
                  value={feeCapital}
                  onChange={(event) => setFeeCapital(event.target.value)}
                  inputMode="decimal"
                  placeholder="Capital"
                />
                <input
                  value={feeGross}
                  onChange={(event) => setFeeGross(event.target.value)}
                  inputMode="decimal"
                  placeholder="Expected gross profit"
                />
              </div>
              {(() => {
                const capital = Math.max(0, Number(feeCapital) || 0);
                const gross = Math.max(0, Number(feeGross) || 0);
                const tier =
                  data.tier_config.find(
                    (item) => item.name === data.user.tier,
                  ) || data.tier_config[0];
                const fee = (gross * Number(tier?.rate || 0)) / 100;
                return (
                  <p>
                    Illustration only: {money(gross)} gross above HWM −{" "}
                    {money(fee)} fee = <strong>{money(gross - fee)}</strong>{" "}
                    net. Deposits, losses, and profit below the HWM do not
                    create this fee.
                  </p>
                );
              })()}
              <p>
                Leaderboard: season one has no ranked entries until performance
                fees settle.
              </p>
            </GradientPanel>
          )}
          {tab === "Help" && (
            <LiveHelpScreen
              data={data}
              request={request}
              onNotice={setNotice}
            />
          )}
          {false && tab === "Help" && (
            <div className="desk-screen">
              <GradientPanel className="announcements">
                <span className="eyebrow">HELP CENTER</span>
                <h2>Common account questions</h2>
                <p>
                  <strong>Deposit below minimum:</strong> send the remaining
                  amount to the same active address.
                </p>
                <p>
                  <strong>Deposit not showing:</strong> use the original route’s
                  “I made this deposit” check after sending.
                </p>
                <p>
                  <strong>Wrong network:</strong> do not send more; submit the
                  transaction hash for manual recovery.
                </p>
                <p>
                  <strong>Withdrawal pending:</strong> the amount remains locked
                  until release or rejection.
                </p>
                <button
                  className="primary-action"
                  onClick={() =>
                    window.open(
                      data.community_url,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                >
                  Join community
                </button>
              </GradientPanel>
              <GradientPanel className="flow-card">
                <span className="eyebrow">WRONG-NETWORK RECOVERY</span>
                <h2>Submit for manual review</h2>
                <div className="alert-fields">
                  <input
                    value={recoveryNetwork}
                    onChange={(event) => setRecoveryNetwork(event.target.value)}
                    placeholder="Network"
                  />
                  <input
                    value={recoveryAsset}
                    onChange={(event) => setRecoveryAsset(event.target.value)}
                    placeholder="Asset"
                  />
                </div>
                <input
                  value={recoveryHash}
                  onChange={(event) => setRecoveryHash(event.target.value)}
                  placeholder="Transaction hash"
                />
                <input
                  value={recoveryDestination}
                  onChange={(event) =>
                    setRecoveryDestination(event.target.value)
                  }
                  placeholder="Address you sent to"
                />
                <button
                  className="primary-action"
                  onClick={() =>
                    act("/v1/recovery", {
                      network: recoveryNetwork,
                      asset: recoveryAsset,
                      tx_hash: recoveryHash,
                      destination: recoveryDestination,
                      details: supportMessage,
                    })
                  }
                >
                  Submit recovery case
                </button>
              </GradientPanel>
            </div>
          )}
          {tab === "Account" && (
            <LiveAccountScreen
              data={data}
              request={request}
              reload={load}
              onNotice={setNotice}
              openNotificationsRequest={openNotificationsRequest}
            />
          )}
          {false && tab === "Account" && (
            <div className="account-screen">
              <GradientPanel className="profile-card">
                <div className="top-avatar">
                  {(data.user.first_name || "U").slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <strong>{data.user.first_name || "Telegram user"}</strong>
                  <small>
                    {data.user.username
                      ? `@${data.user.username}`
                      : "No username"}{" "}
                    · {data.user.tier}
                  </small>
                </div>
              </GradientPanel>
              <GradientPanel className="notifications">
                <span className="eyebrow">NOTIFICATIONS</span>
                <h2>Keep me informed</h2>
                {[
                  ["fills", "Fills"],
                  ["fees", "Fees"],
                  ["deposits", "Deposits"],
                  ["tank_low", "Tank low"],
                  ["hwm_breaks", "High-water mark"],
                ].map(([key, label]) => (
                  <label className="toggle-row" key={key}>
                    <span>
                      {label}
                      <small>Send this alert in Telegram</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(data.notifications[key])}
                      onChange={() =>
                        act("/v1/account/notifications", { name: key })
                      }
                    />
                    <i />
                  </label>
                ))}
              </GradientPanel>
              <GradientPanel className="whitelist-card">
                <span className="eyebrow">WITHDRAWAL WHITELIST</span>
                <h2>Saved destinations</h2>
                <select
                  value={whitelistChain}
                  onChange={(event) => setWhitelistChain(event.target.value)}
                >
                  <option value="ERC20">Ethereum</option>
                  <option value="BEP20">BNB Chain</option>
                  <option value="BASE">Base</option>
                  <option value="ARBITRUM">Arbitrum</option>
                  <option value="POLYGON">Polygon</option>
                </select>
                <input
                  value={whitelistName}
                  onChange={(event) => setWhitelistName(event.target.value)}
                  placeholder="Route name"
                />
                <input
                  value={whitelistAddress}
                  onChange={(event) => setWhitelistAddress(event.target.value)}
                  placeholder="0x destination"
                />
                <button
                  className="primary-action"
                  onClick={async () => {
                    try {
                      await request("/v1/account/whitelist", {
                        method: "POST",
                        body: JSON.stringify({
                          chain: whitelistChain,
                          nickname: whitelistName,
                          address: whitelistAddress,
                        }),
                      });
                      setNotice(
                        "Destination saved with the configured cooling period.",
                      );
                      setWhitelistAddress("");
                      setWhitelistName("");
                      await load();
                    } catch (error) {
                      setNotice(
                        error instanceof Error
                          ? error.message
                          : "Could not save destination.",
                      );
                    }
                  }}
                >
                  Add destination
                </button>
              </GradientPanel>
              <GradientPanel className="reset-card">
                <span className="eyebrow">SUPPORT & HELP</span>
                <h2>Report an account issue</h2>
                <textarea
                  value={supportMessage}
                  onChange={(event) => setSupportMessage(event.target.value)}
                  placeholder="Describe the issue, transaction reference, and relevant network."
                />
                <button
                  className="primary-action"
                  onClick={async () => {
                    try {
                      const response = await request("/v1/support/tickets", {
                        method: "POST",
                        body: JSON.stringify({
                          topic: "Web desk support",
                          message: supportMessage,
                        }),
                      });
                      setNotice(
                        `Support ticket #${response.ticket_id} opened.`,
                      );
                      setSupportMessage("");
                    } catch (error) {
                      setNotice(
                        error instanceof Error
                          ? error.message
                          : "Could not create ticket.",
                      );
                    }
                  }}
                >
                  Open support ticket
                </button>
              </GradientPanel>
            </div>
          )}
          {false && tab === "Account" && (
            <GradientPanel className="reset-card">
              <span className="eyebrow">DESK RESET</span>
              <h2>Restore desk preferences</h2>
              <p>
                This clears alerts and restores notification preferences. It
                cannot change balances, bots, deposits, withdrawals, security,
                trial history, or fee credit.
              </p>
              <button
                className="ghost-action"
                onClick={() => act("/v1/account/reset", {})}
              >
                Reset desk preferences
              </button>
            </GradientPanel>
          )}
          {false && tab === "Account" && (
            <GradientPanel className="reset-card">
              <span className="eyebrow">WITHDRAWAL SECURITY</span>
              <h2>Set or change six-digit code</h2>
              <p>
                The same security code is required before any withdrawal
                request. Never share it with support or an administrator.
              </p>
              <input
                type="password"
                value={securityCode}
                onChange={(event) =>
                  setSecurityCode(
                    event.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                inputMode="numeric"
                placeholder="Six-digit security code"
              />
              <button
                className="primary-action"
                onClick={() =>
                  act("/v1/account/security-code", { code: securityCode })
                }
              >
                Save security code
              </button>
            </GradientPanel>
          )}
          {tab === "Synthetic" && (
            <div className="desk-screen">
              <GradientPanel className="synthetic-pilot">
                <span className="eyebrow">SYNTHETIC INDICES</span>
                <div className="segment-control">
                  {(["SYN-10", "SYN-25", "SYN-50", "SYN-75", "SYN-100"] as const).map((market) => (
                    <button
                      key={market}
                      className={syntheticMarket === market ? "active" : ""}
                      onClick={() => {
                        if (market === syntheticMarket) return;
                        setSynthetic(null);
                        setSyntheticSignals([]);
                        syntheticMarketRef.current = market;
                        setSyntheticMarket(market);
                      }}
                    >
                      {market}
                    </button>
                  ))}
                </div>
                <p>Shared prices for every user. Volatility tiers describe movement intensity, not expected profit. Mainnet orders reserve wallet USD 1:1; testnet pilot funds never mix with wallet balances.</p>
                <span className="live-indicator"><i />LIVE · 1s</span>
                {synthetic ? (
                  <>
                    <MarketChart points={chartPoints} market={syntheticMarket} />
                    <div className="wallet-stat-grid">
                      <div><span className="eyebrow">LAST TICK</span><strong>{Number(synthetic.latest?.reference || 0).toFixed(5)}</strong></div>
                      <div><span className="eyebrow">UNASSIGNED</span><strong>{money(data.wallet.available || 0)}</strong></div>
                      <div><span className="eyebrow">ALLOCATION</span><strong>{money(data.bots.find((bot) => bot.product === "synthetic")?.capital_usd || 0)}</strong></div>
                      <div><span className="eyebrow">EXECUTION</span><strong>{synthetic.execution_mode || "MANUAL"}</strong></div>
                    </div>
                    {webEnvironment === "mainnet" ? (
                      <>
                        {!synthetic.live_disclosure_accepted && (
                          <div className="announcements">
                            <span className="eyebrow">LIVE-RISK DISCLOSURE</span>
                            <p>Prices are shared and execution uses a transparent spread plus your tier volume fee. Positions are 1:1 margin and can lose their reserved margin.</p>
                            <button className="primary-action" onClick={() => act("/v1/synthetic/disclosure", {})}>Accept disclosure</button>
                          </div>
                        )}
                        <div className="amount-input"><span>$</span><input value={syntheticAmount} onChange={(event) => setSyntheticAmount(event.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" aria-label="Synthetic margin" /></div>
                        {data.bots.find((bot) => bot.product === "synthetic") && <button className="small-action" disabled={Number(syntheticAmount) < 20 || isActionPending("topup")} onClick={() => {
                          const bot = data.bots.find((item) => item.product === "synthetic");
                          if (bot) void act(`/v1/bots/${bot.id}/actions`, { action: "topup", amount: Number(syntheticAmount) });
                        }}>{isActionPending("topup") ? "Updating…" : "Top up Synthetic"}</button>}
                        <p>Before approval: 1:1 margin {money(Number(syntheticAmount) || 0)} · spread {money((Number(syntheticAmount) || 0) * Number(synthetic.settings?.spread_bps || 4) / 10000)} · tier fee {money((Number(syntheticAmount) || 0) * Number(synthetic.settings?.[`fee_bps_${data.user.tier.toLowerCase()}`] || 20) / 10000)}.</p>
                        <div className="button-row">
                          <button className={synthetic.execution_mode === "MANUAL" ? "small-action active" : "small-action"} disabled={isActionPending("manual")} onClick={() => act("/v1/synthetic/settings/execution-mode", { execution_mode: "MANUAL", auto_margin_usd: Number(syntheticAmount) })}>{isActionPending("manual") ? "Saving…" : "Manual"}</button>
                          <button className={synthetic.execution_mode === "AUTO" ? "small-action active" : "small-action"} disabled={isActionPending("auto")} onClick={() => act("/v1/synthetic/settings/execution-mode", { execution_mode: "AUTO", auto_margin_usd: Number(syntheticAmount) })}>{isActionPending("auto") ? "Saving…" : "Auto"}</button>
                          <button className="small-action" disabled={!synthetic.live_disclosure_accepted || isActionPending("long")} onClick={() => act("/v1/synthetic/orders", { market: syntheticMarket, direction: "long", amount: Number(syntheticAmount), mode: (synthetic.execution_mode || "MANUAL").toLowerCase(), idempotency_key: `web:${syntheticMarket}:long:${Date.now()}` })}>{isActionPending("long") ? "Submitting…" : "Long"}</button>
                          <button className="small-action" disabled={!synthetic.live_disclosure_accepted || isActionPending("short")} onClick={() => act("/v1/synthetic/orders", { market: syntheticMarket, direction: "short", amount: Number(syntheticAmount), mode: (synthetic.execution_mode || "MANUAL").toLowerCase(), idempotency_key: `web:${syntheticMarket}:short:${Date.now()}` })}>{isActionPending("short") ? "Submitting…" : "Short"}</button>
                        </div>
                        {syntheticSignals.filter((signal) => signal.expires_at * 1000 > Date.now()).slice(0, 3).map((signal) => (
                          <div className="activity-row" key={signal.id}><div className="activity-info"><strong>{signal.market} · {signal.direction} signal</strong><small>Reference {Number(signal.reference_price).toFixed(5)} · expires soon</small></div><button className="small-action" disabled={!synthetic.live_disclosure_accepted || isActionPending("approve")} onClick={() => act(`/v1/synthetic/signals/${signal.id}/approve`, { amount: Number(syntheticAmount), idempotency_key: `web:${signal.id}:${Date.now()}` })}>{isActionPending("approve") ? "Approving…" : "Approve"}</button></div>
                        ))}
                      </>
                    ) : data.user.is_admin ? (
                      <div className="button-row"><button className="small-action" onClick={() => act("/v1/synthetic/actions", { action: "open", market: syntheticMarket, direction: "long", amount: 20 })}>Open $20 long</button><button className="small-action" onClick={() => act("/v1/synthetic/actions", { action: "open", market: syntheticMarket, direction: "short", amount: 20 })}>Open $20 short</button><button className="danger-action" onClick={() => act("/v1/synthetic/actions", { action: "reset" })}>Reset virtual balance</button></div>
                    ) : <p>Testnet is reserved for administrator testing. Switch to mainnet for live synthetic access.</p>}
                    {synthetic.positions?.filter((position) => position.status === "open").map((position) => (
                      <div className="activity-row" key={position.id}><div className="activity-info"><strong>{position.market} · {position.direction}</strong><small>{money(position.margin_usd)} reserved · {position.clearing_type || "PRINCIPAL"} · spread {money(position.spread_charged_usd || 0)} · fee {money(position.tier_fee_usd || 0)}</small></div><button className="small-action" disabled={isActionPending("close")} onClick={() => act(`/v1/synthetic/positions/${position.id}/close`, {})}>{isActionPending("close") ? "Closing…" : "Close"}</button></div>
                    ))}
                  </>
                ) : <p>Loading shared tick feed…</p>}
              </GradientPanel>
            </div>
          )}
          {tab === "Admin" && admin && (
            <LiveAdminScreen
              admin={admin}
              environment={webEnvironment}
              request={request}
              reload={refreshAdmin}
              onEnvironment={switchAdminEnvironment}
              onNotice={setNotice}
            />
          )}
          {tab === "Admin" && !admin && (
            <div className="empty-state">
              <strong>Loading control room…</strong>
            </div>
          )}
          {false && tab === "Admin" && (
            <div className="admin-grid">
              <GradientPanel className="admin-table">
                <span className="eyebrow">ADMINISTRATOR ACCESS</span>
                <h2>Add administrator</h2>
                <p>
                  Use the numeric Telegram ID of a person you trust. Access is
                  recorded and their testnet workspace remains separate.
                </p>
                <input
                  value={adminTarget}
                  onChange={(event) =>
                    setAdminTarget(event.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Telegram user ID"
                  inputMode="numeric"
                />
                <button
                  className="primary-action"
                  onClick={() =>
                    act("/v1/admin/members", { user_id: Number(adminTarget) })
                  }
                >
                  Add administrator
                </button>
              </GradientPanel>
              <GradientPanel className="admin-table">
                <span className="eyebrow">ACCOUNT OPERATIONS</span>
                <h2>Fund or reset a user</h2>
                <input
                  value={adminTarget}
                  onChange={(event) =>
                    setAdminTarget(event.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Telegram user ID"
                  inputMode="numeric"
                />
                <input
                  value={adminAmount}
                  onChange={(event) => setAdminAmount(event.target.value)}
                  placeholder="Credit amount (USD)"
                  inputMode="decimal"
                />
                <input
                  value={adminReason}
                  onChange={(event) => setAdminReason(event.target.value)}
                  placeholder="Funding reason"
                />
                <div className="button-row">
                  <button
                    className="small-action"
                    onClick={() =>
                      act("/v1/admin/fund", {
                        user_id: Number(adminTarget),
                        amount: Number(adminAmount),
                        reason: adminReason,
                      })
                    }
                  >
                    Fund user
                  </button>
                  <button
                    className="danger-action"
                    onClick={() =>
                      act("/v1/admin/onboarding/reset", {
                        user_id: Number(adminTarget),
                      })
                    }
                  >
                    Reset onboarding
                  </button>
                </div>
                <button
                  className="ghost-action"
                  onClick={() =>
                    act("/v1/admin/demo/reissue", {
                      user_id: Number(adminTarget),
                    })
                  }
                >
                  Reissue test demo
                </button>
              </GradientPanel>
              <GradientPanel className="admin-table">
                <span className="eyebrow">WORKSPACE & RULES</span>
                <h2>Admin controls</h2>
                <p>
                  Testnet is only your admin workspace: it never exposes test
                  balances, earnings or actions to regular users.
                </p>
                <div className="button-row">
                  <button
                    className="small-action"
                    onClick={() =>
                      act("/v1/admin/environment", {
                        environment:
                          admin?.environment === "testnet"
                            ? "mainnet"
                            : "testnet",
                      })
                    }
                  >
                    Switch to{" "}
                    {admin?.environment === "testnet" ? "mainnet" : "testnet"}
                  </button>
                  <button
                    className="small-action"
                    onClick={() => act("/v1/admin/demo/reissue", {})}
                  >
                    Reissue my test demo
                  </button>
                </div>
                <select
                  value={settingKey}
                  onChange={(event) => setSettingKey(event.target.value)}
                >
                  <option value="min_bot_investment_usd">Bot minimum</option>
                  <option value="deposit_min_usd">Deposit minimum</option>
                  <option value="withdraw_min_usd">Withdrawal minimum</option>
                  <option value="demo_active_days">Demo duration</option>
                  <option value="demo_conversion_percent">
                    Demo conversion percent
                  </option>
                  <option value="community_url">Community link</option>
                  <option value="popup_ttl_seconds">
                    Popup cleanup seconds
                  </option>
                </select>
                <input
                  value={settingValue}
                  onChange={(event) => setSettingValue(event.target.value)}
                  placeholder="New setting value"
                />
                <button
                  className="primary-action"
                  onClick={() =>
                    act("/v1/admin/settings", {
                      key: settingKey,
                      value: settingValue,
                    })
                  }
                >
                  Save rule
                </button>
              </GradientPanel>
            </div>
          )}
          {false && tab === "Admin" && (
            <div className="admin-grid">
              <GradientPanel className="admin-table">
                <span className="eyebrow">TREASURY QUEUE</span>
                <h2>Verified deposits awaiting action</h2>
                {admin?.sweep_queue?.map((row) => (
                  <div className="admin-row" key={row.id}>
                    <div>
                      <strong>
                        {row.asset} · {row.chain}
                      </strong>
                      <small className="mono">
                        {row.id.slice(0, 8)} · {row.status}
                      </small>
                    </div>
                    <button
                      className="small-action"
                      onClick={() =>
                        act(`/v1/admin/sweeps/${row.id}`, { action: "retry" })
                      }
                    >
                      Retry
                    </button>
                    <button
                      className="small-action"
                      onClick={() =>
                        act(`/v1/admin/sweeps/${row.id}`, { action: "manual" })
                      }
                    >
                      Manual sweep
                    </button>
                    <button
                      className="danger-action"
                      onClick={() =>
                        act(`/v1/admin/sweeps/${row.id}`, {
                          action: "quarantine",
                        })
                      }
                    >
                      Quarantine
                    </button>
                  </div>
                ))}
              </GradientPanel>
              <GradientPanel className="admin-table">
                <span className="eyebrow">APPROVED VAULTS</span>
                <h2>Signer destinations</h2>
                <p>
                  Only set an approved destination after verifying the full
                  address outside this screen. Never enter a seed phrase or
                  private key.
                </p>
                <div className="alert-fields">
                  <select
                    value={vaultChain}
                    onChange={(event) => setVaultChain(event.target.value)}
                  >
                    <option value="ERC20">Ethereum</option>
                    <option value="BEP20">BNB Chain</option>
                    <option value="BASE">Base</option>
                    <option value="ARBITRUM">Arbitrum</option>
                    <option value="POLYGON">Polygon</option>
                  </select>
                  <select
                    value={vaultAsset}
                    onChange={(event) => setVaultAsset(event.target.value)}
                  >
                    <option>USDT</option>
                    <option>USDC</option>
                  </select>
                </div>
                <input
                  value={vaultAddress}
                  onChange={(event) => setVaultAddress(event.target.value)}
                  placeholder="Approved vault address"
                />
                <button
                  className="primary-action"
                  onClick={() =>
                    act("/v1/admin/vaults", {
                      chain: vaultChain,
                      asset: vaultAsset,
                      address: vaultAddress,
                    })
                  }
                >
                  Save approved vault
                </button>
              </GradientPanel>
              <GradientPanel className="admin-table">
                <span className="eyebrow">BROADCAST CENTER</span>
                <h2>Preview before delivery</h2>
                <select
                  value={broadcastScope}
                  onChange={(event) => setBroadcastScope(event.target.value)}
                >
                  <option value="user">One user</option>
                  <option value="channel">Channel</option>
                  <option value="group">Group</option>
                  <option value="all">All users</option>
                </select>
                {broadcastScope !== "all" && (
                  <input
                    value={adminTarget}
                    onChange={(event) => setAdminTarget(event.target.value)}
                    placeholder="User ID, @channel, or group ID"
                  />
                )}
                <textarea
                  value={broadcastText}
                  onChange={(event) => setBroadcastText(event.target.value)}
                  placeholder="Message to send"
                />
                {broadcastScope === "all" && (
                  <input
                    value={broadcastConfirm}
                    onChange={(event) =>
                      setBroadcastConfirm(event.target.value)
                    }
                    placeholder="Type SEND ALL after reviewing"
                  />
                )}
                <button
                  className="primary-action"
                  onClick={() =>
                    act("/v1/admin/broadcast", {
                      scope: broadcastScope,
                      target: adminTarget,
                      message: broadcastText,
                      confirmation: broadcastConfirm,
                    })
                  }
                >
                  Send broadcast
                </button>
              </GradientPanel>
            </div>
          )}
          {false && tab === "Admin" && (
            <div className="admin-grid">
              <GradientPanel className="admin-table">
                <span className="eyebrow">ADMIN MEMBERS</span>
                <h2>Current access</h2>
                {admin?.members.map((member) => (
                  <div className="admin-row" key={member.user_id}>
                    <strong>{member.first_name || "Telegram user"}</strong>
                    <small className="mono">
                      {member.username ? `@${member.username}` : member.user_id}
                    </small>
                  </div>
                ))}
              </GradientPanel>
              <GradientPanel className="admin-table">
                <span className="eyebrow">ENGINE LEDGER</span>
                <h2>Recent settlements</h2>
                {admin?.engine.map((row) => (
                  <div className="admin-row" key={row.event_key}>
                    <div>
                      <strong>{row.bot_name}</strong>
                      <small>{row.status}</small>
                    </div>
                    <code>{money(row.net_realized)}</code>
                  </div>
                ))}
              </GradientPanel>
              <GradientPanel className="admin-table">
                <span className="eyebrow">ACTIVE SETTINGS</span>
                <h2>Runtime values</h2>
                {admin?.settings.map((setting) => (
                  <div className="admin-row" key={setting.key}>
                    <strong>{setting.key}</strong>
                    <small className="mono">{setting.value}</small>
                  </div>
                ))}
              </GradientPanel>
            </div>
          )}
          {false && tab === "Admin" && (
            <div className="admin-screen">
              {admin ? (
                <>
      <GradientPanel className="admin-hero">
                    <div>
                      <span className="eyebrow">ADMIN CONTROL ROOM</span>
                      <h2>{admin.environment.toUpperCase()} operations</h2>
                      <p className="mono">
                        SWEEPS · {admin.sweeps_enabled ? "ENABLED" : "DISABLED"}
                      </p>
                    </div>
                    <button
                      className="small-action"
                      onClick={async () => {
                        await act("/v1/admin/sweeps/toggle", {});
                        setAdmin(await request("/v1/admin/overview"));
                      }}
                    >
                      Toggle sweeps
                    </button>
      </GradientPanel>
      <GradientPanel className="admin-table">
        <span className="eyebrow">FUNDED MEMECOIN BOT BETA</span>
        <h2>Settlement capacity and controls</h2>
        <p className="mono">
          CAPACITY {money(Number(memecoinMetrics.capacity_usd || 0))} / RESERVED {money(Number(memecoinMetrics.reserved_capacity_usd || 0))} / REMAINING {money(Number(memecoinMetrics.remaining_capacity_usd || 0))}
        </p>
        <p className="mono">
          USER P&amp;L {money(Number(memecoinMetrics.gross_user_pnl_usd || 0))} / FEES {money(Number(memecoinMetrics.fee_income_usd || 0))} / HOUSE {money(Number(memecoinMetrics.net_house_result_usd || 0))}
        </p>
        <div className="segment-control">
          <button className={memecoinConfig.memecoin_beta_enabled === "true" ? "active" : ""} onClick={() => saveMemecoinConfig({ memecoin_beta_enabled: memecoinConfig.memecoin_beta_enabled === "true" ? "false" : "true" })}>{memecoinConfig.memecoin_beta_enabled === "true" ? "Beta enabled" : "Beta disabled"}</button>
          <button className={memecoinConfig.memecoin_global_pause === "true" ? "active" : ""} onClick={() => saveMemecoinConfig({ memecoin_global_pause: memecoinConfig.memecoin_global_pause === "true" ? "false" : "true" })}>{memecoinConfig.memecoin_global_pause === "true" ? "Resume entries" : "Pause entries"}</button>
          <button className={memecoinConfig.memecoin_close_only === "true" ? "active" : ""} onClick={() => saveMemecoinConfig({ memecoin_close_only: memecoinConfig.memecoin_close_only === "true" ? "false" : "true" })}>{memecoinConfig.memecoin_close_only === "true" ? "Exit close-only" : "Close-only"}</button>
        </div>
        <div className="amount-input">
          <span>$</span>
          <input value={memecoinConfig.memecoin_principal_capacity_usd || "1000000"} onChange={(event) => setMemecoinConfig((current) => ({ ...current, memecoin_principal_capacity_usd: event.target.value.replace(/[^0-9.]/g, "") }))} inputMode="decimal" aria-label="Memecoin settlement capacity" />
        </div>
        <button className="small-action" onClick={() => saveMemecoinConfig({ memecoin_principal_capacity_usd: memecoinConfig.memecoin_principal_capacity_usd || "1000000" })}>Save capacity</button>
      </GradientPanel>
      <div className="admin-grid">
                    <GradientPanel className="admin-table">
                      <span className="eyebrow">WITHDRAWAL APPROVALS</span>
                      <h2>Pending review</h2>
                      {admin.withdrawals.map((row) => (
                        <div className="admin-row" key={row.id}>
                          <div>
                            <strong>
                              {money(row.amount_usd)} {row.asset} · {row.chain}
                            </strong>
                            <small className="mono">
                              USER {row.user_id} · {row.status}
                            </small>
                          </div>
                          <button
                            className="danger-action"
                            onClick={async () => {
                              await act(`/v1/admin/withdrawals/${row.id}`, {
                                action: "approve",
                              });
                              setAdmin(await request("/v1/admin/overview"));
                            }}
                          >
                            Approve
                          </button>
                          <button
                            className="small-action"
                            onClick={async () => {
                              await act(`/v1/admin/withdrawals/${row.id}`, {
                                action: "reject",
                              });
                              setAdmin(await request("/v1/admin/overview"));
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      ))}
                    </GradientPanel>
                    <GradientPanel className="admin-table">
                      <span className="eyebrow">RECOVERY CASES</span>
                      <h2>Manual recovery</h2>
                      {admin.recovery_cases.map((row) => (
                        <div className="admin-row" key={row.id}>
                          <div>
                            <strong>
                              RC-{row.id} · {row.asset} / {row.network}
                            </strong>
                            <small className="mono">
                              USER {row.user_id} · {row.status}
                            </small>
                          </div>
                          <button
                            className="small-action"
                            onClick={async () => {
                              await act(`/v1/admin/recovery/${row.id}`, {
                                status: "verified",
                              });
                              setAdmin(await request("/v1/admin/overview"));
                            }}
                          >
                            Verify
                          </button>
                          <button
                            className="danger-action"
                            onClick={async () => {
                              await act(`/v1/admin/recovery/${row.id}`, {
                                status: "rejected",
                              });
                              setAdmin(await request("/v1/admin/overview"));
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      ))}
                    </GradientPanel>
                    <GradientPanel className="admin-table">
                      <span className="eyebrow">CHAIN MAINTENANCE</span>
                      <h2>Route health</h2>
                      {admin.chains.map((chain) => (
                        <div className="admin-row" key={chain.id}>
                          <strong>{chain.name}</strong>
                          <span
                            className={`status-chip ${chain.watcher_ready ? "running" : "paused"}`}
                          >
                            {chain.watcher_ready
                              ? "watcher ready"
                              : "maintenance"}
                          </span>
                        </div>
                      ))}
                    </GradientPanel>
                  </div>
                </>
              ) : (
                <p>Loading admin controls…</p>
              )}
            </div>
          )}
        </div>
      </main>
      <BottomNav
        active={chromeActive}
        setActive={selectChromeTab}
        isAdmin={data.user.is_admin}
      />
    </div>
  );
}

function OriginalDeskShell() {
  const [active, setActive] = useState("Dashboard");
  const [fleet, setFleet] = useState(bots);
  const [securityCode, setSecurityCode] = useState("");

  const toggleBot = (name: string) => {
    setFleet((current) =>
      current.map((bot) =>
        bot.name === name
          ? { ...bot, state: bot.state === "running" ? "paused" : "running" }
          : bot,
      ),
    );
  };

  const content =
    active === "Dashboard" ? (
      <Dashboard bots={fleet} />
    ) : active === "Bots" ? (
      <BotsScreen bots={fleet} onToggle={toggleBot} />
    ) : active === "Wallet" ? (
      <WalletScreen
        securityCode={securityCode}
        onSetCode={() => setActive("Account")}
      />
    ) : active === "Earn" ? (
      <EarnScreen />
    ) : active === "Account" ? (
      <AccountScreen
        securityCode={securityCode}
        onStoredCodeChange={setSecurityCode}
      />
    ) : active === "Live Desk" ? (
      <LiveDeskFinal />
    ) : active === "Admin" ? (
      <AdminControlRoomFinal />
    ) : (
      <GradientPanel className="announcements">
        <span className="eyebrow">COMMUNITY & HELP</span>
        <h2>TradePulse support</h2>
        <p>
          Use the Telegram bot for account-specific help and support requests.
        </p>
      </GradientPanel>
    );

  return (
    <div className="app-shell">
      <Sidebar active={active} setActive={setActive} />
      <main className="main-content">
        <Header setActive={setActive} />
        <div className="content-wrap">{content}</div>
      </main>
      <BottomNav active={active} setActive={setActive} />
    </div>
  );
}

/**
 * The original shell above is retained as the visual reference for the v0
 * composition.  The application entry must use the live desk: unlike the
 * reference shell it never renders sample users, balances, bots, deposits or
 * withdrawals and routes every action through the shared TradePulse API.
 */
export default function TradePulseShell() {
  return <LiveTradePulse />;
}
