import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../components/workspaces/wallet-workspace.tsx", import.meta.url),
  "utf8",
);

test("Wallet activity refreshes the dashboard ledger while Wallet is active", () => {
  const pollerStart = source.indexOf("useResourcePoller(");
  const pollerEnd = source.indexOf("\n  );", pollerStart);
  assert.notEqual(pollerStart, -1);
  assert.notEqual(pollerEnd, -1);

  const pollerCall = source.slice(pollerStart, pollerEnd);
  assert.match(pollerCall, /,\s*[1-9][\d_]*,\s*true,/);
  assert.match(pollerCall, /`wallet-dashboard:\$\{environment\}`/);
  assert.match(pollerCall, /"Wallet"/);
  assert.match(source, /data\.ledger\.length/);
});
