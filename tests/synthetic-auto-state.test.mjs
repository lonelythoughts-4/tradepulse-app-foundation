import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "components", "workspaces", "synthetic-workspace.tsx"), "utf8");
const styles = fs.readFileSync(path.join(root, "app", "globals.css"), "utf8");

test("Auto changes show a distinct pending state until the server confirms the mode", () => {
  assert.match(source, /setExecutionTransition\(payload\.execution_mode === "AUTO" \? "AUTO" : "MANUAL"\)/);
  assert.match(source, /executionTransition === "AUTO" \? "Enabling Auto…" : executionTransition === "MANUAL" \? "Turning Auto off…"/);
  assert.match(source, /execution_mode: response\.execution_mode, execution: \{ \.\.\.current\.execution, \.\.\.response \}/);
  assert.match(source, /executionCapacityRefreshing \? "Updating…" : money/);
  assert.match(source, /Capacity is refreshing\. New orders are checked against current funding before submission\./);
  assert.doesNotMatch(source, /kind !== "auto" && value > capacity && !executionCapacityRefreshing/);
  assert.match(source, /!Number\.isFinite\(reserved\) \|\| reserved < value/);
  assert.doesNotMatch(source, /if \(executionCapacityRefreshing && \(path === "\/v1\/synthetic\/orders"/);
  assert.match(source, /Saving the Auto setting\. The state changes to on only after the server confirms the allocation\./);
});

test("Auto settings and status have a dedicated responsive group", () => {
  assert.match(source, /<section className="synthetic-auto-panel" aria-labelledby="synthetic-auto-title"/);
  assert.match(source, /className="synthetic-auto-state" role="status" aria-live="polite"/);
  assert.match(source, /"Turn Auto off"/);
  assert.match(source, /typeof dailyGoalUsd === "number" && Number\.isFinite\(dailyGoalUsd\)/);
  assert.match(source, /Daily Auto progress: \{money\(Number\(snapshot\.execution\?\.daily_settled_net_pnl_usd \|\| 0\)\)\} settled of \{money\(dailyGoalUsd\)\} goal/);
  assert.doesNotMatch(source, /0\.2–0\.3%|daily-loss reference|profit ceiling/);
  assert.match(styles, /\.synthetic-auto-fields\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styles, /@media\(max-width:520px\)\{[\s\S]*?\.synthetic-auto-fields,\.synthetic-auto-capacity\{grid-template-columns:minmax\(0,1fr\)\}/);
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

test("Auto activity explains when a risk circuit breaker blocks new entries", () => {
  assert.match(source, /A protective loss-streak check is blocking new entries/);
  assert.doesNotMatch(source, /The 1% daily-loss reference was reached/);
  assert.match(source, /"Auto entries paused"/);
});
