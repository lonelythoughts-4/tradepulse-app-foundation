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

test("Flashback takes Account's mobile primary-navigation position", async () => {
  const shell = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );
  const primaryItems = shell.match(
    /const mobilePrimaryNavItems:[\s\S]*?= \[([\s\S]*?)\n\];/,
  )?.[1] ?? "";
  const secondaryItems = shell.match(
    /const mobileSecondaryNavItems:[\s\S]*?= \[([\s\S]*?)\n\];/,
  )?.[1] ?? "";
  const primaryLabels = [...primaryItems.matchAll(/\{ label: "([^"]+)"/g)].map(
    ([, label]) => label,
  );

  assert.deepEqual(primaryLabels, [
    "Dashboard",
    "Bots",
    "Synthetic",
    "Wallet",
    "Flashback",
  ]);
  assert.match(secondaryItems, /\{ label: "Account"/);
  assert.doesNotMatch(secondaryItems, /\{ label: "Flashback"/);
});
