"use client";

import type React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type WorkspaceIconProps = { size?: number; className?: string };
export type AvatarId = "orbit" | "signal" | "prism" | "current" | "vector" | "tide";

const iconMarkup = {
  bell: '<path d="M12 4.6 Q16.4 4.8 16.6 9.4 L16.7 13.3 Q16.8 14.9 17.9 15.4 L6.2 15.5 Q7.2 14.9 7.3 13.3 L7.4 9.2 Q7.6 4.8 12 4.6 Z"/><path d="M11 4.7 L11.2 3.6"/><path d="M10.4 17.5 Q12 18.5 13.6 17.4"/>',
  chevronRight: '<path d="M9.6 5.4 Q10.1 5.9 14.4 11.6 Q15 12.2 14.3 12.8 L9.4 18.5"/>',
  plus: '<path d="M12.1 5 L11.9 18.9"/><path d="M5.2 11.9 L18.9 12.1"/>',
  send: '<path d="M4.1 11.7 L19.4 4.4 Q20.1 4.1 19.8 4.9 L13.6 19.3 Q13.3 20 12.8 19.4 L9.6 13.6 L4.3 12.7 Q3.7 12.5 4.1 11.7 Z"/><path d="M9.6 13.6 L19.2 4.7"/>',
  shieldCheck: '<path d="M12 3.5 L18.4 5.7 Q19 5.9 18.9 6.6 L18.6 11.9 Q18.3 16.3 12.2 19.2 Q12 19.3 11.8 19.2 Q5.7 16.2 5.4 11.9 L5.1 6.6 Q5 5.9 5.7 5.7 Z"/><path d="M8.7 12.1 L10.9 14.2 L15.2 9.9"/>',
  x: '<path d="M6.1 6.3 L18 17.8"/><path d="M17.9 6.1 L6.3 18"/>',
} as const;

function FunctionalIcon({ name, size = 18, className = "" }: WorkspaceIconProps & { name: keyof typeof iconMarkup }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: iconMarkup[name] }} />;
}

type NavIconName = "wallet" | "account" | "help";
const navMarkup: Record<NavIconName, string> = {
  wallet: '<path d="M3.9 7.3 Q3.7 6.2 5 6.1 L18.8 6.4 Q20.3 6.5 20.2 7.9 L20 16.2 Q19.9 17.6 18.5 17.5 L5.1 17.3 Q3.8 17.2 3.9 15.9 Z"/><path d="M4 9.6 L20.1 9.4"/><circle cx="16.6" cy="13.4" r="1.25"/><path d="M7.2 13.2 L11.5 13.4"/>',
  account: '<path d="M9.1 9.3 Q9 6.9 12 6.7 Q15.1 6.6 15.2 8.9 Q15.3 10.7 13.5 11.4 Q12.2 11.9 12.1 13.2 L12 14.2"/><circle cx="12" cy="17" r="1.1"/>',
  help: '<circle cx="12" cy="8.2" r="2.55"/><path d="M8.5 18 Q8.7 13.9 12 13.6 Q15.3 13.9 15.5 18"/><circle cx="4.9" cy="9.4" r="1.85"/><path d="M2.5 17.7 Q2.7 14.7 4.9 14.5 Q7.1 14.8 7.2 17.8"/><circle cx="19.1" cy="9.3" r="1.85"/><path d="M16.9 17.8 Q17.1 14.7 19.2 14.5 Q21.4 14.8 21.5 17.7"/>',
};

export function NavIcon({ name, size = 22, className = "" }: { name: NavIconName; size?: number; className?: string }) {
  return <svg className={`custom-nav-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: navMarkup[name] }} />;
}

export const ChevronRight = (props: WorkspaceIconProps) => <FunctionalIcon name="chevronRight" {...props} />;
export const Bell = (props: WorkspaceIconProps) => <FunctionalIcon name="bell" {...props} />;
export const Plus = (props: WorkspaceIconProps) => <FunctionalIcon name="plus" {...props} />;
export const Send = (props: WorkspaceIconProps) => <FunctionalIcon name="send" {...props} />;
export const ShieldCheck = (props: WorkspaceIconProps) => <FunctionalIcon name="shieldCheck" {...props} />;
export const X = (props: WorkspaceIconProps) => <FunctionalIcon name="x" {...props} />;
export const Settings = (props: WorkspaceIconProps) => <NavIcon name="account" {...props} />;
export const Wallet = (props: WorkspaceIconProps) => <NavIcon name="wallet" {...props} />;

type StateIconName = "alert-triangle" | "arrow-left" | "arrow-up-right" | "bell" | "bell-off" | "check" | "copy" | "eye" | "eye-off" | "lock" | "minus" | "pause" | "play" | "plus" | "refresh";
export function StateIcon({ name, size = 18, className = "" }: WorkspaceIconProps & { name: StateIconName }) {
  return <span style={{ width: size, height: size, WebkitMaskImage: `url(/icons/${name}.svg)`, maskImage: `url(/icons/${name}.svg)` }} className={`state-icon ${className}`} aria-hidden="true" />;
}
export function StateSwapIcon({ name, swapKey = name, size = 18, className = "" }: WorkspaceIconProps & { name: StateIconName; swapKey?: string }) {
  const reduceMotion = useReducedMotion();
  return <span className={`state-icon-swap ${className}`} aria-hidden="true"><AnimatePresence initial={false} mode="wait"><motion.span key={swapKey} style={{ width: size, height: size, WebkitMaskImage: `url(/icons/${name}.svg)`, maskImage: `url(/icons/${name}.svg)` }} initial={{ opacity: reduceMotion ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: reduceMotion ? 1 : 0 }} transition={{ duration: reduceMotion ? 0 : 0.15 }} /></AnimatePresence></span>;
}

export function GradientPanel({ children, className = "", onPointerDown, onClick, onKeyDown, role, tabIndex }: { children: React.ReactNode; className?: string; onPointerDown?: React.PointerEventHandler<HTMLDivElement>; onClick?: React.MouseEventHandler<HTMLDivElement>; onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>; role?: React.AriaRole; tabIndex?: number }) {
  return <div className={`gradient-panel ${className}`} onPointerDown={onPointerDown} onClick={onClick} onKeyDown={onKeyDown} role={role} tabIndex={tabIndex}>{children}</div>;
}

export function PulseMark({ size = 34 }: { size?: number }) {
  return <svg aria-label="TradePulse mark" role="img" width={size} height={size} viewBox="0 0 40 40" fill="none"><path d="M3 21h7l3-9 6 18 5-14 3 5h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="37" cy="21" r="1.7" fill="#34D399" /></svg>;
}

export function Zap({ size = 18, className = "" }: WorkspaceIconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d="M3.4 13.2 L6.9 13 L8.4 8.6 L10.9 17 L12.9 6.9 L14.6 13.1 L20.6 12.9" /><path d="M6.9 13 L6.9 15.4" /><path d="M12.9 6.9 L12.9 4.6" /><path d="M17.4 13 L17.4 15.2" /></svg>;
}

export function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
}

const paymentMarks: Record<string, string> = {
  USDT: "usdt", USDC: "usdc", Ethereum: "ethereum", ERC20: "ethereum",
  "BNB Chain": "bnb", BEP20: "bnb", Base: "base", BASE: "base",
  Arbitrum: "arbitrum", ARBITRUM: "arbitrum", Polygon: "polygon",
  POLYGON: "polygon", Solana: "solana", SPL: "solana",
};

export function PaymentMark({ asset, compact = false }: { asset: string; compact?: boolean }) {
  const name = paymentMarks[asset] || "base";
  const isAsset = asset === "USDT" || asset === "USDC";
  const size = compact ? 16 : 18;
  return <span className={isAsset ? "coin-mark" : "network-mark"} aria-label={`${asset} logo`} role="img" style={{ width: compact ? 16 : 32, height: compact ? 16 : 32, borderRadius: 0, background: "transparent", display: compact ? "inline-grid" : "grid", verticalAlign: "middle" }}><img aria-hidden="true" alt="" src={`/icons/${name}.svg`} style={{ display: "block", width: size, height: size, objectFit: "contain" }} /></span>;
}

export const avatarOptions: Array<{ id: AvatarId; name: string; detail: string; utility: string; artifact: string }> = [
  { id: "orbit", name: "Orbit", detail: "capital keeps its horizon", utility: "Wallet quick route", artifact: "Orbital receipt seal" },
  { id: "signal", name: "Signal", detail: "read the pulse, hold the line", utility: "Live Desk quick route", artifact: "Signal-call stamp" },
  { id: "prism", name: "Prism", detail: "separate motion from noise", utility: "Activity quick route", artifact: "Prismatic field note" },
  { id: "current", name: "Current", detail: "move when the signal settles", utility: "Alerts quick route", artifact: "Current-flow mark" },
  { id: "vector", name: "Vector", detail: "make the next move legible", utility: "Bots quick route", artifact: "Vector dispatch tag" },
  { id: "tide", name: "Tide", detail: "keep a measured rhythm", utility: "Account quick route", artifact: "Tide-line token" },
];

export function PulseAvatar({ id, initials, className = "" }: { id: AvatarId; initials?: string; className?: string }) {
  return <span className={`pulse-avatar avatar-${id} ${className}`} aria-hidden="true"><img src={`/identity-assets/${id}-figure.svg`} alt="" /><i /><b>{initials?.slice(0, 1) || "T"}</b></span>;
}
