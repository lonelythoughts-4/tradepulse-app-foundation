import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { activateContractInfo, contractInfoExpanded, contractInfoFocus, contractInfoHover, initialContractInfoState } from "../lib/synthetic-contract-info.ts";

test("contract information remains open until both hover and focus have ended", () => {
  const hovered = contractInfoHover(initialContractInfoState, true);
  assert.equal(contractInfoExpanded(hovered), true);
  const hoveredAndFocused = contractInfoFocus(hovered, true);
  assert.equal(contractInfoExpanded(contractInfoHover(hoveredAndFocused, false)), true);
  assert.equal(contractInfoExpanded(contractInfoFocus(contractInfoHover(hoveredAndFocused, false), false)), false);

  const focused = contractInfoFocus(initialContractInfoState, true);
  assert.equal(contractInfoExpanded(focused), true);
  assert.equal(contractInfoExpanded(contractInfoFocus(focused, false)), false);
});

test("contract information activation stays open after focus and then toggles on keyboard or tap", () => {
  const focused = contractInfoFocus(initialContractInfoState, true);
  const openedByActivation = activateContractInfo(focused);
  assert.equal(contractInfoExpanded(openedByActivation), true);
  assert.equal(contractInfoExpanded(activateContractInfo(openedByActivation)), false);

  const tappedOpen = activateContractInfo(initialContractInfoState);
  assert.equal(contractInfoExpanded(tappedOpen), true);
  assert.equal(contractInfoExpanded(activateContractInfo(tappedOpen)), false);
});

test("the contract help control preserves a usable narrow-screen target and tooltip placement", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const contractSection = css.slice(css.indexOf(".synthetic-contract-selector"));

  assert.match(contractSection, /@media\(max-width:520px\)\{[\s\S]*?\.synthetic-contract-info>\.small-action\{min-width:44px;min-height:44px\}/);
  assert.match(contractSection, /@media\(max-width:520px\)\{[\s\S]*?\.synthetic-contract-tooltip\{right:auto;left:0;width:min\(320px,calc\(100vw - 56px\)\)\}/);
});
