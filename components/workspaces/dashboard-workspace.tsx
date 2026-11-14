"use client";

import { useRef, type ComponentProps } from "react";

import { applyResourceIfUnchanged, useDeskSelector, type DeskStore } from "../../lib/desk-store";
import type { DeskState } from "../../lib/desk-types";
import { Dashboard } from "../tradepulse-shell";
import { useResourcePoller } from "./use-resource-poller";

type DashboardWorkspaceProps<T> = ComponentProps<typeof Dashboard> & {
  onPollError: (error: unknown) => void;
  store: DeskStore;
  poll: (signal: AbortSignal) => Promise<T>;
};

const dashboardSelector = (state: DeskState) => state.resources.dashboard;

/**
 * The dashboard is the only owner of its account-projection poll.  Consumers
 * subscribe to the dashboard resource, rather than to the whole desk state.
 */
export function DashboardWorkspace<T>({ store, poll, onPollError, ...dashboardProps }: DashboardWorkspaceProps<T>) {
  const dashboard = useDeskSelector(store, dashboardSelector) as T | null;
  const pollRevision = useRef(-1);

  useResourcePoller(
    async (_token, signal) => {
      pollRevision.current = store.getState().revisions.dashboard ?? -1;
      return poll(signal);
    },
    (next) => applyResourceIfUnchanged(store, "dashboard", next, pollRevision.current),
    15_000,
    true,
    "dashboard",
    onPollError,
  );

  return dashboard ? <Dashboard {...dashboardProps} /> : null;
}
