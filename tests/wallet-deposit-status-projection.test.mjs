import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("customer wallet statuses do not expose internal sweep stages", async () => {
  const wallet = await readFile(
    new URL("../components/workspaces/wallet-workspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(wallet, /sweep_confirming:\s*"Processing deposit"/);
  assert.match(wallet, /sweeping:\s*"Processing deposit"/);
  assert.match(wallet, /under_review:\s*"Under review"/);
  assert.doesNotMatch(wallet, /sweep_confirming:\s*"Confirming sweep"/);
});
