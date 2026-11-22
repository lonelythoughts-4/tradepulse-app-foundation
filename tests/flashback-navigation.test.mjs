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

test("Flashback follows Synthetic in mobile primary navigation", async () => {
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
    "Flashback",
    "Wallet",
  ]);
  assert.match(secondaryItems, /\{ label: "Account"/);
  assert.doesNotMatch(secondaryItems, /\{ label: "Flashback"/);
});

test("customer Flashback UI exposes Direction only", async () => {
  const workspace = await readFile(
    new URL("../components/workspaces/bots-workspace.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(workspace, /Choose Sealed Return/);
  assert.doesNotMatch(workspace, /setFlashbackType\("sealed"\)/);
  assert.match(workspace, /\.filter\(\(session\) => session\.product_version === "market-direction-v1"\)/);
  assert.match(workspace, /Recent Directions/);
  assert.match(workspace, /shouldOpenDirectionOnFlashbackEntry/);
  assert.match(workspace, /No Direction markets are currently enabled\. Try again when an administrator publishes one\./);
  assert.match(workspace, /<h2>Active Direction<\/h2>/);
  assert.match(workspace, /\{recentFlashbackSessions\.length > 0 && <GradientPanel/);
  assert.doesNotMatch(workspace, /!flashbackInCreationFlow && recentFlashbackSessions/);
  const recentDirections = workspace.indexOf("{recentFlashbackSessions.length > 0 && <GradientPanel");
  const directionEntry = workspace.indexOf("Review Flashback Direction");
  const activeContract = workspace.indexOf('{flashback?.state === "sealed" && directionContract');
  assert.ok(directionEntry >= 0 && recentDirections > directionEntry);
  assert.ok(activeContract >= 0 && recentDirections > activeContract);
});
