import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("all deposit follow-up calls stay bound to the selected environment", async () => {
  const wallet = await readFile(
    new URL("../components/workspaces/wallet-workspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(wallet, /request\(`\/v1\/deposits\/\$\{intent\.id\}\/qr`\s*,\s*\{\}\s*,\s*environment\)/);
  assert.match(wallet, /requestRef\.current\("\/v1\/dashboard",\s*\{\}\s*,\s*environment\)/);
  assert.match(wallet, /`\/v1\/deposits\/\$\{intent\.id\}\/watch`\s*,\s*\{ method: "POST", body: "\{\}" \}\s*,\s*environment/);
});

test("the duplicate Vercel hostname redirects to the canonical desk", async () => {
  const middlewareUrl = new URL("../middleware.ts", import.meta.url);
  const exists = await access(middlewareUrl).then(() => true, () => false);
  assert.equal(exists, true);
  const middleware = await readFile(middlewareUrl, "utf8");

  assert.match(middleware, /tradepulse-app-foundation-github\.vercel\.app/);
  assert.match(middleware, /tradepulse-app-foundation\.vercel\.app/);
});
