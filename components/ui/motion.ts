"use client";

import { useEffect, useState } from "react";

export type MotionPreference = "full" | "reduced";
export type PresencePreset = "workspace" | "dialog" | "feedback";

export type PresencePlan = {
  durationMs: number;
  transform: string;
  opacity: true;
};

export type ActionFeedbackState = "idle" | "pending" | "success" | "error";

export function getMotionPreference(reduced: boolean): MotionPreference {
  return reduced ? "reduced" : "full";
}

export function getPresencePlan(preset: PresencePreset, preference: MotionPreference): PresencePlan {
  if (preference === "reduced") return { durationMs: 120, transform: "none", opacity: true };
  const durationMs = preset === "dialog" ? 240 : preset === "feedback" ? 160 : 200;
  const transform = preset === "dialog" ? "translateY(8px) scale(0.985)" : "translateY(6px)";
  return { durationMs, transform, opacity: true };
}

export function getActionFeedback(state: ActionFeedbackState, preference: MotionPreference) {
  return {
    blocking: false,
    blocksAction: state === "pending",
    blocksUnrelatedControls: false,
    durationMs: preference === "reduced" ? 120 : 160,
  };
}

/** Applies a composited entry cue without delaying the action that caused it. */
export function animatePresence(element: Element | null, preset: PresencePreset, preference: MotionPreference = "full") {
  if (!element || typeof element.animate !== "function") return null;
  const plan = getPresencePlan(preset, preference);
  return element.animate(
    plan.transform === "none"
      ? [{ opacity: 0.72 }, { opacity: 1 }]
      : [{ opacity: 0, transform: plan.transform }, { opacity: 1, transform: "none" }],
    { duration: plan.durationMs, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "both" },
  );
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}
