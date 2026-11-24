import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the deposit history keeps review and expired routes openable", async () => {
  const wallet = await readFile(
    new URL("../components/workspaces/wallet-workspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(wallet, /const terminalDepositStatuses = new Set\(/);
  assert.match(wallet, /const activeDeposits = data\.deposits\.filter\(/);
  assert.match(wallet, /route\.status\.toLowerCase\(\) !== "credited_and_closed"/);
  assert.match(wallet, /depositStatusTone\(route\.status\)/);
  assert.match(wallet, /activeDeposits\.length > 0/);
  assert.match(wallet, /activeDeposits\.map\(\(route\) =>/);
});
