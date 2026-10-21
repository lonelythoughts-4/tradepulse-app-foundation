export type WorkspacePresencePlan = {
  initial: { opacity: number; transform: string };
  enter: { opacity: number; transform: string };
  exit: { opacity: number; transform: string };
  transition: { duration: number; ease: [number, number, number, number] };
};

/**
 * A route handoff is intentionally short: it confirms a workspace changed
 * without delaying controls, polling, or a financial action response.
 */
export function getWorkspacePresencePlan(reducedMotion: boolean): WorkspacePresencePlan {
  return {
    initial: { opacity: 0, transform: reducedMotion ? "none" : "translateY(8px)" },
    enter: { opacity: 1, transform: "translateY(0px)" },
    exit: { opacity: 0, transform: reducedMotion ? "none" : "translateY(-4px)" },
    transition: {
      duration: reducedMotion ? 0.12 : 0.24,
      ease: [0.16, 1, 0.3, 1],
    },
  };
}
