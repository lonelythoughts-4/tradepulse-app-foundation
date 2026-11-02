import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const bots = fs.readFileSync(path.join(root, "components", "workspaces", "bots-workspace.tsx"), "utf8");
const synthetic = fs.readFileSync(path.join(root, "components", "workspaces", "synthetic-workspace.tsx"), "utf8");

test("active demo Memecoin controls are automatic-only", () => {
  assert.match(bots, /Automatic entries: \{isDemoBot \? "Always on"/);
  assert.match(bots, /!isDemoBot && \(selected\.state === "running" \|\| isDemoCreditOnlyBot\)/);
  assert.match(bots, /auto_enabled: isDemoBot \? true : memecoinAutoEnabled/);
});

test("Synthetic does not offer the active demo pool as manual order funding", () => {
  assert.doesNotMatch(synthetic, />Demo pool ·/);
  assert.match(synthetic, /Your active demo never places manual orders\./);
  assert.doesNotMatch(synthetic, /fundingSource === "demo"/);
});
