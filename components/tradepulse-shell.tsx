'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  ChevronRight,
  CircleHelp,
  Coins,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Settings,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react'

const ease = [0.16, 1, 0.3, 1] as const

function PulseMark({ size = 34 }: { size?: number }) {
  return (
    <svg aria-label="TradePulse mark" role="img" width={size} height={size} viewBox="0 0 40 40" fill="none">
      <motion.path d="M3 21h7l3-9 6 18 5-14 3 5h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.15, ease }} />
      <motion.circle cx="37" cy="21" r="1.7" fill="#34D399" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.95, ease }} />
    </svg>
  )
}

function GradientPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`gradient-panel ${className}`}>{children}</div>
}

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Bots', icon: Zap },
  { label: 'Wallet', icon: Wallet },
  { label: 'Earn', icon: Coins },
  { label: 'Account', icon: Settings },
]

function BootScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const steps = ['verifying session…', 'syncing ledger…', 'loading desk…']
  useEffect(() => {
    const interval = window.setInterval(() => setStep((current) => Math.min(current + 1, 2)), 650)
    const done = window.setTimeout(onComplete, 2400)
    return () => { window.clearInterval(interval); window.clearTimeout(done) }
  }, [onComplete])
  return <motion.div className="boot-screen" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.65, ease }}>
    <div className="boot-mark"><PulseMark size={76} /></div>
    <motion.div className="boot-line" initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ delay: 1.05, duration: 0.7, ease }} />
    <div className="boot-copy"><strong>TRADE<span>PULSE</span></strong><div className="boot-status"><span className="status-dot" />{steps[step]}</div></div>
  </motion.div>
}

function Sidebar({ active, setActive }: { active: string; setActive: (value: string) => void }) {
  return <aside className="sidebar">
    <div className="brand"><PulseMark /><span>TRADE<span>PULSE</span></span></div>
    <div className="desk-label">WORKSPACE</div>
    <nav className="side-nav">{navItems.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => setActive(label)}><Icon size={18} strokeWidth={2} /><span>{label}</span>{active === label && <motion.i layoutId="side-pill" />}</button>)}</nav>
    <div className="sidebar-bottom"><button className="nav-item"><CircleHelp size={18} /><span>Help center</span></button><div className="profile"><div className="avatar">JD</div><div><strong>Jordan Davis</strong><small>Pro account</small></div><MoreHorizontal size={17} /></div></div>
  </aside>
}

function BottomNav({ active, setActive }: { active: string; setActive: (value: string) => void }) {
  return <nav className="bottom-nav">{navItems.map(({ label, icon: Icon }) => <button key={label} className={`bottom-item ${active === label ? 'active' : ''}`} onClick={() => setActive(label)}><span className="bottom-icon">{active === label && <motion.i layoutId="bottom-pill" transition={{ type: 'spring', stiffness: 380, damping: 30 }} /> }<Icon size={19} /></span>{active === label && <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25, ease }}>{label}</motion.span>}</button>)}</nav>
}

function Header({ title }: { title: string }) {
  return <header className="topbar"><div className="mobile-brand"><PulseMark size={27} /><span>TRADE<span>PULSE</span></span></div><div className="page-heading"><span className="eyebrow">OVERVIEW</span><h1>{title}</h1></div><div className="top-actions"><div className="live-indicator"><i />LIVE <span>●</span></div><button className="icon-button notification"><Bell size={18} /><b>3</b></button><div className="top-avatar">JD</div></div></header>
}

function Overview() {
  return <div className="content-grid">
    <GradientPanel className="balance-card"><div className="panel-heading"><div><span className="eyebrow">TOTAL BALANCE</span><button className="visibility">•••</button></div><span className="positive-chip">+12.84%</span></div><div className="balance">$24,892<span>.42</span></div><div className="balance-change"><ArrowUpRight size={16} />$2,836.12 <span>this month</span></div><div className="sparkline"><svg viewBox="0 0 600 104" preserveAspectRatio="none" aria-label="Balance growth chart"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#34D399" stopOpacity=".23" /><stop offset="1" stopColor="#34D399" stopOpacity="0" /></linearGradient></defs><path d="M0 80 C35 78 42 72 62 75 S95 53 115 64 S153 56 176 61 S208 45 235 51 S263 65 285 45 S320 48 345 35 S373 43 398 30 S427 42 452 24 S480 33 505 19 S550 27 600 7 V104 H0Z" fill="url(#area)" /><path d="M0 80 C35 78 42 72 62 75 S95 53 115 64 S153 56 176 61 S208 45 235 51 S263 65 285 45 S320 48 345 35 S373 43 398 30 S427 42 452 24 S480 33 505 19 S550 27 600 7" fill="none" stroke="#34D399" strokeWidth="2" /></svg></div><div className="range"><span>1D</span><span>1W</span><span className="selected">1M</span><span>3M</span><span>1Y</span><span>ALL</span></div></GradientPanel>
    <GradientPanel className="quick-card"><div className="panel-heading"><span className="eyebrow">QUICK ACTIONS</span><MoreHorizontal size={17} /></div><div className="actions"><button><span className="action-icon violet"><ArrowUpRight size={18} /></span><strong>Deposit</strong><small>Add funds</small></button><button><span className="action-icon green"><Wallet size={18} /></span><strong>Withdraw</strong><small>Move funds</small></button><button><span className="action-icon blue"><BarChart3 size={18} /></span><strong>Analytics</strong><small>View performance</small></button></div><div className="secure-row"><ShieldCheck size={16} /><span>Funds secured by TradePulse custody</span><ChevronRight size={15} /></div></GradientPanel>
    <GradientPanel className="activity-card"><div className="panel-heading"><div><span className="eyebrow">RECENT ACTIVITY</span><h2>Ledger activity</h2></div><button className="view-all">View all <ArrowUpRight size={14} /></button></div><div className="activity-list">{[['Deposit received','USDC · Wallet','+$1,250.00','2 min ago','deposit'],['Momentum Bot','BTC/USDT · Trade','+$84.20','18 min ago','trade'],['Network fee','Ethereum · Fee','-$2.48','1 hr ago','fee']].map(([title, sub, amount, time, type]) => <div className="activity-row" key={title}><div className={`activity-icon ${type}`}>{type === 'deposit' ? <ArrowUpRight size={16} /> : type === 'trade' ? <Zap size={16} /> : <Coins size={16} />}</div><div className="activity-info"><strong>{title}</strong><small>{sub}</small></div><div className="activity-amount"><strong className={amount.startsWith('+') ? 'up' : 'down'}>{amount}</strong><small>{time}</small></div></div>)}</div></GradientPanel>
    <GradientPanel className="bots-card"><div className="panel-heading"><div><span className="eyebrow">ACTIVE BOTS</span><h2>Trading desk</h2></div><button className="view-all">Manage <ArrowUpRight size={14} /></button></div><div className="bot-row"><div className="bot-status"><i /> <div><strong>Momentum Bot</strong><small>BTC / USDT · High frequency</small></div></div><div className="bot-pnl"><strong>+$426.80</strong><small>+8.42%</small></div></div><div className="bot-row"><div className="bot-status"><i /> <div><strong>Yield Optimizer</strong><small>USDC · Conservative</small></div></div><div className="bot-pnl"><strong>+$118.24</strong><small>+4.09%</small></div></div></GradientPanel>
  </div>
}

export default function TradePulseShell() {
  const [booted, setBooted] = useState(false)
  const [active, setActive] = useState('Dashboard')
  return <AnimatePresence mode="wait">{!booted ? <BootScreen key="boot" onComplete={() => setBooted(true)} /> : <motion.div key="app" className="app-shell" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease }}><Sidebar active={active} setActive={setActive} /><main className="main-content"><Header title={active} />{active === 'Dashboard' ? <Overview /> : <GradientPanel className="empty-state"><Sparkles size={24} /><h2>{active} is ready</h2><p>Your workspace will appear here.</p></GradientPanel>}</main><BottomNav active={active} setActive={setActive} /></motion.div>}</AnimatePresence>
}
