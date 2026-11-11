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
  assert.match(wallet, /disabled=\{!route\.available\}/);
  assert.match(wallet, /Temporarily unavailable · \$\{route\.asset\} only/);
  assert.match(wallet, /"ETH", "BNB", "SOL", "MATIC"/);
  assert.match(wallet, /ETH: "Ether"/);
  assert.match(wallet, /SOL_DEVNET: "Solana Devnet"/);
  assert.match(wallet, /depositNetworkName\(intent\.chain\)/);
  assert.match(shell, /<WalletWorkspace[\s\S]*?environment=\{data\.user\.is_admin \? webEnvironment : "mainnet"\}/);
  for (const [assetOrNetwork, icon] of [
    ["ETH_SEPOLIA", "ethereum"],
    ["BNB_TESTNET", "bnb"],
    ["POLYGON_AMOY", "polygon"],
    ["SOL_DEVNET", "solana"],
  ]) {
    assert.match(
      shell,
      new RegExp(`${assetOrNetwork}: "${icon}"`),
      `${assetOrNetwork} should use the existing ${icon} mark`,
    );
  }
});
