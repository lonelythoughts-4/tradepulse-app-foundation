import assert from "node:assert/strict";
import test from "node:test";

import { getWorkspacePresencePlan } from "../components/workspaces/workspace-motion.ts";

test("workspace navigation uses a brief non-blocking handoff", () => {
  assert.deepEqual(getWorkspacePresencePlan(false), {
    enter: { opacity: 1, transform: "translateY(0px)" },
    exit: { opacity: 0, transform: "translateY(-4px)" },
    initial: { opacity: 0, transform: "translateY(8px)" },
    transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
  });
});

test("reduced motion removes the route movement without hiding state change", () => {
  const plan = getWorkspacePresencePlan(true);

  assert.equal(plan.initial.transform, "none");
  assert.equal(plan.exit.transform, "none");
  assert.equal(plan.transition.duration, 0.12);
  assert.equal(plan.initial.opacity, 0);
  assert.equal(plan.enter.opacity, 1);
});
