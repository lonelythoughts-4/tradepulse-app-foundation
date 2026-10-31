"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getWorkspacePresencePlan } from "./workspace-motion";

export type CoreWorkspaceRoute = "Dashboard" | "Synthetic" | "Wallet";

type WorkspaceRouterProps = {
  route: CoreWorkspaceRoute;
  workspaces: Record<CoreWorkspaceRoute, ReactNode>;
};

/**
 * Keeps the shell's hash routing declarative while each mounted workspace owns
 * its own subscriptions and polling lifecycle.
 */
export function WorkspaceRouter({ route, workspaces }: WorkspaceRouterProps) {
  const reducedMotion = useReducedMotion();
  const plan = getWorkspacePresencePlan(Boolean(reducedMotion));

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={route}
        className="workspace-transition"
        initial={plan.initial}
        animate={plan.enter}
        exit={plan.exit}
        transition={plan.transition}
      >
        {workspaces[route]}
      </motion.div>
    </AnimatePresence>
  );
}
