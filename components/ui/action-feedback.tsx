"use client";

import { type ReactNode } from "react";
import { getActionFeedback, type ActionFeedbackState, useReducedMotion } from "./motion";

export function ActionFeedback({ state, children }: { state: ActionFeedbackState; children: ReactNode }) {
  const preference = useReducedMotion() ? "reduced" : "full";
  const feedback = getActionFeedback(state, preference);

  return (
    <span
      className="action-feedback"
      data-action-feedback={state}
      data-reduced-motion={preference === "reduced" ? "true" : undefined}
      data-blocks-unrelated-controls={feedback.blocksUnrelatedControls ? "true" : "false"}
      aria-live={state === "idle" ? undefined : "polite"}
    >
      {children}
    </span>
  );
}
