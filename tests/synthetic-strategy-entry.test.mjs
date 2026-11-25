import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [synthetic, shell, bots] = await Promise.all([
  readFile(new URL("../components/workspaces/synthetic-workspace.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/tradepulse-shell.tsx", import.meta.url), "utf8"),
  readFile(new URL("../components/workspaces/bots-workspace.tsx", import.meta.url), "utf8"),
]);

test("first-time traders can open the strategy and allocation chooser from Synthetic", () => {
  assert.match(synthetic, /account\.ledger\.some\(\(entry\) => Boolean\(entry\.trade_detail\)\)/);
  assert.match(synthetic, /account\.memecoin\?\.recent_settlements\?\.length/);
  assert.match(synthetic, /account\.synthetic\?\.recent_settlements\?\.length/);
  assert.match(synthetic, /account\.synthetic\?\.open_positions\?\.length/);
  assert.match(synthetic, /snapshot\.positions\.length > 0/);
  assert.match(synthetic, /hasStartedTradeThisSession/);
  assert.match(synthetic, /environment === "mainnet" && account\.bots\.length === 0 && !hasTradeHistory && !snapshotPending/);
  assert.match(synthetic, /Pick a strategy/);

  assert.match(shell, /const openBotStrategyPicker = \(\) => \{\s*setBotEntryId\(null\);\s*setBotEntryView\("create"\);\s*setTab\("Bots"\);\s*\};/);
  assert.match(shell, /onPickStrategy=\{openBotStrategyPicker\}/);
  assert.match(shell, /initialView=\{botEntryView\}/);
  assert.match(bots, /<h2>Choose a product<\/h2>/);
  assert.match(bots, /name="Memecoin"/);
  assert.match(bots, /name="Synthetic Indices"/);
  assert.match(bots, /aria-label="Allocation amount"/);
});
