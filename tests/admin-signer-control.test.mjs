import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the admin workspace exposes a retractable protected signer control", async () => {
  const source = await readFile(
    new URL("../components/workspaces/admin-workspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Protected signer/);
  assert.match(source, /request\("\/v1\/admin\/signer"/);
  assert.match(source, /type="password"/);
  assert.match(source, /name="signer-unlock-pin"/);
  assert.match(source, /action: "unlock", pin/);
  assert.match(source, /action: "lock"/);
  assert.match(source, /setSignerPin\(""\)/);
  assert.match(source, /Unlock signer/);
  assert.match(source, /Lock signer/);
  assert.match(source, /<details className="admin-table signer-control" aria-labelledby="signer-control-title">/);
  assert.match(source, /<summary className="signer-control-reserve-summary">/);
  assert.match(source, /<div className="signer-control-body">/);
  assert.doesNotMatch(source, /<details className="admin-table signer-control"[^>]*open/);
  assert.match(source, /request\("\/v1\/admin\/gas-vaults", \{\}, environment, 60_000\)/);
  assert.match(source, /actionKey\.startsWith\("sweep:"\) \? 58_000 : 15_000/);
  assert.match(source, /Network gas reserves/);
  assert.match(source, /<details className="admin-table signer-control" aria-labelledby="gas-reserves-title">/);
  assert.match(source, /<summary className="signer-control-reserve-summary">/);
  assert.doesNotMatch(source, /<details className="admin-table signer-control"[^>]*open/);
  assert.match(source, /transfers\s+only the needed amount\. EVM transfers\s+include a dynamic fee margin; there is no fixed\s+top-up/);
  assert.match(source, /disabled=\{gasVaultsPending\}/);
  assert.match(source, /Copy address/);
  assert.match(source, /gasVaultCopyPending\[vault\.chain\]/);
  assert.match(source, /setSignerStatus\("locked"\);\s*setSignerError\(error instanceof Error \? error\.message/);
  assert.doesNotMatch(source, /localStorage.*signer|sessionStorage.*signer/);
});
