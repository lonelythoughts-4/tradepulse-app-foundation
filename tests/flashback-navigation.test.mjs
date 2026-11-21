import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("the Flashback navigation selection is accepted and rendered", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );
  const selectionHandler = shell.match(
    /const selectChromeTab = \(value: string\) => \{([\s\S]*?)\n  \};/,
  )?.[1] ?? "";

  assert.match(selectionHandler, /"Flashback"/);
  assert.match(shell, /\{tab === "Flashback" && \(/);
});
