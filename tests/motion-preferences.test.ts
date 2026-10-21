import assert from "node:assert/strict";
import test from "node:test";
import {
  getActionFeedback,
  getMotionPreference,
  getPresencePlan,
} from "../components/ui/motion.ts";

test("uses the reduced-motion feedback path when the preference is enabled", () => {
  assert.equal(getMotionPreference(true), "reduced");
  assert.deepEqual(getPresencePlan("workspace", "reduced"), {
    durationMs: 120,
    transform: "none",
    opacity: true,
  });
});

test("does not delay an action while its confirmation animation runs", () => {
  const feedback = getActionFeedback("success", "full");

  assert.equal(feedback.blocking, false);
  assert.equal(feedback.durationMs, 160);
});

test("keeps an unrelated control interactive during action feedback", () => {
  const feedback = getActionFeedback("pending", "full");

  assert.equal(feedback.blocksAction, true);
  assert.equal(feedback.blocksUnrelatedControls, false);
});
