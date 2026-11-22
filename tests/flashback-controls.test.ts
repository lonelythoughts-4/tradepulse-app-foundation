import assert from "node:assert/strict";
import test from "node:test";

import {
  getFlashbackStartAvailability,
  parseFlashbackEntryAmount,
  shouldPollFlashbackStatus,
} from "../lib/flashback-controls.ts";

test("Flashback status polling continues while the automatic result is finalising", () => {
  assert.equal(
    shouldPollFlashbackStatus(true, [
      { state: "ready_to_reveal", product_version: "sealed-return-v2" },
    ]),
    true,
  );
  assert.equal(
    shouldPollFlashbackStatus(true, [
      { state: "revealed", product_version: "sealed-return-v2" },
    ]),
    false,
  );
  assert.equal(
    shouldPollFlashbackStatus(false, [
      { state: "sealed", product_version: "sealed-return-v2" },
    ]),
    false,
  );
});

test("Sealed Return is hidden and a legacy sealed session does not occupy the Direction slot", () => {
  assert.deepEqual(
    getFlashbackStartAvailability([
      { state: "sealed", product_version: "sealed-return-v2" },
    ]),
    { sealed: false, direction: true },
  );
});

test("one active Direction contract leaves no new Direction slot", () => {
  assert.deepEqual(
    getFlashbackStartAvailability([
      { state: "ready_to_reveal", product_version: "market-direction-v1" },
    ]),
    { sealed: false, direction: false },
  );
});

test("both active slots remain unavailable even when starting a session from history", () => {
  assert.deepEqual(
    getFlashbackStartAvailability([
      { state: "sealed", product_version: "sealed-return-v2" },
      { state: "ready_to_reveal", product_version: "market-direction-v1" },
    ]),
    { sealed: false, direction: false },
  );
});

test("settled sessions do not occupy a Flashback Direction start slot", () => {
  assert.deepEqual(
    getFlashbackStartAvailability([
      { state: "revealed", product_version: "sealed-return-v2" },
    ]),
    { sealed: false, direction: true },
  );
});

test("entry input preserves valid cents and rejects blank or over-precision values", () => {
  assert.equal(parseFlashbackEntryAmount("20.5"), 20.5);
  assert.equal(parseFlashbackEntryAmount(".05"), 0.05);
  assert.equal(parseFlashbackEntryAmount("20."), 20);
  assert.equal(parseFlashbackEntryAmount(""), null);
  assert.equal(parseFlashbackEntryAmount("20.005"), null);
});
