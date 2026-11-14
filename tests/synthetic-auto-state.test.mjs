import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "components", "workspaces", "synthetic-workspace.tsx"), "utf8");
const styles = fs.readFileSync(path.join(root, "app", "globals.css"), "utf8");

test("Auto changes show a distinct pending state until the server confirms the mode", () => {
  assert.match(source, /setExecutionTransition\(payload\.execution_mode === "AUTO" \? "AUTO" : "MANUAL"\)/);
  assert.match(source, /executionTransition === "AUTO" \? "Enabling Auto…" : executionTransition === "MANUAL" \? "Switching to Manual…"/);
  assert.match(source, /execution_mode: response\.execution_mode, execution: \{ \.\.\.current\.execution, \.\.\.response \}/);
  assert.match(source, /executionCapacityRefreshing \? "Updating…" : money/);
  assert.match(source, /Capacity is refreshing\. New orders are checked against current funding before submission\./);
  assert.match(source, /value > capacity && !\(executionCapacityRefreshing && fundingSource === "wallet"\)/);
  assert.doesNotMatch(source, /if \(executionCapacityRefreshing && \(path === "\/v1\/synthetic\/orders"/);
  assert.match(source, /Saving the Auto setting\. The state changes to on only after the server confirms the allocation\./);
});

test("Auto settings and status have a dedicated responsive group", () => {
  assert.match(source, /<section className="synthetic-auto-panel" aria-labelledby="synthetic-auto-title"/);
  assert.match(source, /className="synthetic-auto-state" role="status" aria-live="polite"/);
  assert.match(source, /"Switch to Manual"/);
  assert.match(styles, /\.synthetic-auto-fields\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styles, /@media\(max-width:520px\)\{[\s\S]*?\.synthetic-auto-fields,\.synthetic-auto-capacity\{grid-template-columns:minmax\(0,1fr\)\}/);
});
