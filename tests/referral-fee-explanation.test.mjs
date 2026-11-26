import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the live referral desk explains the commission source and downline levels", async () => {
  const source = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /not from their deposited capital or gross trading profit/i);
  assert.match(source, /people invited by your referral chain/i);
});
