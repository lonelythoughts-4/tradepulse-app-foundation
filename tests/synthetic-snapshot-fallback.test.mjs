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

test("Bots hides disabled Demo accounts and Flashback has a separate workspace", () => {
  assert.match(botsSource, /\.filter\(\(bot\) => !bot\.demo_trial && !bot\.demo_credit_only/);
  assert.doesNotMatch(botsSource, /fleet-flashback-action|Open Flashback|SHARED VIRTUAL DEMO/);
  assert.match(flashbackWorkspace, /initialView="flashback"\s+flashbackOnly/);
  assert.match(shellSource, /label: "Flashback"/);
  assert.match(shellSource, /<FlashbackWorkspace/);
});

test("a delayed account snapshot keeps its last verified value and reports staleness", () => {
  assert.match(source, /request\("\/v1\/synthetic\/" \+ market \+ "\?view=trading"/);
  assert.match(source, /setLoadError\(error instanceof Error \? error\.message : "Market data is temporarily unavailable\."\);\s+return undefined;/);
  assert.match(source, /useResourcePoller<Snapshot>/);
});

test("the visible fast stream updates quotes without overwriting verified account details", () => {
  assert.match(source, /useResourcePoller<Record<string, unknown>>/);
  assert.match(source, /1000, true, `synthetic-quotes:\$\{environment\}:\$\{market\}`/);
  assert.match(source, /positions: base\.partial && Array\.isArray\(stream\.positions\) \? stream\.positions : base\.positions/);
  assert.match(source, /current\?\.market === market\s+\? current\s+: \{ market, partial: true, latest, ticks: \[latest\], positions: \[\], settings: \{\} \} as Snapshot/);
  assert.match(source, /snapshot\.partial \? <div className="activity-row" role="status"/);
  assert.match(source, /if \(!snapshot \|\| snapshot\.partial \|\| environment !== "mainnet"\) return;/);
  assert.match(source, /if \(snapshot\?\.partial\) \{ onNotice\("Account and trading details are still loading\./);
});

test("the verified live quote seeds the chart while history catches up", () => {
  assert.match(source, /const chartTicks = snapshot\?\.ticks\?\.length \? snapshot\.ticks : snapshot\?\.latest \? \[snapshot\.latest\] : \[\];/);
  assert.match(source, /snapshot\.history_available === false && <p role="status">Chart history is delayed\. The live quote remains current\./);
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
