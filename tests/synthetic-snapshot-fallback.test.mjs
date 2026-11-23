import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "components", "workspaces", "synthetic-workspace.tsx"), "utf8");
const botsSource = fs.readFileSync(path.join(root, "components", "workspaces", "bots-workspace.tsx"), "utf8");
const flashbackWorkspace = fs.readFileSync(path.join(root, "components", "workspaces", "flashback-workspace.tsx"), "utf8");
const shellSource = fs.readFileSync(path.join(root, "components", "tradepulse-shell.tsx"), "utf8");
const adminSource = fs.readFileSync(path.join(root, "components", "workspaces", "admin-workspace.tsx"), "utf8");

test("Bots hides disabled Demo accounts and Flashback has a separate workspace", () => {
  assert.match(botsSource, /\.filter\(\(bot\) => !bot\.demo_trial && !bot\.demo_credit_only/);
  assert.doesNotMatch(botsSource, /fleet-flashback-action|Open Flashback|SHARED VIRTUAL DEMO/);
  assert.match(flashbackWorkspace, /initialView="flashback"\s+flashbackOnly/);
  assert.match(shellSource, /label: "Flashback"/);
  assert.match(shellSource, /<FlashbackWorkspace/);
});

test("a delayed account snapshot keeps its last verified value and surfaces refresh errors", () => {
  assert.match(source, /request\("\/v1\/synthetic\/" \+ market \+ "\?view=trading"/);
  assert.match(source, /setLoadError\(error instanceof Error \? error\.message : "Market data is temporarily unavailable\."\);\s+return undefined;/);
  assert.match(source, /useResourcePoller<Snapshot>/);
  assert.match(source, /const snapshot = storedSnapshot\?\.market === market \? storedSnapshot : fallbackSnapshot;/);
  assert.match(source, /syntheticResourceKey\(environment, market\)/);
  assert.match(source, /loadError && <p role="status">\{loadError\} Action requests are checked against the current server state\.<\/p>/);
});

test("Synthetic separates Auto available margin from locked margin and does not repeat accepted risk acknowledgement", () => {
  assert.match(source, /Auto available/);
  assert.match(source, /Auto locked margin/);
  assert.match(source, /execution\?\.(auto_locked_usd)/);
  assert.match(source, /!snapshot\.live_disclosure_accepted/);
  assert.match(source, /response\.accepted/);
  assert.doesNotMatch(source, /latestAuto|autoActivityTitle|autoActivityDetail/);
});

test("Synthetic Auto rejections are exposed in the admin workspace only", () => {
  assert.match(adminSource, /request\("\/v1\/admin\/synthetic-auto-rejections", \{\}, environment\)/);
  assert.match(adminSource, /Recent Auto rejections/);
  assert.match(adminSource, /Admin-only diagnostics/);
  assert.match(adminSource, /event\.reason/);
  assert.doesNotMatch(source, /auto_rejections|auto_signal_rejected/);
});

test("one-second quote updates stay separate from account controls", () => {
  assert.match(source, /useResourcePoller<Record<string, unknown>>/);
  assert.match(source, /1000, true, `synthetic-quotes:\$\{environment\}:\$\{market\}`/);
  assert.match(source, /store\.applyResource\("syntheticQuotes",/);
  assert.match(source, /\/v1\/synthetic\/stream\?market=" \+ market \+ "&include_history=1/);
  assert.match(source, /history_stale: stream\.history_stale === true/);
  assert.match(source, /const quotes = useDeskSelector\(store, selectQuotes\);/);
  assert.match(source, /const current = allSnapshots\[resourceKey\] \?\? null;/);
  assert.match(source, /const MemoizedSyntheticMarketData = memo\(SyntheticMarketData\);/);
  assert.doesNotMatch(source, /positions: base\.partial && Array\.isArray\(stream\.positions\)/);
  assert.doesNotMatch(source, /snapshot\.partial \? <div className="activity-row" role="status"/);
  assert.doesNotMatch(source, /if \(snapshot\?\.partial\) \{ onNotice\(/);
  assert.doesNotMatch(source, /value > capacity/);
  assert.match(source, /Set aside at least/);
  assert.doesNotMatch(source, /manualOrderPending|disabled=\{manualOrderPending/);
});

test("the chart retains same-market cached ticks and rejects a late market response", () => {
  assert.match(source, /snapshot\.market === market \? snapshot\.ticks : \[\]/);
  assert.match(source, /if \(market !== marketRef\.current\) return;\s+const latest = stream\.latest as Snapshot\["latest"\];/);
  assert.match(source, /latest\?\.market && latest\.market !== market/);
  assert.match(source, /Chart history is delayed\. The latest available quote is shown\./);
  assert.match(source, /Chart history is delayed\. Showing the last verified ticks and current quote\./);
  assert.match(source, /Position data is delayed; recent positions may be stale or unavailable\./);
});

test("a one-tick chart keeps the current price visible across the plot", () => {
  const shell = fs.readFileSync(path.join(root, "components", "tradepulse-shell.tsx"), "utf8");
  assert.match(shell, /candles\.length === 1 && <path d=\{`M0 \$\{y\(candles\[0\]\.close\)\}H\$\{chartWidth\}`\}/);
});

test("the dashboard chart uses the lightweight market stream", () => {
  const shell = fs.readFileSync(path.join(root, "components", "tradepulse-shell.tsx"), "utf8");
  assert.match(shell, /request\("\/v1\/synthetic\/stream\?market=SYN-25&include_history=1"\)/);
  assert.match(shell, /snapshot\.ticks\?\.length \? snapshot\.ticks : snapshot\.latest \? \[snapshot\.latest\] : \[\]/);
});

test("the operations desk identifies a cached overview while the API recovers", () => {
  const shell = fs.readFileSync(path.join(root, "components", "tradepulse-shell.tsx"), "utf8");
  assert.match(shell, /admin\.stale && <p role="status">Last verified operations data is shown/);
});
