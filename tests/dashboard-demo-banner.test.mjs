import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the live Dashboard renders one demo surface", async () => {
  const source = await readFile(
    new URL("../components/tradepulse-shell.tsx", import.meta.url),
    "utf8",
  );

  const embeddedDemoSurfaces = source.match(/<DemoBanner\s/g) ?? [];
  const standaloneDashboardDemoSurfaces = source.match(
    /tab === "Dashboard" && data\.demo\?\.state === "issued"/g,
  ) ?? [];

  assert.equal(
    embeddedDemoSurfaces.length + standaloneDashboardDemoSurfaces.length,
    1,
    "Dashboard demo information must have one render owner",
  );
});
