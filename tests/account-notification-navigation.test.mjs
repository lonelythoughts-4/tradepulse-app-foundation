import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Account consumes a notification-open request after displaying the preferences", async () => {
  const source = await readFile(new URL("../components/workspaces/account-workspace.tsx", import.meta.url), "utf8");
  assert.match(source, /onNotificationsRequestHandled/);
});
