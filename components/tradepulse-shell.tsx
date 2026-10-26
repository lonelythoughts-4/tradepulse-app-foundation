"use client";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AccessibleDialog } from "./accessible-dialog";
import { NoticeCenter, useNoticeCenter } from "./notice-center";
import { createDeskStore, useDeskSelector, type DeskStore } from "../lib/desk-store";
import type { DeskState } from "../lib/desk-types";
import { DashboardWorkspace } from "./workspaces/dashboard-workspace";
import { SyntheticWorkspace } from "./workspaces/synthetic-workspace";
import { WalletWorkspace } from "./workspaces/wallet-workspace";
import { BotsWorkspace } from "./workspaces/bots-workspace";
import { DeskWorkspace } from "./workspaces/desk-workspace";
import { AccountWorkspace } from "./workspaces/account-workspace";
import { HelpWorkspace } from "./workspaces/help-workspace";
import { AdminWorkspace } from "./workspaces/admin-workspace";
import { getWorkspacePresencePlan } from "./workspaces/workspace-motion";
import { makeSyntheticCandles, reconcileSyntheticTicks, type SyntheticCandle, type SyntheticTick } from "../lib/synthetic-ticks";
import { formatMarketChartTime } from "../lib/market-chart-time";
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
export const ChevronRight = (props: FunctionalIconProps) => (
  <FunctionalIcon name="chevronRight" {...props} />
);
const Copy = (props: FunctionalIconProps) => (
  <FunctionalIcon name="copy" {...props} />
);
export const Download = (props: FunctionalIconProps) => (
  <FunctionalIcon name="download" {...props} />
);
const Fuel = (props: FunctionalIconProps) => (
  <FunctionalIcon name="fuel" {...props} />
);
export const History = (props: FunctionalIconProps) => (
  <FunctionalIcon name="history" {...props} />
);
const Plus = (props: FunctionalIconProps) => (
  <FunctionalIcon name="plus" {...props} />
);
export const Send = (props: FunctionalIconProps) => (
  <FunctionalIcon name="send" {...props} />
);
export const ShieldCheck = (props: FunctionalIconProps) => (
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
export function PaymentMark({ asset, compact = false }: { asset: string; compact?: boolean }) {
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
        display: compact ? "inline-grid" : "grid",
        verticalAlign: "middle",
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
export function StateIcon({
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
export function StateSwapIcon({
  name,
  swapKey = name,
  size = 18,
  className = "",
}: FunctionalIconProps & { name: PublicIconName; swapKey?: string }) {
  const reduceMotion = useReducedMotion();
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
          initial={{ opacity: reduceMotion ? 1 : 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: reduceMotion ? 1 : 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.15 }}
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
export const Zap = (props: FunctionalIconProps) => <NavIcon name="desk" {...props} />;
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

export function GradientPanel({
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
  const reduceMotion = useReducedMotion();
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
      transition={{ duration: reduceMotion ? 0 : 0.65, ease }}
    >
      <div className="boot-mark">
        <PulseMark size={76} />
      </div>
      <div className="boot-line" />
      <div className="boot-copy">
        <strong>
          TRADE<span>PULSE</span>
        </strong>
        <div className="boot-status" role="status" aria-live="polite">
          <span className="status-dot" />
          {steps[step]}
        </div>
      </div>
    </motion.div>
  );
}

type AvatarId = "orbit" | "signal" | "prism" | "current" | "vector" | "tide";

const avatarOptions: Array<{ id: AvatarId; name: string; detail: string; utility: string; artifact: string }> = [
  { id: "orbit", name: "Orbit", detail: "capital keeps its horizon", utility: "Wallet quick route", artifact: "Orbital receipt seal" },
  { id: "signal", name: "Signal", detail: "read the pulse, hold the line", utility: "Live Desk quick route", artifact: "Signal-call stamp" },
  { id: "prism", name: "Prism", detail: "separate motion from noise", utility: "Activity quick route", artifact: "Prismatic field note" },
  { id: "current", name: "Current", detail: "move when the signal settles", utility: "Alerts quick route", artifact: "Current-flow mark" },
  { id: "vector", name: "Vector", detail: "make the next move legible", utility: "Bots quick route", artifact: "Vector dispatch tag" },
  { id: "tide", name: "Tide", detail: "keep a measured rhythm", utility: "Account quick route", artifact: "Tide-line token" },
];

function PulseAvatar({
  id,
  initials,
  className = "",
}: {
  id: AvatarId;
  initials?: string;
  className?: string;
}) {
  return (
    <span className={`pulse-avatar avatar-${id} ${className}`} aria-hidden="true">
      <img src={`/identity-assets/${id}-figure.svg`} alt="" />
      <i />
      <b>{initials?.slice(0, 1) || "T"}</b>
    </span>
  );
}

function AvatarPicker({
  selected,
  onSelect,
  onConfirm,
  onClose,
  required = false,
  locked = false,
  current,
  fee = 10,
  available = 0,
  pending = false,
}: {
  selected: AvatarId;
  onSelect: (id: AvatarId) => void;
  onConfirm: (id: AvatarId) => void;
  onClose: () => void;
  required?: boolean;
  locked?: boolean;
  current?: AvatarId;
  fee?: number;
  available?: number;
  pending?: boolean;
}) {
  return (
    <AccessibleDialog
      label="Choose your TradePulse desk identity"
      onClose={onClose}
      dismissible={!required && !pending}
    >
      <div className="avatar-picker-dialog">
        {!required && (
            <button className="modal-close" type="button" disabled={pending} onClick={onClose} aria-label="Close identity picker">
            <X size={16} />
          </button>
        )}
        <span className="eyebrow">YOUR DESK IDENTITY</span>
        <h2>{locked ? "Change your identity" : "Choose your signal"}</h2>
        <p>{locked ? `Your next identity change costs $${fee.toFixed(2)} from your available mainnet wallet.` : "Your first identity is free. It becomes your desk signal once confirmed."}</p>
        <div className="avatar-picker-grid" role="list">
          {avatarOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`avatar-choice ${selected === option.id ? "selected" : ""}`}
              aria-pressed={selected === option.id}
              disabled={pending}
              onClick={() => onSelect(option.id)}
            >
              <PulseAvatar id={option.id} />
              <span><strong>{option.name}</strong><small>{option.detail}</small><em>{option.utility}</em></span>
              {selected === option.id && <StateIcon name="check" />}
            </button>
          ))}
        </div>
        <div className="identity-seal" aria-live="polite"><span>SEALED COSMETIC REVEAL</span><strong>{locked ? `Next artifact: ${avatarOptions.find((option) => option.id === selected)?.artifact}` : "Your identity artifact reveals after confirmation"}</strong></div>
        {locked && <p className="identity-fee-note">{selected === current ? "This is your current identity. No charge applies." : `Available now $${available.toFixed(2)} · after change $${(Math.max(0, available - fee)).toFixed(2)}`}</p>}
        <button className="primary-action" type="button" disabled={pending || (locked && selected !== current && available < fee)} aria-busy={pending} onClick={() => onConfirm(selected)}>
          {pending ? "Saving identity…" : locked ? (selected === current ? `Keep ${avatarOptions.find((option) => option.id === selected)?.name || "identity"}` : `Pay $${fee.toFixed(2)} & use ${avatarOptions.find((option) => option.id === selected)?.name || "identity"}`) : `Seal ${avatarOptions.find((option) => option.id === selected)?.name || "identity"}`}
          <ChevronRight />
        </button>
      </div>
    </AccessibleDialog>
  );
}

function Sidebar({
  active,
  setActive,
  profileName = "Jordan Davis",
  profileTier = "Pro account",
  isAdmin = true,
  avatarId = "orbit",
}: {
  active: string;
  setActive: (value: string) => void;
  profileName?: string;
  profileTier?: string;
  isAdmin?: boolean;
  avatarId?: AvatarId;
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
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`} aria-label="Workspace navigation">
      <button
        className="sidebar-collapse"
        type="button"
        aria-label={collapsed ? "Expand sidebar" : "Minimize sidebar"}
        aria-expanded={!collapsed}
        aria-controls="workspace-sidebar-navigation"
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
      <nav id="workspace-sidebar-navigation" className="side-nav" aria-label="Workspace">
        {navItems.map(({ label, icon }) => (
          <button
            key={label}
            type="button"
            className={`nav-item ${active === label ? "active" : ""}`}
            aria-label={label}
            title={collapsed ? label : undefined}
            aria-current={active === label ? "page" : undefined}
            onClick={() => setActive(label)}
          >
            <NavIcon name={icon} />
            <span>{label}</span>
          </button>
        ))}
        <button
          type="button"
          className={`nav-item ${active === "Live Desk" ? "active" : ""}`}
          aria-label="Live Desk"
          title={collapsed ? "Live Desk" : undefined}
          aria-current={active === "Live Desk" ? "page" : undefined}
          onClick={() => setActive("Live Desk")}
        >
          <NavIcon name="desk" />
          <span>Live Desk</span>
        </button>
        {isAdmin && (
          <button
            type="button"
            className={`nav-item ${active === "Admin" ? "active" : ""}`}
            aria-label="Control room"
            title={collapsed ? "Control room" : undefined}
            aria-current={active === "Admin" ? "page" : undefined}
            onClick={() => setActive("Admin")}
          >
            <NavIcon name="admin" />
            <span>Control room</span>
          </button>
        )}
      </nav>
      <div className="sidebar-bottom">
        <button
          type="button"
          className={`nav-item ${active === "Help" ? "active" : ""}`}
          aria-label="Help center"
          title={collapsed ? "Help center" : undefined}
          aria-current={active === "Help" ? "page" : undefined}
          onClick={() => setActive("Help")}
        >
          <NavIcon name="help" />
          <span>Help center</span>
        </button>
        <button
          type="button"
          className="profile profile-button"
          onClick={() => setActive("Account")}
          aria-label="Open account controls"
        >
          <PulseAvatar id={avatarId} initials={initials} className="avatar" />
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
const mobilePrimaryNavItems: { label: string; icon: NavIconName }[] = [
  { label: "Dashboard", icon: "dashboard" },
  { label: "Bots", icon: "bots" },
  { label: "Synthetic", icon: "desk" },
  { label: "Wallet", icon: "wallet" },
  { label: "Account", icon: "account" },
];
const mobileSecondaryNavItems: { label: string; icon: NavIconName }[] = [
  { label: "Earn", icon: "earn" },
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
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButton = useRef<HTMLButtonElement>(null);
  const moreMenu = useRef<HTMLDivElement>(null);
  const moreMenuId = useId();
  useEffect(() => {
    if (!moreOpen) return;
    moreMenu.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const dismissOutside = (event: PointerEvent | FocusEvent) => {
      if (event.target instanceof Node && !moreMenu.current?.contains(event.target) && !moreButton.current?.contains(event.target)) {
        setMoreOpen(false);
      }
    };
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setMoreOpen(false);
      moreButton.current?.focus();
    };
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("focusin", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("focusin", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [moreOpen]);
  useEffect(() => setMoreOpen(false), [active]);
  const secondaryItems = mobileSecondaryNavItems.filter(
    (item) => item.label !== "Admin" || isAdmin,
  );
  const secondaryActive = secondaryItems.some((item) => item.label === active);
  return (
    <nav
      className="bottom-nav"
      aria-label="Primary navigation"
    >
      {mobilePrimaryNavItems
        .map(({ label, icon }) => (
        <button
          key={label}
          type="button"
          className={`bottom-item ${active === label ? "active" : ""}`}
          aria-current={active === label ? "page" : undefined}
          onClick={() => {
            setMoreOpen(false);
            setActive(label);
          }}
        >
          <span className="bottom-icon">
            {active === label && <i />}
            <NavIcon name={icon} />
          </span>
          <span className="bottom-label">{label}</span>
        </button>
        ))}
      <button
        ref={moreButton}
        type="button"
        className={`bottom-item bottom-more ${secondaryActive ? "active" : ""}`}
        aria-expanded={moreOpen}
        aria-controls={moreMenuId}
        aria-label={secondaryActive ? `More navigation, current page: ${active}` : "More navigation"}
        onClick={() => setMoreOpen((value) => !value)}
      >
        <span className="bottom-icon">
          {(secondaryActive || moreOpen) && <i />}
          <NavIcon name="more" />
        </span>
        <span className="bottom-label">More</span>
      </button>
      {moreOpen && (
        <div ref={moreMenu} id={moreMenuId} className="mobile-more-menu">
          {secondaryItems.map(({ label, icon }) => (
            <button
              key={label}
              type="button"
              className={active === label ? "active" : ""}
              aria-current={active === label ? "page" : undefined}
              onClick={() => {
                setActive(label);
                setMoreOpen(false);
                moreButton.current?.focus();
              }}
            >
              <NavIcon name={icon} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

function Header({
  setActive,
  onNotifications,
  avatarId = "orbit",
  onAvatarClick,
  profileName = "Jordan",
  environment = "LIVE",
  isAdmin = true,
  pageTitle = "Dashboard",
  notificationCount = 0,
}: {
  setActive: (view: string) => void;
  onNotifications?: () => void;
  avatarId?: AvatarId;
  onAvatarClick?: () => void;
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
        <span className="eyebrow">WORKSPACE / {pageTitle.toUpperCase()}</span>
        <h1>{pageTitle}</h1>
      </div>
      <div className="welcome">
        <span className="eyebrow">SIGNED IN AS</span>
        <strong>{profileName}</strong>
      </div>
      <div className="top-actions">
        <div className="live-indicator">
          {String(environment).toLowerCase() === "mainnet" ? "Mainnet" : "Testnet"}
        </div>
        {isAdmin && pageTitle !== "Admin" && (
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
          onClick={() => (onAvatarClick ? onAvatarClick() : setActive("Account"))}
        >
          <PulseAvatar id={avatarId} initials={initials} />
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
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (reduceMotion) {
      setCurrent(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 900, 1);
      setCurrent(value * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduceMotion]);
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
  ledger: Array<{
    id?: number;
    kind: string;
    asset: string;
    amount_usd: number;
    status: string;
    created_at: number;
    trade_detail?: {
      bot_name: string;
      net_realized: number;
      exchange_fees: number;
      slippage: number;
      fee_usd: number;
      settled_at: number;
      position?: {
        symbol?: string;
        direction?: string;
        entry_price?: number;
        exit_price?: number;
        realized_pnl?: number;
        close_reason?: string;
        closed_at?: number;
      };
    };
  }>;
  demo: {
    state?: string;
    grant_usd?: number;
    expires_at?: number;
    profit_snapshot_usd?: number;
    gift_credit_usd?: number;
    converted_at?: number;
    pool_state?: string;
    pool_available_usd?: number;
    pool_locked_usd?: number;
    pool_realised_pnl_usd?: number;
    credit_available_usd?: number;
    credit_locked_usd?: number;
    credit_active?: boolean;
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
  id?: string | number;
  name: string;
  allocation: string;
  equity: string;
  percent: number;
  gain: string;
  state: BotState;
  compound: string;
  truth?: {
    status: string;
    source: string;
  };
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
  const factual = bot.truth;
  const factualTone = factual?.status === "running" || factual?.status === "demo active" ? "running" : "paused";
  const paused = factual ? factualTone === "paused" : bot.state === "paused";
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
      {paused && (
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
        {!factual && <BotRing percent={bot.percent} state={bot.state} />}
        <div className="bot-copy">
          <div className="bot-title">
            <strong>{bot.name}</strong>
            <span className={`status-chip ${factual ? factualTone : bot.state}`}>
              <i />
              {factual?.status || bot.state}
            </span>
          </div>
          <span className="bot-allocation">
            {factual ? `${factual.source} · ${bot.allocation}` : `Allocation ${bot.allocation}`}
          </span>
          {!factual && (
            <div className="bot-equity">
              <strong>{bot.equity}</strong>
              <span className={bot.state === "paused" ? "down" : "up"}>
                {bot.gain}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="bot-card-bottom">
        {!factual && <MiniSparkline negative={bot.state === "paused"} />}
        {bot.compound && <span className="compound-chip">{factual ? bot.compound : `COMPOUND ${bot.compound}`}</span>}
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
function Activity({
  ledger,
  onViewAll,
}: {
  ledger?: VisualDeskModel["ledger"];
  onViewAll?: () => void;
}) {
  const [selectedEntry, setSelectedEntry] = useState<VisualDeskModel["ledger"][number] | null>(null);
  type ActivityItem = {
    key: string;
    title: string;
    sub: string;
    amount: number | null;
    time: string;
    status: string;
    entry?: VisualDeskModel["ledger"][number];
  };
  const items: ActivityItem[] = ledger
    ? ledger.length
      ? ledger
          .slice(0, 3)
          .map((entry) => {
            const amount = signedActivityAmount(entry.kind, entry.status, entry.amount_usd);
            const balanceChanged = !isNonFinancialActivity(entry.kind);
            return {
              key: String(entry.id ?? `${entry.kind}-${entry.created_at}`),
              title: activityLabel(entry.kind, entry.status, amount),
              sub: activitySummary(entry),
              amount: balanceChanged ? amount : null,
              time: entry.trade_detail ? "View breakdown" : "View details",
              status: activityTone(entry.kind, entry.status, amount),
              entry,
            };
          })
      : [
          { key: "empty", title: "No activity yet", sub: "Verified account events will appear here.", amount: 0, time: "—", status: "complete" },
        ]
    : [
        { key: "memecoin", title: "Memecoin bot", sub: "Equity rebalance", amount: 84.2, time: "2m", status: "complete" },
        { key: "synthetic", title: "Synthetic bot", sub: "Risk threshold reached", amount: -42.8, time: "18m", status: "review" },
        { key: "deposit", title: "Deposit received", sub: "USDC · Wallet", amount: 1250, time: "1h", status: "complete" },
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
        {items.map((item) => (
          <button className="activity-row activity-detail-trigger" type="button" key={item.key} disabled={!item.entry} onClick={() => item.entry && setSelectedEntry(item.entry)}>
            <div className="activity-info">
              <strong>{item.title}</strong>
              <small>{item.sub}</small>
            </div>
            <span className={`activity-status ${item.status}`}>{item.status}</span>
            <div className="activity-amount">
              <strong className={item.amount === null ? undefined : activityAmountTone(item.amount)}>
                {item.amount === null ? "—" : activityAmountDisplay(item.amount)}
              </strong>
              <small>{item.time}</small>
            </div>
          </button>
        ))}
      </div>
      {selectedEntry && <ActivityDetailDialog entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}
    </GradientPanel>
  );
}

function activityExitLabel(reason?: string) {
  return reason ? reason.replaceAll("_", " ") : "Recorded settlement";
}

function activityMarketLabel(symbol?: string) {
  if (!symbol) return "";
  return symbol.length > 20 ? `${symbol.slice(0, 8)}…${symbol.slice(-4)}` : symbol;
}

export function isNonFinancialActivity(kind: string) {
  return /authorization|strategy_(?:control|setting)|settings?_saved|flashback_allocation/i.test(kind);
}

export function isFlashbackEntryLock(kind: string) {
  return kind === "flashback_allocation";
}

function activitySummary(entry: VisualDeskModel["ledger"][number]) {
  if (isFlashbackEntryLock(entry.kind)) return "Entry locked until the sealed result is revealed";
  if (isNonFinancialActivity(entry.kind)) return "Strategy controls saved · no balance change";
  const position = entry.trade_detail?.position;
  if (position?.symbol) {
    const direction = position.direction ? ` · ${position.direction.toUpperCase()}` : "";
    return `${activityMarketLabel(position.symbol)}${direction} · ${activityExitLabel(position.close_reason)}`;
  }
  if (entry.trade_detail?.bot_name) return `${entry.trade_detail.bot_name} · settled`;
  return entry.asset && entry.asset !== "USD" ? entry.asset : "Recorded account activity";
}

function ActivityDetailDialog({ entry, onClose }: { entry: VisualDeskModel["ledger"][number]; onClose: () => void }) {
  const amount = signedActivityAmount(entry.kind, entry.status, entry.amount_usd);
  const detail = entry.trade_detail;
  const position = detail?.position;
  const isFee = entry.kind === "performance_fee";
  const isNonFinancial = isNonFinancialActivity(entry.kind);
  const isFlashbackLock = isFlashbackEntryLock(entry.kind);
  return <AccessibleDialog className="account-modal" label="Activity details" onClose={onClose}>
    <button className="modal-close" type="button" onClick={onClose} aria-label="Close activity details"><X size={16} /></button>
    <span className="eyebrow">ACTIVITY DETAILS</span>
    <h2>{activityLabel(entry.kind, entry.status, amount)}</h2>
    <p>{isFlashbackLock ? "Your Flashback entry is locked until the sealed result is revealed." : isNonFinancial ? "Your Memecoin strategy controls were saved. This event did not move money or open a position." : isFee ? "This fee was recorded after a profitable settlement." : "This is the recorded result for a completed settlement."}</p>
    <div className="fact-block">
      <span>{isFlashbackLock ? "ENTRY LOCKED" : isNonFinancial ? "BALANCE CHANGE" : "RESULT"} <b className={isNonFinancial ? undefined : activityAmountTone(amount)}>{isFlashbackLock ? money(entry.amount_usd) : isNonFinancial ? "No balance change" : activityAmountDisplay(amount)}</b></span>
      <span>STATUS <b>{entry.status.replaceAll("_", " ")}</b></span>
      <span>SETTLED <b>{new Date((detail?.settled_at || entry.created_at) * 1000).toLocaleString()}</b></span>
      {detail && <span>BOT <b>{detail.bot_name}</b></span>}
      {position?.symbol && <span>MARKET <b>{position.symbol}{position.direction ? ` · ${position.direction.toUpperCase()}` : ""}</b></span>}
      {position?.entry_price !== undefined && <span>ENTRY <b>{formatMarketPrice(Number(position.entry_price))}</b></span>}
      {position?.exit_price !== undefined && <span>EXIT <b>{formatMarketPrice(Number(position.exit_price))}</b></span>}
      {position?.close_reason && <span>EXIT TYPE <b>{activityExitLabel(position.close_reason)}</b></span>}
      {detail && !isFee && <span>TRADING COSTS <b>{money(detail.exchange_fees + detail.slippage)}</b></span>}
      {detail && isFee && <span>RELATED NET RESULT <b className={detail.net_realized >= 0 ? "up" : "down"}>{detail.net_realized >= 0 ? "+" : ""}{money(detail.net_realized)}</b></span>}
    </div>
    {!position && !isNonFinancial && <p>This settlement record does not include a market-level execution record.</p>}
    <button className="ghost-action" type="button" onClick={onClose}>Close</button>
  </AccessibleDialog>;
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
  const active = (demo?.pool_state || demo?.state) === "active";
  const grant = Number(demo?.grant_usd || 0);
  const grantLabel = grant > 0 ? money(grant) : "shared";
  const available = Number(demo?.pool_available_usd || 0);
  const locked = Number(demo?.pool_locked_usd || 0);
  const realised = Number(demo?.pool_realised_pnl_usd || 0);
  const activeEndsAt = Number(demo?.expires_at || 0);
  // A zero authoritative balance means the credit was spent or is locked in
  // an open position.  Only older payloads without the new field may fall
  // back to the historical issued amount.
  const tradingCredit = demo?.credit_available_usd === undefined
    ? Number(demo?.gift_credit_usd || 0)
    : Number(demo.credit_available_usd || 0);
  // An unstarted virtual offer should never obscure a funded desk. Once it is
  // active, show its actual status instead of repeating the launch invitation.
  if (!demo || (!active && demo.state !== "issued" && tradingCredit <= 0)) return null;
  if (demo.state === "issued" && hasFundedDesk) return null;
  return (
    <GradientPanel className="demo-banner reveal-card">
      <div>
        <span className="eyebrow">
          {tradingCredit > 0
            ? "DEMO TRADING CREDIT"
            : active
              ? "SHARED VIRTUAL DEMO ACTIVE"
              : "SHARED VIRTUAL DEMO"}
        </span>
        <h2>
          {tradingCredit > 0
            ? `${money(tradingCredit)} trading credit available`
            : active
              ? "Your virtual demo is active"
              : `Start a ${grantLabel} virtual demo`}
        </h2>
        <p>
          {tradingCredit > 0
            ? "Non-withdrawable trading credit for eligible Memecoin and Synthetic orders. It is not cash or wallet balance."
            : active
              ? `Virtual funds: ${money(available)} available · ${money(locked)} locked. Realized demo profit: ${money(realised)}.${activeEndsAt ? ` Ends ${new Date(activeEndsAt * 1000).toLocaleString()}.` : ""}`
              : "One shared virtual pool can be assigned across supported Memecoin and Synthetic activity. It is separate from your wallet."}
        </p>
      </div>
      <img
        src={active || tradingCredit > 0 ? "/illustrations/demo-hourglass.png" : "/illustrations/demo-banner.png"}
        alt={active || tradingCredit > 0 ? "Virtual demo status" : "Paper money plane flying toward a virtual demo"}
        className="illustration-demo-banner pointer-events-none select-none"
        draggable={false}
        decoding="async"
        loading="eager"
      />
      {!active && tradingCredit <= 0 && (
        <button aria-label="Review virtual demo terms" onClick={onStart}>
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
      <p>No bots are running yet.</p>
      <button className="empty-bots-action" onClick={onLaunch}>
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
export function StepRail({ current }: { current: number }) {
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
function WalletLedgerNote() {
  return (
    <GradientPanel className="wallet-ledger-note">
      <History size={17} />
      <div>
        <strong>Wallet activity ledger</strong>
        <p>Processed deposits, allocations, and withdrawals appear in Activity.</p>
      </div>
    </GradientPanel>
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
      <WalletLedgerNote />
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
          This demo uses <strong>$2,000.00 shared virtual funds</strong>. They are not
          real money, cannot be withdrawn, and never touch your wallet.
        </p>
        <div className="virtual-label">VIRTUAL / NON-WITHDRAWABLE</div>
        <button className="primary-action">
          Activate shared demo <ChevronRight />
        </button>
      </GradientPanel>
      <GradientPanel className="demo-activation">
        <div>
          <span className="eyebrow">DEMO ACTIVE</span>
          <h2>$2,000.00 shared virtual pool</h2>
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
              <small>Assign the pool across Memecoin and Synthetic; unused value expires with the demo.</small>
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
        Explore the $2,000 shared virtual demo <ChevronRight />
      </button>
    </div>
  );
}

export function Dashboard({
  bots,
  model,
  onManage,
  onStartDemo,
  onViewActivity,
  onOpenBot,
}: {
  bots: Bot[];
  model?: VisualDeskModel;
  onManage?: () => void;
  onStartDemo?: () => void;
  onViewActivity?: () => void;
  onOpenBot?: (bot: Bot) => void;
}) {
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

type LanguageCode = "en" | "ru" | "hi" | "es" | "it" | "zh" | "ja" | "ro";

const activationLanguages: Array<{ code: LanguageCode; label: string; flag: string }> = [
  { code: "en", label: "English", flag: "locale-en.svg" }, { code: "ru", label: "Русский", flag: "locale-ru.svg" },
  { code: "hi", label: "हिन्दी", flag: "locale-hi.svg" }, { code: "es", label: "Español", flag: "locale-es.svg" },
  { code: "it", label: "Italiano", flag: "locale-it.svg" }, { code: "zh", label: "简体中文", flag: "locale-zh.svg" },
  { code: "ja", label: "日本語", flag: "locale-ja.svg" }, { code: "ro", label: "Română", flag: "locale-ro.svg" },
];

const activationCopy: Record<LanguageCode, { language: string; title: string; intro: string; terms: string; body: string; accept: string; opening: string }> = {
  en: { language: "Choose language", title: "Confirm your access", intro: "Review the terms and risk notice before opening your desk.", terms: "Terms & risk notice", body: "You are responsible for the network, address, and amount you submit. Deposits require on-chain confirmation. Bot controls, virtual demo results, and market analysis do not guarantee execution or profit.", accept: "Accept terms and open desk", opening: "Opening desk…" },
  ru: { language: "Выберите язык", title: "Подтвердите доступ", intro: "Ознакомьтесь с условиями и рисками перед открытием кабинета.", terms: "Условия и уведомление о рисках", body: "Вы отвечаете за сеть, адрес и сумму, которые отправляете. Депозиты зачисляются только после подтверждения в сети. Боты, виртуальная демо-версия и анализ рынка не гарантируют исполнение или прибыль.", accept: "Принять условия и открыть кабинет", opening: "Открываем кабинет…" },
  hi: { language: "भाषा चुनें", title: "अपनी पहुंच की पुष्टि करें", intro: "अपना डेस्क खोलने से पहले नियम और जोखिम सूचना देखें।", terms: "नियम और जोखिम सूचना", body: "आपके द्वारा भेजे गए नेटवर्क, पते और राशि की जिम्मेदारी आपकी है। जमा राशि केवल ऑन-चेन पुष्टि के बाद जमा होती है। बॉट, वर्चुअल डेमो और मार्केट विश्लेषण निष्पादन या लाभ की गारंटी नहीं देते।", accept: "नियम स्वीकार करें और डेस्क खोलें", opening: "डेस्क खोला जा रहा है…" },
  es: { language: "Elige idioma", title: "Confirma tu acceso", intro: "Revisa los términos y el aviso de riesgo antes de abrir tu escritorio.", terms: "Términos y aviso de riesgo", body: "Eres responsable de la red, dirección y cantidad que envíes. Los depósitos requieren confirmación en cadena. Los controles del bot, los resultados de demo virtuales y el análisis de mercado no garantizan ejecución ni ganancias.", accept: "Aceptar términos y abrir escritorio", opening: "Abriendo escritorio…" },
  it: { language: "Scegli lingua", title: "Conferma l'accesso", intro: "Rivedi i termini e l'avviso sui rischi prima di aprire il desk.", terms: "Termini e avviso sui rischi", body: "Sei responsabile della rete, dell'indirizzo e dell'importo inviati. I depositi richiedono conferma on-chain. I controlli dei bot, i risultati demo virtuali e l'analisi di mercato non garantiscono esecuzione o profitto.", accept: "Accetta i termini e apri il desk", opening: "Apertura desk…" },
  zh: { language: "选择语言", title: "确认访问权限", intro: "打开交易台前，请阅读条款和风险提示。", terms: "条款与风险提示", body: "您对提交的网络、地址和金额负责。存款需要链上确认。机器人控制、虚拟演示结果和市场分析不保证执行或盈利。", accept: "接受条款并打开交易台", opening: "正在打开交易台…" },
  ja: { language: "言語を選択", title: "アクセスを確認", intro: "デスクを開く前に、利用規約とリスク通知をご確認ください。", terms: "利用規約とリスク通知", body: "送信するネットワーク、アドレス、金額はお客様の責任です。入金にはオンチェーン確認が必要です。ボット操作、仮想デモ結果、市場分析は約定や利益を保証しません。", accept: "規約に同意してデスクを開く", opening: "デスクを開いています…" },
  ro: { language: "Alege limba", title: "Confirmă accesul", intro: "Examinează termenii și informarea privind riscurile înainte de a deschide biroul.", terms: "Termeni și informare privind riscurile", body: "Sunteți responsabil pentru rețea, adresă și suma trimisă. Depozitele necesită confirmare on-chain. Controalele botului, rezultatele demo virtuale și analiza de piață nu garantează execuția sau profitul.", accept: "Acceptă termenii și deschide biroul", opening: "Se deschide biroul…" },
};

function ActivationLanguageFlag({ language }: { language: LanguageCode }) {
  const item = activationLanguages.find((candidate) => candidate.code === language) || activationLanguages[0];
  return <img className="language-flag" src={`/icons/${item.flag}`} alt="" aria-hidden="true" />;
}

function ActivationJourney({ data, request, onAccepted, onComplete, onNotice }: { data: LiveDashboard; request: (path: string, options?: RequestInit) => Promise<any>; onAccepted: () => void; onComplete: () => Promise<void>; onNotice: (message: string) => void }) {
  const [step, setStep] = useState(Math.min(4, Math.max(0, data.user.onboarding?.step || 0)));
  const [checking, setChecking] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const initialLanguage = activationLanguages.some((item) => item.code === data.user.language_code) ? data.user.language_code as LanguageCode : "en";
  const [language, setLanguage] = useState<LanguageCode>(initialLanguage);
  const [languageSaving, setLanguageSaving] = useState(false);
  const [state, setState] = useState<string>(data.user.onboarding?.channel.verified ? "verified" : "");
  const channel = data.user.onboarding?.channel;
  const pages = [
    ["Your desk, your controls", "TradePulse keeps wallet movements, bot controls, and operating choices visible before you act."],
    ["Know where each control leads", "Your wallet records deposits and withdrawals. Bots use only the allocation you approve, and you can pause, resume, compound, or close from the desk."],
    ["Safeguards stay in the flow", "Confirm the network, address, and amount before a transfer. Digital assets and automated strategies can lose value; TradePulse does not promise returns or provide financial advice."],
    ["Practice is optional", "Virtual demo credit is non-withdrawable, does not change your mainnet wallet, and is never a promise of a return."],
  ];
  const advance = async (next: number) => { setStep(next); try { await request("/v1/onboarding/step", { method: "POST", body: JSON.stringify({ step: Math.min(next, 4) }) }); } catch { /* the local step remains usable; completion stays server-owned */ } };
  if (step < 4) {
    const page = pages[step];
    return <main className="activation-shell"><section className="activation-stage" aria-labelledby="activation-title"><div className="activation-mark"><PulseMark /></div><p className="activation-progress">Activation {step + 1} of 5</p><h1 id="activation-title">{page[0]}</h1><p>{page[1]}</p><div className="activation-actions"><button className="primary-action" onClick={() => advance(step + 1)}>Continue</button>{step > 0 && <button className="text-action" onClick={() => setStep(step - 1)}>Back</button>}</div></section></main>;
  }
  const gateReady = Boolean(channel?.enabled && channel.configured);
  const copy = activationCopy[language];
  const verify = async () => { setChecking(true); try { const result = await request("/v1/onboarding/channel/check", { method: "POST", body: "{}" }); setState(result.state || "unavailable"); } catch (error) { setState("unavailable"); onNotice(error instanceof Error ? error.message : "Telegram membership could not be checked."); } finally { setChecking(false); } };
  const chooseLanguage = async (next: LanguageCode) => {
    if (next === language || languageSaving) return;
    setLanguageSaving(true);
    try {
      await request("/v1/account/language", { method: "POST", body: JSON.stringify({ language_code: next }) });
      setLanguage(next);
    } catch (error) { onNotice(error instanceof Error ? error.message : "Could not save your language preference."); } finally { setLanguageSaving(false); }
  };
  const accept = async () => {
    if (accepting) return;
    setAccepting(true);
    try {
      await request("/v1/onboarding/accept", { method: "POST", body: "{}" });
      onAccepted();
      void onComplete();
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "Could not save your terms acceptance.");
    } finally { setAccepting(false); }
  };
  const verified = Boolean(channel?.verified || state === "verified");
  return <main className="activation-shell"><section className="activation-stage activation-gate" aria-labelledby="activation-title"><div className="activation-mark"><PulseMark /></div><p className="activation-progress">Activation 5 of 5</p><h1 id="activation-title">{copy.title}</h1><p>{copy.intro} {gateReady ? "Join the dedicated onboarding channel, then ask TradePulse to recheck your Telegram membership." : "Channel verification is not active, so this step will not block your access."}</p><fieldset className="activation-languages" aria-label="Choose language"><legend>{copy.language}</legend><div className="language-options">{activationLanguages.map((item) => <button key={item.code} type="button" className={`language-option ${language === item.code ? "selected" : ""}`} aria-pressed={language === item.code} disabled={languageSaving} onClick={() => void chooseLanguage(item.code)}><ActivationLanguageFlag language={item.code} /><span>{item.label}</span></button>)}</div></fieldset>{gateReady && !verified && <div className="activation-channel"><a className="primary-action" href={channel?.url} target="_blank" rel="noreferrer">Join onboarding channel</a><button className="text-action" disabled={checking} onClick={verify}>{checking ? "Checking Telegram…" : "I joined · recheck"}</button>{state === "not_joined" || state === "restricted" ? <small>Telegram has not confirmed an active membership yet. Join the channel, then recheck.</small> : null}{state === "unavailable" ? <small>Telegram verification is temporarily unavailable. Try again shortly or contact support.</small> : null}</div>}{(!gateReady || verified) && <div className="activation-terms"><p><strong>{copy.terms}</strong><br />{copy.body}</p><button className="primary-action" type="button" disabled={accepting} aria-busy={accepting} onClick={accept}>{accepting ? copy.opening : copy.accept}</button></div>}</section></main>;
}

export type LiveDashboard = {
  user: {
    id: number;
    first_name?: string;
    username?: string;
    tier: string;
    language_code?: LanguageCode;
    fee_credit_usd: number;
    avatar_id?: AvatarId | null;
    identity?: { locked_at?: number | null; reveal?: string | null; change_count?: number; change_fee_usd?: number };
    security_code_set?: boolean;
    is_admin: boolean;
    onboarding_complete: boolean;
    onboarding?: { step: number; terms_accepted_at?: number | null; channel: { enabled: boolean; configured: boolean; url: string; verified: boolean; verified_at?: number | null } };
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
    id: string;
    name: string;
    product: string;
    state: string;
    capital_usd: number;
    compound_percent: number;
    demo_trial?: number;
    demo_credit_only?: boolean;
    environment?: string;
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
  recovery_cases: Array<{
    id: string;
    network: string;
    asset: string;
    status: string;
    updated_at: number;
  }>;
  ledger: Array<{
    id?: number;
    kind: string;
    asset: string;
    amount_usd: number;
    status: string;
    created_at: number;
    trade_detail?: VisualDeskModel["ledger"][number]["trade_detail"];
  }>;
  engine: Array<{ bot_id?: number; event_key?: string; net_realized: number; status: string; created_at: number }>;
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
    profit_snapshot_usd?: number;
    gift_credit_usd?: number;
    converted_at?: number;
    pool_state?: string;
    pool_available_usd?: number;
    pool_locked_usd?: number;
    pool_realised_pnl_usd?: number;
    credit_available_usd?: number;
    credit_locked_usd?: number;
    credit_active?: boolean;
  } | null;
  popup_ttl_seconds: number;
  notices: Array<{ id: string; kind: string; title: string; body: string }>;
  referral: { count: number; accrued_usd: number; bot_username: string };
  tier_config: Array<{ name: string; rate: number }>;
  referral_rates: number[];
  community_url: string;
  server_time?: number;
  quotes: Record<string, number>;
  quote_age: number;
  quote_fresh: boolean;
  analyst?: { configured?: boolean; model?: string | null };
  memecoin?: {
    authorization?: { accepted_at?: number; settings_json?: string } | null;
    demo_authorization?: { accepted_at?: number; settings_json?: string } | null;
    health?: { status?: string; assets?: number; latest_tick_at?: number | null };
    metrics?: { capacity_usd?: number; reserved_capacity_usd?: number; remaining_capacity_usd?: number; enabled?: boolean; paused?: boolean; close_only?: boolean };
    market_labels?: Record<string, string>;
    recent_settlements?: Array<{ id?: string; bot_id?: number; symbol?: string; direction?: string; realized_pnl?: number; close_reason?: string; closed_at?: number }>;
  };
  synthetic?: {
    execution_mode?: "MANUAL" | "AUTO";
    open_positions?: Array<{ id?: string; market?: string; mode?: string; direction?: string; margin_usd?: number; entry_price?: number; stop_price?: number; take_price?: number; contract_expires_at?: number }>;
    realized_pnl_usd?: number;
    recent_settlements?: Array<{ id?: string; market?: string; mode?: string; direction?: string; margin_usd?: number; user_net_pnl_usd?: number; realized_pnl_usd?: number; close_reason?: string; closed_at?: number }>;
  };
  flashback_rules?: {
    version?: string;
    duration_seconds?: number;
    min_entry_usd?: number;
    max_entry_usd?: number;
    max_return_multiplier?: number;
    multiplier_step?: number;
    progressive_multiplier?: boolean;
    bands?: Array<{ up_to_usd: number | null; table: Array<{ multiplier: number; probability: number }> }>;
    payout_tables?: Record<string, Array<{ multiplier: number; probability: number }>>;
  };
  flashback_direction?: {
    version?: number;
    duration_seconds?: number;
    markets?: Array<{ symbol: string; pair?: string }>;
    schedule?: Array<{ up_to_usd: number | null; multiplier: number }>;
  };
  flashback?: {
    id?: string;
    allocation_usd?: number;
    state?: "sealed" | "ready_to_reveal" | "revealed";
    opened_at?: number;
    expires_at?: number;
    hard_loss_usd?: number;
    commitment?: string;
    close_reason?: string;
    ready_at?: number;
    revealed_at?: number;
    settled_at?: number;
    product_version?: string;
    payout_table?: Array<{ multiplier: number; probability: number }> | Record<string, unknown>;
    payout_multiplier?: number;
    return_usd?: number;
    entropy_hash?: string;
    result_ready?: boolean;
    market?: string;
    direction?: "long" | "short" | "sealed_return" | "up" | "down";
    entry_price?: number;
    entry_source?: string;
    exit_price?: number;
    exit_source?: string;
    realized_pnl?: number;
    fee_usd?: number;
    user_net_usd?: number;
    nonce?: string;
    live_reference?: {
      price?: number;
      source?: string;
      quoted_at?: number;
      move_percent?: number;
      call_status?: "ahead" | "behind" | "flat" | "unavailable";
    };
  } | null;
  flashback_sessions?: NonNullable<LiveDashboard["flashback"]>[];
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
    address?: string;
    status: string;
  }>;
  recovery_cases: Array<{
    id: string;
    status: string;
    asset: string;
    network: string;
    user_id: number;
  }>;
  tickets: Array<{
    id: string;
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
  autousers: {
    totals: { total_events?: number; scheduled_events?: number; completed_events?: number; blocked_events?: number; credited_usd?: number; completed_withdrawals?: number; completed_topups?: number; event_participants?: number; active_event_bots?: number; total_actions?: number; scheduled_actions?: number; completed_actions?: number; blocked_actions?: number; completed_flashback_actions?: number };
    runs: Array<{
      id: string;
      status: "scheduled" | "paused" | "cancelled" | "completed";
      import_complete?: number;
      min_amount_usd: number;
      max_amount_usd: number;
      imported_users: number;
      completed_events: number;
      scheduled_events: number;
      blocked_events?: number;
      completed_withdrawals?: number;
      completed_topups?: number;
      event_participants?: number;
      active_event_bots?: number;
      imported_accounts?: number;
      pending_imports?: number;
      next_scheduled_at?: number | null;
      completed_actions?: number;
      scheduled_actions?: number;
      blocked_actions?: number;
      completed_flashback_actions?: number;
      next_action_at?: number | null;
    }>;
    forecast: Array<{ date: string; deposits: number; withdrawals: number; topups: number; flashbacks?: number; lifecycle?: number; total: number }>;
  };
  community_cards: {
    config: { group: string; enabled: boolean; stress_test_presentation?: boolean };
    renderer: { ready: boolean; reason: string; version?: string };
    counts: Record<string, number>;
    events: Array<{
      id: string;
      kind: string;
      status: "queued" | "rendering" | "sending" | "sent" | "retry" | "needs_review";
      attempts: number;
      render_error?: string | null;
      telegram_message_id?: number | null;
      created_at: number;
      sent_at?: number | null;
    }>;
  };
  broadcasts: Array<{
    id: string;
    scope: "all" | "user" | "channel" | "group";
    target?: string;
    total_recipients: number;
    sent_count: number;
    failed_count: number;
    status: "queued" | "delivering" | "completed";
    created_at: number;
  }>;
  sweeps_enabled: boolean;
};

type TelegramWebApp = {
  initData?: string;
  ready?: () => void;
  expand?: () => void;
};
function telegramWebApp() {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram
    ?.WebApp;
}
function telegramLaunchData() {
  if (typeof window === "undefined") return "";
  const sources = [window.location.search, window.location.hash.replace(/^#/, "")];
  for (const source of sources) {
    if (!source) continue;
    const value = new URLSearchParams(source).get("tgWebAppData");
    if (value) return value;
  }
  return "";
}
function telegramInitData() {
  const bridgeData = telegramWebApp()?.initData || "";
  const launchData = telegramLaunchData();
  // Never cache Telegram proof in a reused tab. Browser handoff has its own
  // HttpOnly server session; a signed Mini App always supplies fresh proof.
  return bridgeData || launchData;
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
    if (webApp?.initData || telegramLaunchData()) return webApp;
    await new Promise((resolve) => window.setTimeout(resolve, 100));
  }
  return undefined;
}
function BrowserBotHandoff() {
  const [state, setState] = useState<"preparing" | "ready" | "waiting" | "error">("preparing");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const [botUrl, setBotUrl] = useState("");
  const [expiresIn, setExpiresIn] = useState(300);
  const [attempt, setAttempt] = useState(0);
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
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
        const handoffExpiry = Number(handoff.expires_in);
        setExpiresIn(Number.isFinite(handoffExpiry) && handoffExpiry > 0 && handoffExpiry <= 600 ? handoffExpiry : 300);
        setState("ready");
        setMessage("Secure Telegram link ready. It expires in five minutes.");
      } catch (error) {
        if (cancelled) return;
        if (attempt < 3) {
          setState("preparing");
          setMessage("Creating a secure Telegram link…");
          timer.current = window.setTimeout(() => {
            if (!cancelled) setAttempt((current) => current + 1);
          }, 2_500);
          return;
        }
        setState("error");
        setMessage("We could not refresh the secure Telegram link yet.");
      }
    };
    void prepare();
    return () => {
      cancelled = true;
    };
  }, [attempt]);
  useEffect(() => {
    if (state !== "waiting" || !token) return;
    const deadline = Date.now() + expiresIn * 1_000;
    let inFlight = false;
    let terminal = false;
    const poll = async () => {
      if (inFlight) return;
      inFlight = true;
      if (Date.now() >= deadline) {
        timer.current = null;
        terminal = true;
        setState("preparing");
        setMessage("Creating a secure Telegram link…");
        window.setTimeout(() => setAttempt((current) => current + 1), 300);
        inFlight = false;
        return;
      }
      try {
        const response = await fetch(
          `/api/v1/auth/handoff/complete?token=${encodeURIComponent(token)}`,
          { credentials: "same-origin", cache: "no-store" },
        );
        if (response.status === 202) {
          inFlight = false;
          timer.current = window.setTimeout(poll, 1000);
          return;
        }
        const contentType = response.headers.get("content-type") || "";
        const result = contentType.includes("application/json")
          ? await response.json()
          : { error: (await response.text()).slice(0, 240) };
        if (!response.ok || !result.ready) {
          terminal = true;
          timer.current = null;
          throw new Error(result.error || "Could not finish browser connection.");
        }
        timer.current = null;
        terminal = true;
        window.location.replace("/");
      } catch (error) {
        terminal = true;
        timer.current = null;
        setState("preparing");
        setMessage("Creating a secure Telegram link…");
        window.setTimeout(() => setAttempt((current) => current + 1), 1_500);
      } finally {
        inFlight = false;
        if (!terminal && timer.current === null && Date.now() < deadline) {
          timer.current = window.setTimeout(poll, 1000);
        }
      }
    };
    // Browsers throttle timers while this tab is backgrounded and Telegram is
    // open. Recheck immediately when the user returns so a confirmed handoff
    // never waits for the throttled timer budget.
    const resumePoll = () => {
      if (document.visibilityState !== "visible" || inFlight) return;
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = null;
      void poll();
    };
    window.addEventListener("focus", resumePoll);
    document.addEventListener("visibilitychange", resumePoll);
    void poll();
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = null;
      window.removeEventListener("focus", resumePoll);
      document.removeEventListener("visibilitychange", resumePoll);
    };
  }, [state, token, expiresIn]);
  const retry = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setToken("");
    setBotUrl("");
    setMessage("");
    setState("preparing");
    setAttempt((current) => current + 1);
  };
  return (
    <div className="browser-handoff" data-state={state}>
      {state === "ready" && botUrl ? (
        <a
          className="primary-action"
          href={botUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            setState("waiting");
            setMessage("Confirm this browser in Telegram. Your desk will open here automatically.");
          }}
        >
          Continue with Telegram
        </a>
      ) : (
        <button className="primary-action" type="button" disabled aria-busy="true">
          {state === "waiting" ? "Waiting for Telegram…" : "Preparing secure link…"}
        </button>
      )}
      {message && <small role="status" aria-live="polite">{message}</small>}
      {state === "error" && (
        <button className="small-action" type="button" onClick={retry}>
          Create a new secure link
        </button>
      )}
    </div>
  );
}
function AuthEntryPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  return <main className={`telegram-entry telegram-entry--${theme}`}>
    <header className="telegram-entry-nav">
      <div className="telegram-entry-brand"><PulseMark /><span>TRADE<span>PULSE</span></span></div>
      <div className="telegram-entry-nav-actions"><button className="telegram-theme-toggle" type="button" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} aria-pressed={theme === "light"}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.8v2.1M12 18.1v2.1M20.2 12h-2.1M5.9 12H3.8M17.8 6.2l-1.5 1.5M7.7 16.3l-1.5 1.5M17.8 17.8l-1.5-1.5M7.7 7.7 6.2 6.2M15.9 12a3.9 3.9 0 1 1-7.8 0 3.9 3.9 0 0 1 7.8 0Z" /></svg><span>{theme === "dark" ? "Light" : "Dark"}</span></button></div>
    </header>
    <section className="telegram-auth-stage" aria-labelledby="telegram-entry-title">
      <div className="telegram-auth-copy">
        <h1 id="telegram-entry-title">Your desk is ready when you are.</h1>
        <p>Continue with Telegram to open your private TradePulse session in this browser.</p>
        <BrowserBotHandoff />
        <small className="telegram-auth-note">TradePulse will never ask for your password, recovery phrase, or one-time code.</small>
      </div>
      <aside className="telegram-auth-side" aria-label="How Telegram browser confirmation works">
        <div className="telegram-auth-side-rule" aria-hidden="true" />
        <p>One confirmation.<br />Then you are back at your desk.</p>
        <small>Telegram only confirms this browser. Your session stays here.</small>
      </aside>
    </section>
    <footer className="telegram-auth-footer"><span>© {new Date().getFullYear()} TradePulse</span><span>Trading involves risk.</span></footer>
  </main>;
}
export function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));
}

export function signedActivityAmount(kind: string, status: string, amount: number) {
  const description = `${kind} ${status}`.toLowerCase();
  // Engine rows are occasionally stored as an absolute realised amount. The
  // event label remains authoritative for the direction shown to the user.
  return /\bloss\b|performance_fee|identity_change_fee/.test(description) ? -Math.abs(Number(amount || 0)) : Number(amount || 0);
}

function activityAmountTone(amount: number) {
  return amount > 0 ? "up" : amount < 0 ? "down" : undefined;
}

export function activityAmountDisplay(amount: number) {
  return (amount > 0 ? "+" : "") + money(amount);
}

export function activityLabel(kind: string, status = "", amount?: number) {
  const description = `${kind} ${status}`.toLowerCase();
  if (kind === "performance_fee") return "performance fee charged";
  if (kind === "flashback_allocation") return "Flashback entry locked";
  if (kind === "flashback_return") return "Flashback return";
  if (kind === "flashback_loss") return Number(amount || 0) === 0 ? "Flashback settled" : "Flashback loss";
  if (kind === "flashback_direction_return") return "Flashback Direction return";
  if (kind === "flashback_direction_loss") return "Flashback Direction loss";
  if (kind === "flashback_direction_refund") return "Flashback Direction entry returned";
  if (kind === "profit" || kind === "trading_profit") return "Trading settlement profit";
  if (kind === "loss" || kind === "trading_loss") return "Trading settlement loss";
  if (/trading_(?:profit|loss)/.test(kind) || /\bprofit\b/.test(description)) return "profit";
  if (/\bloss\b/.test(description)) return "loss";
  if (isNonFinancialActivity(kind)) return "Memecoin strategy authorized";
  return kind.replaceAll("_", " ");
}

export function activityTone(kind: string, status: string, amount?: number) {
  if (kind === "flashback_loss" && Number(amount || 0) === 0) return "complete";
  const description = `${kind} ${status}`.toLowerCase();
  if (/\bloss\b|failed|rejected/.test(description)) return "loss";
  if (/pending|review|queued/.test(description)) return "review";
  return "complete";
}

type MarketPoint = { market?: string; sequence?: number; price: number; timestamp?: number };
type MarketCandle = SyntheticCandle;

function makeCandles(points: MarketPoint[]): MarketCandle[] {
  return makeSyntheticCandles(points as SyntheticTick[]);
}

function chartCandles(points: MarketPoint[], supplied?: MarketCandle[]) {
  const candles = (supplied || []).filter((candle) =>
    [candle.open, candle.close, candle.high, candle.low].every((value) => Number.isFinite(Number(value)) && Number(value) > 0),
  );
  if (!candles.length) return makeCandles(points);
  const latest = points.at(-1);
  const latestTimestamp = Number(latest?.timestamp || 0);
  const finalTimestamp = Number(candles.at(-1)?.timestamp || 0);
  if (latest && Number.isFinite(Number(latest.price)) && Number(latest.price) > 0 && latestTimestamp > finalTimestamp) {
    candles.push({ open: Number(latest.price), close: Number(latest.price), high: Number(latest.price), low: Number(latest.price), timestamp: latestTimestamp });
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

function MarketChart({
  points,
  ohlcCandles,
  market,
  accent = "#34d399",
}: {
  points: MarketPoint[];
  ohlcCandles?: MarketCandle[];
  market: string;
  accent?: string;
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState(0);
  const chartRef = useRef<HTMLDivElement>(null);
  const priceSvgRef = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStartDistance = useRef(0);
  const pinchStartZoom = useRef(1);
  const dragStart = useRef<{ pointerId: number; x: number; offset: number } | null>(null);
  const clampZoom = (value: number) => Math.max(1, Math.min(8, value));
  const clearGesture = () => {
    const captured = Array.from(pointers.current.keys());
    pointers.current.clear();
    pinchStartDistance.current = 0;
    dragStart.current = null;
    for (const pointerId of captured) {
      if (chartRef.current?.hasPointerCapture(pointerId)) chartRef.current.releasePointerCapture(pointerId);
    }
  };
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || pointers.current.size >= 2 || (event.target instanceof Element && event.target.closest("button"))) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus({ preventScroll: true });
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) {
      dragStart.current = { pointerId: event.pointerId, x: event.clientX, offset: Math.min(offset, maxOffset) };
    } else if (pointers.current.size === 2) {
      dragStart.current = null;
      const [first, second] = Array.from(pointers.current.values());
      pinchStartDistance.current = Math.hypot(first.x - second.x, first.y - second.y);
      pinchStartZoom.current = zoom;
    }
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1 && dragStart.current?.pointerId === event.pointerId) {
      const plotWidth = Math.max(1, (priceSvgRef.current?.getBoundingClientRect().width || 660) * (560 / 660));
      const travelledPoints = Math.round(((dragStart.current.x - event.clientX) / plotWidth) * visibleCount);
      setOffset(Math.max(0, Math.min(maxOffset, dragStart.current.offset + travelledPoints)));
      return;
    }
    if (pointers.current.size !== 2 || !pinchStartDistance.current) return;
    const [first, second] = Array.from(pointers.current.values());
    const distance = Math.hypot(first.x - second.x, first.y - second.y);
    setZoom(clampZoom(pinchStartZoom.current * (distance / pinchStartDistance.current)));
  };
  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointers.current.has(event.pointerId)) clearGesture();
  };
  const sourceCandles = chartCandles(points, ohlcCandles);
  const baseVisibleCount = Math.min(42, sourceCandles.length);
  const visibleCount = Math.max(12, Math.min(sourceCandles.length, Math.round(baseVisibleCount / zoom)));
  const maxOffset = Math.max(0, sourceCandles.length - visibleCount);
  const pan = (direction: number) => setOffset((current) => Math.max(0, Math.min(maxOffset, current + direction * Math.max(1, Math.round(visibleCount / 5)))));
  const resetView = () => { setZoom(1); setOffset(0); };
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "+" || event.key === "=") setZoom((current) => clampZoom(current * 1.18));
    else if (event.key === "-") setZoom((current) => clampZoom(current * 0.85));
    else if (event.key === "ArrowLeft") pan(1);
    else if (event.key === "ArrowRight") pan(-1);
    else if (event.key === "Home") setOffset(maxOffset);
    else if (event.key === "End") setOffset(0);
    else if (event.key === "0") resetView();
    else return;
    event.preventDefault();
  };
  const cropEnd = sourceCandles.length - Math.min(offset, maxOffset);
  const candles = sourceCandles.slice(Math.max(0, cropEnd - visibleCount), cropEnd);
  const hasCandles = candles.length > 0;
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !hasCandles) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.deltaY || (event.target instanceof Element && event.target.closest("button"))) return;
      event.preventDefault();
      setZoom((current) => Math.max(1, Math.min(8, current * (event.deltaY < 0 ? 1.18 : 0.85))));
    };
    chart.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("blur", clearGesture);
    return () => {
      chart.removeEventListener("wheel", onWheel);
      window.removeEventListener("blur", clearGesture);
      clearGesture();
    };
  }, [hasCandles]);
  useEffect(() => setOffset((current) => Math.min(current, maxOffset)), [maxOffset]);
  if (!hasCandles) {
    return <div className="market-chart market-chart-empty" role="status">Waiting for live market ticks</div>;
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
      ref={chartRef}
      className="market-chart"
      role="group"
      tabIndex={0}
      aria-label={`${market} candlestick chart with RSI. Use plus or minus to zoom, left or right arrows to pan, Home for earliest, End for latest, and zero to reset. Mouse wheel, pinch, and drag are also available.`}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onLostPointerCapture={onPointerEnd}
      style={{ touchAction: "none" }}
    >
      <div className="market-chart-main">
        <svg ref={priceSvgRef} viewBox="0 0 660 204" preserveAspectRatio="none" role="img" aria-label={`${market} price candles. Latest visible close ${formatMarketPrice(candles[candles.length - 1].close)}, low ${formatMarketPrice(low)}, high ${formatMarketPrice(high)}.`}>
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
            const bodyHeight = Math.abs(y(candle.open) - y(candle.close));
            return <g key={`${candle.timestamp || index}-${candle.close}`}>
              <path d={`M${center} ${y(candle.high)}V${y(candle.low)}`} stroke={color} strokeWidth="1.15" />
              {bodyHeight < 0.8
                ? <path d={`M${center - bodyWidth / 2} ${y(candle.close)}H${center + bodyWidth / 2}`} stroke={color} strokeWidth="1" />
                : <rect x={center - bodyWidth / 2} y={top} width={bodyWidth} height={bodyHeight} fill={rising ? `${color}B3` : color} stroke={color} strokeWidth="0.8" />}
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
        {visibleTimes.map((index) => <span key={index}>{formatMarketChartTime(candles[index]?.timestamp, index, candles.length, candles[0]?.timestamp, candles.at(-1)?.timestamp)}</span>)}
      </div>
      <div className="filter-chips" role="group" aria-label="Chart view controls">
        <button type="button" onClick={() => setZoom((current) => clampZoom(current * 1.18))} disabled={zoom >= 8} aria-label="Zoom in chart" title="Zoom in (+)"><StateIcon name="plus" size={14} /></button>
        <button type="button" onClick={() => setZoom((current) => clampZoom(current * 0.85))} disabled={zoom <= 1} aria-label="Zoom out chart" title="Zoom out (-)"><StateIcon name="minus" size={14} /></button>
        <button type="button" onClick={() => pan(1)} disabled={offset >= maxOffset} title="Earlier prices (left arrow)">Earlier</button>
        <button type="button" onClick={() => pan(-1)} disabled={offset <= 0} title="Later prices (right arrow)">Later</button>
        <button type="button" onClick={resetView} disabled={zoom === 1 && offset === 0} title="Reset chart (0)">Reset</button>
      </div>
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
          <span>RATE</span>
          <span>ACCOUNT</span>
        </div>
        {data.tier_config.map((tier) => (
          <div
            className={`table-row ${tier.name === data.user.tier ? "current" : ""}`}
            key={tier.name}
          >
            <b>{tier.name}</b>
            <span>{tier.rate}% above HWM</span>
            <strong>{tier.name === data.user.tier ? "CURRENT" : "—"}</strong>
          </div>
        ))}
      </GradientPanel>
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
  const [withdrawalError, setWithdrawalError] = useState("");
  const [submittedWithdrawal, setSubmittedWithdrawal] = useState<{
    asset: string;
    chain: string;
    amount: number;
  } | null>(null);
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
    setWithdrawalError("");
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
      const message = error instanceof Error ? error.message : "Could not create the withdrawal request.";
      setWithdrawalError(message);
      onNotice(message);
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
                disabled={depositPending}
                aria-busy={depositPending}
                onClick={async () => {
                  if (depositPending) return;
                  setDepositPending(true);
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
                  } finally {
                    setDepositPending(false);
                  }
                }}
              >
                {depositPending ? "Checking deposit…" : "I made this deposit"} <ChevronRight />
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
            onClick={() => { setWithdrawalError(""); setReviewWithdrawal(true); }}
          >
            Review withdrawal <ChevronRight />
          </button>
        </GradientPanel>
        {reviewWithdrawal && (
          <AccessibleDialog label="Verify before sending" onClose={() => setReviewWithdrawal(false)} dismissible={!walletPending}>
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
              {withdrawalError && <p className="security-feedback" role="alert">{withdrawalError}</p>}
              <button className="primary-action" disabled={walletPending} aria-busy={walletPending} onClick={submitWithdrawal}>
                {walletPending ? "Submitting…" : "Confirm withdrawal"} <Send />
              </button>
              <button
                className="ghost-action"
                disabled={walletPending}
                onClick={() => setReviewWithdrawal(false)}
              >
                Go back
              </button>
          </AccessibleDialog>
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
              const isNonFinancial = isNonFinancialActivity(entry.kind);
              return (
              <div className="ledger-row" key={`${entry.created_at}-${index}`}>
                <div>
                  <strong>{activityLabel(entry.kind, entry.status, amount)}</strong>
                  <small>
                    {isFlashbackEntryLock(entry.kind) ? "Entry locked until the sealed result is revealed" : isNonFinancial ? "Strategy controls saved · no balance change" : `${entry.asset} / ${entry.status}`}
                  </small>
                </div>
                <span
                  className={`activity-status ${activityTone(entry.kind, entry.status, amount)}`}
                >
                  {entry.status}
                </span>
                <code className={isNonFinancial ? undefined : amount > 0 ? "mint" : amount < 0 ? "down" : undefined}>
                  {isNonFinancial ? "—" : activityAmountDisplay(amount)}
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
          {data.ledger.length ? (
            [...data.ledger]
              .sort((a, b) => b.created_at - a.created_at)
              .map((entry, index) => {
                const amount = signedActivityAmount(entry.kind, entry.status, entry.amount_usd);
                const isNonFinancial = isNonFinancialActivity(entry.kind);
                return (
                <div
                  className="ledger-row"
                  key={`${entry.created_at}-${index}`}
                >
                  <div>
                    <strong>{activityLabel(entry.kind, entry.status, amount)}</strong>
                    <small>
                      {isFlashbackEntryLock(entry.kind) ? "Entry locked until the sealed result is revealed" : isNonFinancial ? "Strategy controls saved · no balance change" : `${entry.asset} / ${entry.status}`}
                    </small>
                  </div>
                  <span
                    className={`activity-status ${activityTone(entry.kind, entry.status, amount)}`}
                  >
                    {entry.status}
                  </span>
                  <code className={isNonFinancial ? undefined : amount > 0 ? "mint" : amount < 0 ? "down" : undefined}>
                    {isNonFinancial ? "—" : activityAmountDisplay(amount)}
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
  return (
    <div className="wallet-grid">
      <GradientPanel className="wallet-balance-overview">
        <div className="wallet-balance-primary">
          <div className="wallet-balance-heading">
            <h2>Available balance</h2>
            <button
              type="button"
              className="visibility"
              aria-label={balancesVisible ? "Hide wallet balances" : "Show wallet balances"}
              aria-pressed={balancesVisible}
              onClick={() => setBalancesVisible((visible) => !visible)}
            >
              <StateIcon name={balancesVisible ? "eye" : "eye-off"} size={17} />
            </button>
          </div>
          <strong className="mint">{balancesVisible ? money(data.wallet.available) : "••••••"}</strong>
          <small>Available now</small>
        </div>
        <div className="wallet-balance-facts" aria-label="Wallet account state">
          <div>
            <span>LOCKED</span>
            <strong>{balancesVisible ? money(data.wallet.locked) : "••••••"}</strong>
            <small>Active bots</small>
          </div>
          <div>
            <span>TOTAL EQUITY</span>
            <strong className="mint">{balancesVisible ? money(data.wallet.equity) : "••••••"}</strong>
            <small>Account value</small>
          </div>
          <div>
            <span>HIGH-WATER MARK</span>
            <strong>{balancesVisible ? money(data.wallet.hwm) : "••••••"}</strong>
            <small>Fee baseline</small>
          </div>
        </div>
      </GradientPanel>
      <div className="wallet-actions" role="group" aria-label="Wallet actions">
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
    </div>
  );
}

const deskTabs = ["Dashboard", "Bots", "Wallet", "Desk", "Account", "Earn", "Help", "Synthetic", "Admin"] as const;
type DeskTab = (typeof deskTabs)[number];

function deskTabFromHash(): DeskTab | null {
  if (typeof window === "undefined") return null;
  const value = decodeURIComponent(window.location.hash.replace(/^#/, "")).trim().toLowerCase();
  return deskTabs.find((tab) => tab.toLowerCase() === value) || null;
}

function LiveTradePulse() {
  const reduceMotion = useReducedMotion();
  const deskStoreRef = useRef<DeskStore | null>(null);
  if (!deskStoreRef.current) {
    deskStoreRef.current = createDeskStore({ resources: { dashboard: null, synthetic: null } });
  }
  const deskStore = deskStoreRef.current;
  const dashboardRevision = useRef(0);
  const data = useDeskSelector(
    deskStore,
    (state: DeskState) => state.resources.dashboard as LiveDashboard | null,
  );
  const updateDashboard = useCallback((update: LiveDashboard | null | ((current: LiveDashboard | null) => LiveDashboard | null)) => {
    const current = deskStore.getState().resources.dashboard as LiveDashboard | null;
    const next = typeof update === "function"
      ? (update as (current: LiveDashboard | null) => LiveDashboard | null)(current)
      : update;
    deskStore.applyResource("dashboard", next, ++dashboardRevision.current);
  }, [deskStore]);
  const authenticatedUserRef = useRef<number | null>(null);
  const dashboardLoadRef = useRef<{ environment: "mainnet" | "testnet"; promise: Promise<void> } | null>(null);
  const [avatarId, setAvatarId] = useState<AvatarId>("orbit");
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [avatarPickerRequired, setAvatarPickerRequired] = useState(false);
  const [tab, setTab] = useState<DeskTab>("Dashboard");
  const [walletEntry, setWalletEntry] = useState<
    "overview" | "deposit" | "withdraw" | "history" | "activity" | "gas"
  >("overview");
  const [botEntryId, setBotEntryId] = useState<string | null>(null);
  const [identityPending, setIdentityPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [openNotificationsRequest, setOpenNotificationsRequest] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const applyHash = () => {
      const next = deskTabFromHash();
      if (next) setTab(next);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);
  useEffect(() => {
    const expected = `#${tab.toLowerCase()}`;
    if (window.location.hash !== expected) window.history.replaceState(null, "", expected);
  }, [tab]);
  const avatarStorageKey = data ? `tradepulse.avatar:${data.user.id}` : "";
  async function persistAvatar(next: AvatarId) {
    try {
      const response = await request("/v1/account/avatar", {
        method: "POST",
        body: JSON.stringify({ avatar_id: next, idempotency_key: `identity:${data?.user.id || "guest"}:${next}:${crypto.randomUUID()}`, expected_identity: data?.user.avatar_id || "", expected_fee_usd: data?.user.identity?.change_fee_usd || 0 }),
      });
      if (response.avatar_id !== next) throw new Error("The saved avatar did not match your selection.");
      updateDashboard((current) => current ? { ...current, user: { ...current.user, avatar_id: next, identity: { ...(current.user.identity || {}), reveal: response.reveal || `${next}-seal` } }, wallet: response.wallet ? { ...current.wallet, ...response.wallet } : current.wallet } : current);
      return true;
    } catch {
      setNotice("Your identity could not be sealed. Check your available wallet balance and try again.");
      return false;
    }
  }
  useEffect(() => {
    if (!data) return;
    const accountAvatar = data.user.avatar_id || "";
    let stored = "";
    try {
      stored = window.localStorage.getItem(avatarStorageKey) || "";
    } catch {
      /* storage is optional */
    }
    const preferred = accountAvatar || stored;
    const valid = avatarOptions.some((option) => option.id === preferred);
    if (valid) {
      setAvatarId(preferred as AvatarId);
      if (!accountAvatar) {
        setAvatarPickerRequired(true);
        setAvatarPickerOpen(true);
      }
    }
    else {
      setAvatarPickerRequired(true);
      setAvatarPickerOpen(true);
    }
  }, [data?.user.id, data?.user.avatar_id]);
  const chooseAvatar = async (next: AvatarId) => {
    if (identityPending) return;
    const prior = avatarId;
    setIdentityPending(true);
    setAvatarId(next);
    try {
      if (avatarStorageKey) window.localStorage.setItem(avatarStorageKey, next);
    } catch {
      /* in-memory selection still applies */
    }
    try {
      if (!await persistAvatar(next)) {
        setAvatarId(prior);
        try {
          if (avatarStorageKey) window.localStorage.setItem(avatarStorageKey, prior);
        } catch {
          /* storage is optional */
        }
        return;
      }
      setAvatarPickerRequired(false);
      setAvatarPickerOpen(false);
      setNotice(prior === next ? "Identity unchanged." : `Identity sealed: ${avatarOptions.find((option) => option.id === next)?.name || next}.`);
    } catch {
      setAvatarId(prior);
    } finally {
      setIdentityPending(false);
    }
  };
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
  const [demoReviewOpen, setDemoReviewOpen] = useState(false);
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
        points: SyntheticTick[];
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
  const [admin, setAdmin] = useState<LiveTradePulseAdmin | null>(null);
  // Keep the pending action identity so a top-up, order, approval, or close
  // cannot make an unrelated control render the wrong loading label.
  const [pendingActions, setPendingActions] = useState<Record<string, boolean>>({});
  const isActionPending = (key: string) => Boolean(pendingActions[key]);
  const headers = (targetEnvironment = webEnvironment) => ({
    "X-Telegram-Init-Data": telegramInitData(),
    "X-TradePulse-Environment": targetEnvironment,
  });
  const request = useCallback(async (
    path: string,
    options: RequestInit = {},
    targetEnvironment = webEnvironment,
    timeoutMs = 15_000,
  ) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const requestHeaders = { ...headers(targetEnvironment), ...(options.headers || {}) } as Record<string, string>;
      const requestId = window.crypto?.randomUUID?.() || `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      requestHeaders["X-TradePulse-Request-Id"] = requestId;
      if (!(options.body instanceof FormData) && !Object.keys(requestHeaders).some((name) => name.toLowerCase() === "content-type")) {
        requestHeaders["Content-Type"] = "application/json";
      }
      const response = await fetch(`/api${path}`, {
        ...options,
        signal: controller.signal,
        headers: requestHeaders,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) {
          // Never leave a previously rendered desk looking operational after
          // its Telegram proof or browser handoff has expired. The reconnect
          // surface is the only safe recovery path; retrying market reads
          // cannot recreate an authenticated session.
          setNotice("Your secure desk session ended. Reconnect with Telegram to continue.");
          updateDashboard(null);
          throw new Error("Your secure desk session ended. Reconnect with Telegram to continue.");
        }
        const reference = typeof body.request_id === "string"
          ? body.request_id
          : response.headers.get("x-tradepulse-request-id");
        const message = body.error || "TradePulse could not complete this request.";
        throw new Error(reference ? `${message} Reference: ${reference}` : message);
      }
      return body;
    } finally {
      window.clearTimeout(timeout);
    }
  }, [webEnvironment]);
  const noticeCenter = useNoticeCenter(data ? `${data.user.id}:${webEnvironment}` : "", data?.notices || [], async () => {
    // Notification polling must not replace the desk projection. Replacing
    // it tears down the Synthetic live effects every 30 seconds and looks
    // like an unexplained full-page refresh while Auto is enabled.
    const result = await request("/v1/account/notices");
    return result.notices || [];
  });
  const load = async (targetEnvironment = webEnvironment) => {
    // Every view reads the same account projection.  Reuse an in-flight read
    // for its environment instead of letting an alert, account change, or
    // deposit monitor stack several expensive dashboard requests together.
    const activeLoad = dashboardLoadRef.current;
    if (activeLoad?.environment === targetEnvironment) return activeLoad.promise;
    const performLoad = async () => {
    // Keep the current desk mounted during background refreshes. This lets
    // optimistic toggles and button feedback render immediately instead of
    // replacing the whole surface with the boot screen after every action.
    const showBootScreen = !data;
    if (showBootScreen) setLoading(true);
    try {
      const webApp = openedInsideTelegram() ? await waitForTelegramWebApp() : undefined;
      webApp?.ready?.();
      webApp?.expand?.();
      // A Telegram-authenticated first load has to assemble the complete
      // account projection. Give a healthy, signed desk enough room to finish
      // during a transient database reconnect instead of mislabelling it as
      // an authentication failure at twelve seconds.
      const next = await request("/v1/dashboard", {}, targetEnvironment, 25_000);
      const previousUserId = authenticatedUserRef.current;
      if (previousUserId !== null && previousUserId !== next.user.id) {
        // Never let an earlier account's in-memory projections flash while a
        // new Telegram identity becomes active in the same browser tab.
        setAdmin(null);
        setPendingActions({});
        setWebEnvironment("mainnet");
      }
      authenticatedUserRef.current = next.user.id;
      updateDashboard(next);
      setWebEnvironment(next.user.is_admin && targetEnvironment === "testnet" && next.environment === "testnet" ? "testnet" : "mainnet");
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
    const promise = performLoad();
    dashboardLoadRef.current = { environment: targetEnvironment, promise };
    try {
      await promise;
    } finally {
      if (dashboardLoadRef.current?.promise === promise) {
        dashboardLoadRef.current = null;
      }
    }
  };
  useEffect(() => {
    void load();
  }, []);
  // Testnet is an isolated control-room workspace, never a customer desk
  // context. Leaving Admin (or losing admin access after a new Telegram
  // session) immediately returns the browser to the mainnet projection.
  useEffect(() => {
    if (!data || (tab === "Admin" && data.user.is_admin) || (webEnvironment === "mainnet" && data.environment === "mainnet")) return;
    setWebEnvironment("mainnet");
    void load("mainnet");
  }, [tab, data?.user.is_admin, webEnvironment]);
  useEffect(() => {
    const demo = data?.demo;
    const state = demo?.pool_state || demo?.state;
    const endsAt = Number(demo?.expires_at || 0);
    if (state !== "active" || !Number.isFinite(endsAt) || endsAt <= 0) return;
    const timer = window.setTimeout(
      () => void load(),
      Math.max(0, endsAt * 1000 - Date.now()) + 100,
    );
    return () => window.clearTimeout(timer);
  }, [data?.demo?.expires_at, data?.demo?.pool_state, data?.demo?.state, webEnvironment]);
  useEffect(() => {
    if (!notice || !data) return;
    const timer = window.setTimeout(() => setNotice(""), 6500);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!data || notice || !data.notices?.length) return;
    const key = `tradepulse.web-notices:${data.user.id}:${data.environment}`;
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
    try {
      window.localStorage.setItem(key, JSON.stringify(seen));
    } catch {
      /* the in-memory toast still works */
    }
    setNotice(`${next.title} — ${next.body}`);
  }, [data, notice]);
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
              points: reconcileSyntheticTicks((snapshot.ticks || []).map((tick: { market?: string; sequence?: number; price?: number; reference?: number; timestamp?: number; created_at?: number }) => ({
                market: String(tick.market || snapshot.market || "SYN-25"),
                sequence: Number(tick.sequence),
                price: Number(tick.reference ?? tick.price),
                timestamp: tick.timestamp ?? tick.created_at,
              })), String(snapshot.market || "SYN-25")),
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
          sequence?: number;
        };
        const price = Number(latest.reference ?? latest.price);
        const sequence = Number(latest.sequence);
        if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(sequence)) return;
        const timestamp = latest.timestamp;
        setCharts((current) => {
          const existing = current.synthetic;
          const market = existing?.market || "SYN-25";
          const points = reconcileSyntheticTicks([
            ...(existing?.points || []),
            { market, sequence, price, timestamp },
          ], market).slice(-240);
          return {
            ...current,
            synthetic: {
              market,
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
      const botId = botAction[1];
      const action = String(payload.action || "");
      const amount = Number(payload.amount || 0);
      const percent = Number(payload.percent || 0);
      const returnedBot = response.bot && typeof response.bot === "object"
        ? response.bot as Partial<LiveDashboard["bots"][number]>
        : null;
      const returnedWallet = response.wallet && typeof response.wallet === "object"
        ? response.wallet as Partial<LiveDashboard["wallet"]>
        : null;
      updateDashboard((current) => {
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
    if (path === "/v1/demo/start" && response.trial && typeof response.trial === "object") {
      updateDashboard((current) =>
        current ? { ...current, demo: response.trial as LiveDashboard["demo"] } : current,
      );
    }
    if (path.startsWith("/v1/flashback/") && response.session && typeof response.session === "object") {
      const session = response.session as NonNullable<LiveDashboard["flashback"]>;
      const sessions = Array.isArray(response.sessions)
        ? response.sessions as NonNullable<LiveDashboard["flashback"]>[]
        : null;
      const wallet = response.wallet && typeof response.wallet === "object"
        ? response.wallet as Partial<LiveDashboard["wallet"]>
        : null;
      updateDashboard((current) => current ? {
        ...current,
        flashback: { ...current.flashback, ...session },
        flashback_sessions: sessions || [session, ...(current.flashback_sessions || []).filter((item) => item.id !== session.id)],
        wallet: wallet ? { ...current.wallet, ...wallet } : current.wallet,
      } : current);
    }
  };
  const act = async (path: string, payload: Record<string, unknown>, onError?: (message: string) => void): Promise<boolean> => {
    const botAction = path.match(/^\/v1\/bots\/(\d+)\/actions$/);
    const actionKey = botAction
      ? `bot:${botAction[1]}:${String(payload.action || "action")}`
      : path === "/v1/demo/start"
        ? "demo:start"
        : path;
    if (isActionPending(actionKey)) return false;
    setPendingActions((current) => ({ ...current, [actionKey]: true }));
    try {
      const response = await request(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      applyActionResult(path, payload, response);
      setNotice(response.message || "Saved successfully.");
      if (path === "/v1/demo/start") {
        void load().catch(() => undefined);
      }
      return true;
    } catch (error) {
      const message = error instanceof DOMException && error.name === "AbortError"
        ? "Confirmation timed out. The request may have reached the server. Check your positions before submitting another order."
        : error instanceof Error ? error.message : "Action failed.";
      setNotice(message);
      onError?.(message);
      return false;
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
      <main className="boot-screen" aria-busy="true">
        <div className="boot-copy">
          <strong>
            TRADE<span>PULSE</span>
          </strong>
          <div className="boot-status" role="status" aria-live="polite">
            <span className="status-dot" />
            Checking your secure desk session…
          </div>
        </div>
      </main>
    );
  if (!data) return <AuthEntryPage />;
  if (!data.user.onboarding_complete)
    return <ActivationJourney data={data} request={request} onAccepted={() => updateDashboard((current) => current ? { ...current, user: { ...current.user, onboarding_complete: true } } : current)} onComplete={load} onNotice={setNotice} />;
  const gasLow = data.wallet.tank < data.wallet.tank_capacity * 0.25;
  const profileName =
    data.user.first_name || data.user.username || "Telegram user";
  const unreadNoticeCount = noticeCenter.unread;
  const visualBots: Bot[] = data.bots.map((bot) => ({
    id: bot.id,
    name: bot.product === "memecoin" ? "Memecoin" : "Synthetic Indices",
    allocation: money(bot.capital_usd),
    equity: money(bot.capital_usd),
    percent: 0,
    gain: "",
    state: bot.state === "paused" ? "paused" : "running",
    compound: bot.demo_trial || bot.demo_credit_only ? "" : `COMPOUND ${bot.compound_percent}%`,
    truth: {
      status: bot.demo_credit_only
        ? "manual trading credit"
        : bot.demo_trial
          ? `demo ${data.demo?.pool_state || data.demo?.state || bot.state}`
          : bot.state.replace(/_/g, " "),
      source: bot.demo_credit_only
        ? "Non-withdrawable trading credit"
        : bot.demo_trial
          ? "Shared virtual demo"
          : "Allocation",
    },
  }));
  const visualModel: VisualDeskModel = {
    wallet: data.wallet,
    tier: data.user.tier,
    alerts: data.alerts.length,
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
  const openIdentityUtility = () => {
    const utility = avatarOptions.find((option) => option.id === avatarId)?.id;
    if (utility === "orbit") {
      setWalletEntry("overview");
      setTab("Wallet");
    } else if (utility === "signal") {
      setTab("Desk");
    } else if (utility === "prism") {
      setWalletEntry("activity");
      setTab("Wallet");
    } else if (utility === "current") {
      setTab("Account");
      setOpenNotificationsRequest((value) => value + 1);
    } else if (utility === "vector") {
      setBotEntryId(null);
      setTab("Bots");
    } else {
      setTab("Account");
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
  };
  const workspacePresence = getWorkspacePresencePlan(reduceMotion);
  return (
    <div className="app-shell">
      <Sidebar
        active={chromeActive}
        setActive={selectChromeTab}
        profileName={profileName}
        profileTier={data.user.tier || "TradePulse account"}
        isAdmin={data.user.is_admin}
        avatarId={avatarId}
      />
      <main className="main-content">
        <Header
          setActive={selectChromeTab}
          onNotifications={noticeCenter.openNotices}
          profileName={profileName}
          environment={(tab === "Admin" && data.user.is_admin ? webEnvironment : "mainnet").toUpperCase()}
          isAdmin={data.user.is_admin}
          pageTitle={chromeActive}
          notificationCount={unreadNoticeCount}
          avatarId={avatarId}
          onAvatarClick={() => setAvatarPickerOpen(true)}
        />
        <NoticeCenter center={noticeCenter} onPreferences={() => {
          noticeCenter.setOpen(false);
          setTab("Account");
          setOpenNotificationsRequest((request) => request + 1);
        }} />
        {demoReviewOpen && data.demo?.state === "issued" && (
          <AccessibleDialog
            label="Review shared virtual demo terms"
            onClose={() => setDemoReviewOpen(false)}
            dismissible={!isActionPending("demo:start")}
          >
            <span className="eyebrow">SHARED VIRTUAL DEMO</span>
            <h2>Review virtual demo terms</h2>
            <div className="fact-block">
              <span>VIRTUAL FUNDS <b>{Number(data?.demo?.grant_usd || 0) > 0 ? money(Number(data?.demo?.grant_usd)) : "Offer unavailable"}</b></span>
              <span>ACTIVATION DEADLINE <b>{data?.demo?.expires_at ? new Date(data.demo.expires_at * 1000).toLocaleString() : "Confirmed when available"}</b></span>
              <span>FUNDING <b>Shared across Memecoin + Synthetic</b></span>
            </div>
            <p>Virtual funds are separate from your wallet and cannot be withdrawn. Memecoin Auto and Trench Mode retain their existing demo safeguards. Synthetic orders using virtual funds require manual review; Synthetic Auto requires wallet funding.</p>
            <p>A qualifying first verified mainnet deposit while this demo is active ends it immediately. Only realized demo profit may create capped, non-withdrawable trading credit. Unused virtual funds, unrealized results, and unclaimed demo profit expire at the active-demo deadline.</p>
            <button
              type="button"
              className="primary-action"
              data-dialog-initial-focus
              disabled={isActionPending("demo:start") || Number(data?.demo?.grant_usd || 0) <= 0}
              onClick={async () => {
                if (await act("/v1/demo/start", {})) setDemoReviewOpen(false);
              }}
            >
              {isActionPending("demo:start") ? "Starting…" : "Start virtual demo"}
            </button>
            <button type="button" className="ghost-action" disabled={isActionPending("demo:start")} onClick={() => setDemoReviewOpen(false)}>Go back</button>
          </AccessibleDialog>
        )}
        {avatarPickerOpen && (
          <AvatarPicker
            selected={avatarId}
            onSelect={setAvatarId}
            onConfirm={chooseAvatar}
            onClose={() => setAvatarPickerOpen(false)}
            required={avatarPickerRequired}
            locked={Boolean(data.user.avatar_id)}
            current={data.user.avatar_id as AvatarId | undefined}
            fee={Number(data.user.identity?.change_fee_usd || 10)}
            available={Number(data.wallet.available || 0)}
            pending={identityPending}
          />
        )}
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
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              className="workspace-transition"
              initial={workspacePresence.initial}
              animate={workspacePresence.enter}
              exit={workspacePresence.exit}
              transition={workspacePresence.transition}
            >
          {tab === "Dashboard" && (
            <DashboardWorkspace
              store={deskStore}
              poll={() => request("/v1/dashboard")}
              bots={visualBots}
              model={visualModel}
              onManage={() => {
                setBotEntryId(null);
                setTab("Bots");
              }}
              onStartDemo={() => setDemoReviewOpen(true)}
              onViewActivity={() => {
                setWalletEntry("activity");
                setTab("Wallet");
              }}
              onOpenBot={(bot) => {
                setBotEntryId(bot.id === undefined ? null : String(bot.id));
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
            <BotsWorkspace
              data={data}
              request={request}
              reload={load}
              onActionResult={applyActionResult}
              onNotice={setNotice}
              onOpenDemo={() => setDemoReviewOpen(true)}
              initialBotId={botEntryId}
            />
          )}
          {tab === "Wallet" && (
            <WalletWorkspace
              store={deskStore}
              poll={() => request("/v1/dashboard")}
              request={request}
              onWalletUpdate={({ wallet, withdrawal, deposits }) =>
                updateDashboard((current) =>
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
          {tab === "Desk" && (
            <DeskWorkspace
              data={data}
              request={request}
              reload={load}
              onNotice={setNotice}
            />
          )}
          {tab === "Earn" && <LiveEarnScreen data={data} />}
          {tab === "Help" && (
            <HelpWorkspace
              data={data}
              request={request}
              onNotice={setNotice}
            />
          )}
          {tab === "Account" && (
            <AccountWorkspace
              data={data}
              request={request}
              onNotice={setNotice}
              avatarId={avatarId}
              onAvatarClick={() => setAvatarPickerOpen(true)}
              onIdentityUtility={openIdentityUtility}
              openNotificationsRequest={openNotificationsRequest}
              onOpenHelp={() => setTab("Help")}
            />
          )}
          {tab === "Synthetic" && (
            <SyntheticWorkspace
              account={data}
              environment={webEnvironment}
              marketChart={MarketChart}
              onDashboardPatch={updateDashboard}
              onNotice={setNotice}
              request={request}
              store={deskStore}
            />
          )}
          {tab === "Admin" && admin && (
            <AdminWorkspace
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
          {/* Retained only as a historical reference; the live admin screen above owns these controls. */}
          {/*
          */}
          {/*
          */}
            </motion.div>
          </AnimatePresence>
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
