import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../components/workspaces/bots-workspace.tsx", import.meta.url),
  "utf8",
);

test("funded Memecoin bots surface an authorization path from fleet and detail", () => {
  assert.match(source, /bot\.state === "awaiting_authorization" && <span className="memecoin-fleet-prompt">Funded, but not active\./);
  assert.match(source, /\{bot\.state === "awaiting_authorization" \? "Review setup" : "Open detail"\}/);

  const authorizationPanel = source.indexOf("Authorize your funded Memecoin bot");
  const liveMarketPanel = source.indexOf("LIVE MEMECOIN MARKET");
  assert.ok(authorizationPanel >= 0);
  assert.ok(liveMarketPanel > authorizationPanel, "authorization controls should appear before the chart");
});

test("first authorization requires explicit risk acceptance and keeps Auto opt-in", () => {
  assert.match(source, /checked=\{Boolean\(acceptedMemecoinAuthorizations\[selected\.id\]\)\}/);
  assert.match(source, /accepted: awaitingAuthorization && Boolean\(acceptedMemecoinAuthorizations\[selected\.id\]\)/);
  assert.match(source, /Automatic entries are off by default\./);
  assert.match(source, /awaitingAuthorization \? \(memecoinAutoEnabled \? "Authorize and enable Auto" : "Authorize bot"\)/);
  assert.match(source, /awaitingAuthorization && !acceptedMemecoinAuthorizations\[selected\.id\]/);
});
