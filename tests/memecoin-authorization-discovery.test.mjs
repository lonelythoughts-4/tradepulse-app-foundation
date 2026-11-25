import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../components/workspaces/bots-workspace.tsx", import.meta.url),
  "utf8",
);

test("Memecoin creation collects risk acknowledgement and starts Auto with Trench enabled", () => {
  assert.match(source, /checked=\{memecoinRiskAcknowledged\}/);
  assert.match(source, /live_risk_acknowledged: memecoinRiskAcknowledged/);
  assert.match(source, /ON AFTER CREATION/);
  assert.match(source, /TRENCH MODE <b>ON · CORE TOKENS INCLUDED<\/b>/);
  assert.match(source, /100% OF ALLOCATION, INCLUDING TOP-UPS/);
  assert.doesNotMatch(source, /Slot #1 is scheduled|first simulated entry is scheduled/);
  assert.match(source, /I understand and accept the Memecoin Auto and Trench Mode risks/);
  assert.match(source, /simulation rolls a \+2% to \+4% daily win target/);
});

test("Memecoin workspace retains monitoring and account actions without strategy/order controls", () => {
  assert.match(source, /LIVE MARKET CHART/);
  assert.match(source, /Close position/);
  assert.match(source, /Pause bot/);
  assert.match(source, /Resume bot/);
  assert.match(source, /Top up allocation/);
  assert.match(source, /\[0, 50, 100\]/);
  assert.match(source, /Close bot/);
  assert.doesNotMatch(source, /Review manual order/);
  assert.doesNotMatch(source, /Long & Short manual entry/);
  assert.doesNotMatch(source, /Browse eligible markets/);
  assert.doesNotMatch(source, /Include Trench Mode/);
  assert.doesNotMatch(source, /Automatic entries/);
  assert.doesNotMatch(source, /Authorize your funded Memecoin bot/);
});
