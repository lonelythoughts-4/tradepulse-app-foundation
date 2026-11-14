import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the active deposit flow excludes terminal deposit intents", async () => {
  const wallet = await readFile(
    new URL("../components/workspaces/wallet-workspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(wallet, /const terminalDepositStatuses = new Set\(/);
  assert.match(wallet, /const activeDeposits = data\.deposits\.filter\(/);
  assert.match(wallet, /!terminalDepositStatuses\.has\(route\.status\.toLowerCase\(\)\)/);
  assert.match(wallet, /activeDeposits\.length > 0/);
  assert.match(wallet, /activeDeposits\.map\(\(route\) =>/);
});
