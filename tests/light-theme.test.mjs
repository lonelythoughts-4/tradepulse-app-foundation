import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("light mode gives operational fact blocks a readable light surface", async () => {
  const css = await readFile(new URL("../app/desk-light-theme.css", import.meta.url), "utf8");
  assert.match(css, /html\[data-theme="light"\] \.fact-block/);
  assert.match(css, /html\[data-theme="light"\] \.fact-block b/);
  assert.match(css, /background: var\(--card\)/);
  assert.match(css, /color: var\(--foreground\)/);
  assert.match(css, /html\[data-theme="light"\] \.market-chart/);
  assert.match(css, /html\[data-theme="light"\] \.activity-status\.pending/);
  assert.match(css, /html\[data-theme="light"\] \.qr-grid/);
});
