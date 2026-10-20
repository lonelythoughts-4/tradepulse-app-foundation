"use client";

import type { ReactNode } from "react";

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
  return <>{workspaces[route]}</>;
}
