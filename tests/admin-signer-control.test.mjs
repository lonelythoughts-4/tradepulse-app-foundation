import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the admin workspace exposes the protected signer state and unlock flow", async () => {
  const source = await readFile(
    new URL("../components/workspaces/admin-workspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Protected signer/);
  assert.match(source, /request\("\/v1\/admin\/signer"/);
  assert.match(source, /type="password"/);
  assert.match(source, /name="signer-unlock-passphrase"/);
  assert.match(source, /Unlock signer/);
  assert.match(source, /cd \/home\/deploy\/tradepulse-signer &amp;&amp; python3 signerctl\.py/);
});
