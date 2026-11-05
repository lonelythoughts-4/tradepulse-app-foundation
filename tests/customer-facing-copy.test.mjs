import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = [
  "components/notice-center.tsx",
  "components/session-expired-state.tsx",
  "components/tradepulse-shell.tsx",
  "components/workspaces/account-workspace.tsx",
  "components/workspaces/bots-workspace.tsx",
  "components/workspaces/desk-workspace.tsx",
  "components/workspaces/help-workspace.tsx",
  "components/workspaces/market-chart.tsx",
  "components/workspaces/protection-workspace.tsx",
  "components/workspaces/synthetic-workspace.tsx",
  "components/workspaces/wallet-workspace.tsx",
];

test("customer workspaces avoid internal and filler copy", async () => {
  const source = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
  const forbidden = [
    "privacy-safe sample threshold",
    "Trade the shared synthetic engine",
    "internally settle",
    "Auto terms are chosen privately",
    "The server confirms the final contract terms",
    "Escalate to admin",
    "admin queue",
    "future desk activation screens",
    "configured cooling period",
    "Waiting for the first verified market tick",
    "DEPOSIT / ONE-TIME ROUTE",
    "Create secure route",
    "Share the upside",
    "Action failed.",
  ];
  for (const phrase of forbidden) assert.equal(source.includes(phrase), false, phrase);
});

test("customer workspaces use clear action language", async () => {
  const source = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
  for (const phrase of [
    "Create automation",
    "Create deposit address",
    "Transaction history",
    "Contact support",
    "Waiting for live market data",
    "Sign in again",
  ]) assert.equal(source.includes(phrase), true, phrase);
});
