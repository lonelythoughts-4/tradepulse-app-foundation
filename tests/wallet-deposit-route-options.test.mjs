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
  assert.match(wallet, /t\("Temporarily unavailable · \{asset\} only", \{ asset: route\.asset \}\)/);
  assert.match(wallet, /"ETH", "BNB", "SOL", "MATIC"/);
  assert.match(wallet, /ETH: "Ether"/);
  assert.match(wallet, /SOL_DEVNET: "Solana Devnet"/);
  assert.match(wallet, /depositNetworkName\(intent\.chain\)/);
  assert.match(wallet, /error\.name === "AbortError"/);
  assert.match(shell, /Monitoring started\. The background watcher will check this address/);
  assert.match(shell, /const walletEnvironment = data\.user\.is_admin \? webEnvironment : "mainnet"/);
  assert.match(shell, /<WalletWorkspace[\s\S]*?environment=\{walletEnvironment\}/);
  assert.match(shell, /poll=\{\(signal\) => request\("\/v1\/dashboard", \{ signal \}, walletEnvironment\)\}/);
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

test("the deposit button does not pass its click event into the route payload", async () => {
  const wallet = await readFile(
    new URL("../components/workspaces/wallet-workspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(wallet, /onClick=\{\(\) => void createRoute\(\)\}/);
  assert.doesNotMatch(wallet, /onClick=\{createRoute\}/);
});

test("wallet actions use readable labels and route choices have distinct, equal-size actions", async () => {
  const wallet = await readFile(
    new URL("../components/workspaces/wallet-workspace.tsx", import.meta.url),
    "utf8",
  );
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(wallet, /t\("Withdraw"\)/);
  assert.match(wallet, /t\("Transaction history"\)/);
  assert.doesNotMatch(wallet, /t\("WITHDRAW"\)/);
  assert.doesNotMatch(wallet, /t\("WALLET \/ HISTORY"\)/);
  assert.match(wallet, /t\("Use existing address on \{network\}"/);
  assert.match(wallet, /t\("Create separate route on \{network\}"/);
  assert.match(wallet, /t\("Back to network selection"\)/);
  assert.match(wallet, /disabled=\{routeCreatePending\}/);
  assert.match(wallet, /disabled=\{depositCheckPending\}/);
  assert.doesNotMatch(wallet, /depositPending/);
  assert.match(styles, /\.route-choice-actions\s*\{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 520px\) \{\s*\.route-choice-actions\s*\{\s*grid-template-columns: minmax\(0, 1fr\)/);
});
