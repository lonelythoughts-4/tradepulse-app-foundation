import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Dashboard opens the existing bot strategy picker directly", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );
  const botsWorkspace = await readFile(
    new URL("../components/workspaces/bots-workspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(shell, /<button className="primary-action" onClick={onChooseStrategy}>\s*Pick a strategy/);
  assert.match(shell, /const openStrategyPicker = \(\) => \{\s*setBotEntryId\(null\);\s*setBotEntryView\("create"\);\s*setTab\("Bots"\);\s*\};/);
  assert.match(shell, /onChooseStrategy=\{openStrategyPicker\}/);
  assert.match(shell, /initialView=\{botEntryView\}/);
  assert.match(botsWorkspace, /initialView\?: "fleet" \| "create" \| "flashback"/);
});
