import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../components/workspaces/bots-workspace.tsx", import.meta.url),
  "utf8",
);

test("funded Memecoin bots link from the fleet to authorization inside the Memecoin market panel", () => {
  assert.match(source, /bot\.state === "awaiting_authorization" && <span className="memecoin-fleet-prompt">Funded, but not active\./);
  assert.match(source, /\{bot\.state === "awaiting_authorization" \? "Review setup" : "Open detail"\}/);

  const marketPanel = source.indexOf('<GradientPanel className="compound-panel memecoin-market-panel">');
  const authorizationPanel = source.indexOf("Authorize your funded Memecoin bot");
  const liveMarketPanel = source.indexOf("LIVE MEMECOIN MARKET");
  const marketPanelEnd = source.indexOf("</GradientPanel>", marketPanel);
  assert.ok(marketPanel >= 0);
  assert.ok(authorizationPanel > marketPanel && authorizationPanel < liveMarketPanel);
  assert.ok(liveMarketPanel < marketPanelEnd, "authorization controls should share the Memecoin panel with its market chart");
  assert.equal(source.includes("Up to the last 8 account engine records; quote-modeled, not exchange fills."), false);
});

test("first authorization requires explicit risk acceptance and keeps Auto opt-in", () => {
  assert.match(source, /checked=\{Boolean\(acceptedMemecoinAuthorizations\[selected\.id\]\)\}/);
  assert.match(source, /accepted: awaitingAuthorization && Boolean\(acceptedMemecoinAuthorizations\[selected\.id\]\)/);
  assert.match(source, /Automatic entries are off by default\./);
  assert.match(source, /awaitingAuthorization \? \(memecoinAutoEnabled \? "Authorize and enable Auto" : "Authorize bot"\)/);
  assert.match(source, /awaitingAuthorization && !acceptedMemecoinAuthorizations\[selected\.id\]/);
});
