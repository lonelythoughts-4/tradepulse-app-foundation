"use client";

import type { ReactNode } from "react";

import { useDeskSelector, type DeskStore } from "../../lib/desk-store";
import type { DeskState } from "../../lib/desk-types";
import { useResourcePoller } from "./use-resource-poller";

type DashboardWorkspaceProps<T> = {
  store: DeskStore;
  poll: () => Promise<T>;
  render: (dashboard: T) => ReactNode;
};

const dashboardSelector = (state: DeskState) => state.resources.dashboard;

/**
 * The dashboard is the only owner of its account-projection poll.  Consumers
 * subscribe to the dashboard resource, rather than to the whole desk state.
 */
export function DashboardWorkspace<T>({ store, poll, render }: DashboardWorkspaceProps<T>) {
  const dashboard = useDeskSelector(store, dashboardSelector) as T | null;

  useResourcePoller(
    async () => poll(),
    (next) => store.applyResource("dashboard", next, Date.now()),
    15_000,
    true,
  );

  return dashboard ? render(dashboard) : null;
}
