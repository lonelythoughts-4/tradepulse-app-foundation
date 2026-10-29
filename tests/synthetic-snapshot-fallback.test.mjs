import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "components", "workspaces", "synthetic-workspace.tsx"), "utf8");

test("a delayed snapshot falls back to the live stream instead of showing an outage", () => {
  assert.match(source, /request\("\/v1\/synthetic\/stream\?market=" \+ market, \{\}, environment\)/);
  assert.match(source, /return \{ market, latest, ticks: \[latest\], positions: stream\.positions \|\| \[\], settings: \{\} \} as Snapshot/);
});

test("the verified live quote seeds the chart while history catches up", () => {
  assert.match(source, /const chartTicks = snapshot\?\.ticks\?\.length \? snapshot\.ticks : snapshot\?\.latest \? \[snapshot\.latest\] : \[\];/);
});
