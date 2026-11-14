import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Account settings owns the confirmed browser logout action", async () => {
  const account = await readFile(
    new URL("../components/workspaces/account-workspace.tsx", import.meta.url),
    "utf8",
  );
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );

  assert.match(account, /onLogout: \(\) => Promise<void>/);
  assert.match(account, /setModal\("logout"\)/);
  assert.match(account, /Log out\?/);
  assert.match(shell, /request\("\/v1\/auth\/logout", \{ method: "POST" \}\)/);
  assert.match(shell, /<AccountWorkspace[\s\S]*?onLogout=/);
});
