import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "components", "workspaces", "synthetic-workspace.tsx"), "utf8");
const botsSource = fs.readFileSync(path.join(root, "components", "workspaces", "bots-workspace.tsx"), "utf8");
const shellSource = fs.readFileSync(path.join(root, "components", "tradepulse-shell.tsx"), "utf8");
const styles = fs.readFileSync(path.join(root, "app", "globals.css"), "utf8");

test("funded Synthetic is Auto-managed without a Manual mode switch", () => {
  assert.match(source, /const syntheticAutoOn = syntheticBot\?\.state === "running" && Number\(syntheticBot\.capital_usd \|\| 0\) > 0/);
  assert.match(source, /const syntheticClosing = syntheticBot\?\.state === "closing"/);
  assert.match(source, /const executionStatus = syntheticBot\?\.state === "paused" \? "Paused" : syntheticClosing \? "Closing allocation" : syntheticAutoOn \? "Auto on" : "Waiting for funding"/);
  assert.match(source, /"SIM FEED · 1s"/);
  assert.match(botsSource, /bot\.state === "running" && Number\(bot\.capital_usd \|\| 0\) > 0\s+\? "Auto on"/);
  assert.doesNotMatch(source, /execution-mode|MANUAL|Enable Auto|Turn Auto off|executionModeKnown/);
  assert.doesNotMatch(botsSource, /data\.synthetic\?\.execution_mode \|\| "MANUAL"|Auto off/);
});

test("a closing bot keeps a retry action and shows product-specific close steps", () => {
  assert.match(botsSource, /isClosing \? "Finish closing bot" : "Close bot"/);
  assert.doesNotMatch(botsSource, /!isClosing && <button\s+className="danger-action"/);
  assert.match(botsSource, /Closing stops Synthetic Auto first\. It does not close simulated positions/);
  assert.match(botsSource, /Existing positions remain protected while the bot finishes closing them at executable market prices/);
});

test("the fleet keeps Auto order, latest settlement, and Memecoin customer-net summaries", () => {
  assert.match(botsSource, /data\.synthetic\?\.open_positions\?\.find\(\(position\) => position\.mode === "auto"\)/);
  assert.match(botsSource, /data\.synthetic\?\.recent_settlements\?\.\[0\]/);
  assert.match(botsSource, /data\.memecoin\?\.recent_settlements\?\.find/);
  assert.match(botsSource, /"ACTIVE AUTO ORDER"/);
  assert.match(botsSource, /"LATEST SETTLEMENT"/);
  assert.match(botsSource, /"RECENT CUSTOMER NET"/);
});

test("the fleet refreshes settlement projections while its tab is visible", () => {
  assert.match(shellSource, /if \(tab !== "Bots" \|\| !data \|\| !isDocumentVisible\) return/);
  assert.match(shellSource, /dashboardRefreshRef\.current\(webEnvironment\)/);
  assert.match(shellSource, /window\.setInterval\(refresh, 30_000\)/);
});

test("Synthetic shows recent canonical settlements separately from open positions", () => {
  assert.match(source, /function SyntheticSettlementList/);
  assert.match(source, /const recent = settlements\.slice\(0, 5\)/);
  assert.match(source, /settlement\.user_net_pnl_usd/);
  assert.match(source, /formatSettlementExitReason\(reasonValue, netPnl\)/);
  assert.match(source, /Recent closed trades/);
  assert.match(source, /View full history/);
  assert.match(source, /<SyntheticPositionList[\s\S]*?<SyntheticSettlementList/);
  assert.match(source, /response\.position\.status === "closed"[\s\S]*?recent_settlements/);
  assert.match(shellSource, /onViewActivity=\{\(\) => \{\s+setWalletEntry\("activity"\);\s+setTab\("Wallet"\);/);
});

test("Auto settings and status have a dedicated responsive group", () => {
  assert.match(source, /<section className="synthetic-auto-panel" aria-labelledby="synthetic-auto-title"/);
  assert.match(source, /className="synthetic-auto-state" role="status" aria-live="polite"/);
  assert.match(source, /typeof dailyGoalUsd === "number" && Number\.isFinite\(dailyGoalUsd\)/);
  assert.match(source, /snapshot\.execution\?\.daily_outcome === "loss"[\s\S]*?loss limit/);
  assert.match(source, /Daily Auto progress: \{money\(dailyNetUsd\)\} net.*of \{dailyTargetLabel\}\./);
  assert.match(source, /syntheticAutoOn && dailyExecutionPause/);
  assert.doesNotMatch(source, /0\.2–0\.3%|daily-loss reference|profit ceiling/);
  assert.match(source, /Auto evaluates shared signals using 100% of your funded Synthetic allocation/);
  assert.match(source, /aria-label="Auto available and locked margin"/);
  assert.match(styles, /@media\(max-width:520px\)\{[\s\S]*?\.synthetic-auto-capacity\{grid-template-columns:minmax\(0,1fr\)\}/);
});

test("Synthetic contract and action controls keep readable theme-aware states", () => {
  assert.match(styles, /\.synthetic-contract-options button\{[^}]*background:var\(--tp-surface-raised\);color:var\(--tp-ink\)/);
  assert.match(styles, /\.synthetic-contract-options button:focus-visible\{outline:2px solid var\(--tp-accent-strong\)/);
  assert.match(styles, /\.synthetic-pilot \.activity-row>\.small-action\{[^}]*min-height:44px/);
  assert.match(styles, /\.synthetic-pilot \.activity-row>\.small-action:disabled\{[^}]*opacity:1/);
});

test("shared signals are informational and manual order controls are absent", () => {
  assert.match(source, /function SyntheticSignalList/);
  assert.match(source, /shared signal/);
  assert.doesNotMatch(source, /signalSubmissions|signalResults|manualOrderPending|Approve signal/);
});

test("the mobile brand keeps its wordmark without the marked SVG", () => {
  const shell = fs.readFileSync(path.join(root, "components", "tradepulse-shell.tsx"), "utf8");
  const mobileBrand = shell.match(/<div className="mobile-brand">([\s\S]*?)<\/div>/)?.[1] || "";
  assert.match(mobileBrand, /TRADE<span>MEMO<\/span>/);
  assert.doesNotMatch(mobileBrand, /PulseMark/);
});

test("Auto reports server-confirmed daily stop states without presenting them as errors", () => {
  assert.match(source, /snapshot\.execution\?\.daily_loss_target_reached/);
  assert.match(source, /Auto entries are paused for today because the protective daily loss limit was reached\./);
  assert.match(source, /Today's Auto goal is reached\. New entries are paused until the next session\./);
  assert.match(source, /syntheticAutoOn && dailyExecutionPause && <p className="synthetic-auto-hint" role="status">/);
  assert.doesNotMatch(source, /A protective loss-streak check is blocking new entries/);
});
