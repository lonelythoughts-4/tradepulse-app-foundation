import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "components", "workspaces", "bots-workspace.tsx"), "utf8");

test("Synthetic creation requires risk acknowledgement and starts full-allocation Auto", () => {
  assert.match(source, /product === "synthetic" && data\.environment === "mainnet" && <label className="toggle-row"/);
  assert.match(source, /checked=\{syntheticRiskAcknowledged\}/);
  assert.match(source, /live_risk_acknowledged: syntheticRiskAcknowledged/);
  assert.match(source, /product === "synthetic" && <span>AUTO EXECUTION <b>ON AFTER CREATION<\/b><\/span>/);
  assert.match(source, /Future Synthetic top-ups are also available to Auto/);
});
