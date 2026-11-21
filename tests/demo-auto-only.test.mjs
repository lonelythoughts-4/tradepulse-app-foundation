import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const bots = fs.readFileSync(path.join(root, "components", "workspaces", "bots-workspace.tsx"), "utf8");
const synthetic = fs.readFileSync(path.join(root, "components", "workspaces", "synthetic-workspace.tsx"), "utf8");

test("disabled Demo bots and controls stay out of customer bot views", () => {
  assert.match(bots, /\.filter\(\(bot\) => !bot\.demo_trial && !bot\.demo_credit_only/);
  assert.doesNotMatch(bots, /isDemoBot|Automatic entries: \{isDemoBot/);
});

test("Synthetic does not offer the active demo pool as manual order funding", () => {
  assert.doesNotMatch(synthetic, />Demo pool ·/);
  assert.doesNotMatch(synthetic, /fundingSource === "demo"/);
});
