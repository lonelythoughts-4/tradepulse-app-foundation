import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Bot Fleet owns first-automation setup while Dashboard links only to management", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );
  const botsWorkspace = await readFile(
    new URL("../components/workspaces/bots-workspace.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(shell, /onChooseStrategy/);
  assert.doesNotMatch(shell, /Pick a strategy/);
  assert.match(shell, /<button className="view-all" onClick={onManage}>\s*Manage/);
  assert.doesNotMatch(shell, /tab === "Dashboard" && !data\.bots\.length/);
  assert.match(botsWorkspace, /<h2>Set up your first automation<\/h2>/);
  assert.match(botsWorkspace, /Choose Memecoin or Synthetic Indices when at least \$20 is available\./);
  assert.match(botsWorkspace, /Choose a strategy/);
  assert.match(botsWorkspace, /EmptyBots onLaunch=\{\(\) => setView\("create"\)\}/);
});
