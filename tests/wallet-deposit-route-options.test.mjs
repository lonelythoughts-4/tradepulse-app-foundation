import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the wallet loads deposit asset/network pairs from the selected environment", async () => {
  const wallet = await readFile(
    new URL("../components/workspaces/wallet-workspace.tsx", import.meta.url),
    "utf8",
  );
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );

  assert.match(wallet, /request\("\/v1\/deposits\/routes", \{\}, environment\)/);
  assert.match(wallet, /const depositNetworks = depositRoutes\.filter\(\(route\) => route\.asset === asset\)/);
  assert.match(wallet, /depositNetworks\.map\(\(route\) =>/);
  assert.match(wallet, /No deposit routes are currently available in \{environment\}/);
  assert.match(shell, /<WalletWorkspace[\s\S]*?environment=\{data\.user\.is_admin \? webEnvironment : "mainnet"\}/);
});
