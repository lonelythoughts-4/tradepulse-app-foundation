"use client";

import type { ReactNode } from "react";

import { useDeskSelector, type DeskStore } from "../../lib/desk-store";
import type { DeskState } from "../../lib/desk-types";
import { useResourcePoller } from "./use-resource-poller";

type SyntheticWorkspaceProps<T> = {
  applySnapshot?: (snapshot: T) => void;
  market: string;
  onPollError: (error: unknown) => void;
  poll: () => Promise<T>;
  render: (snapshot: T | null) => ReactNode;
  store: DeskStore;
};

const syntheticSelector = (state: DeskState) => state.resources.synthetic;

/**
 * A market snapshot belongs to the active Synthetic workspace.  `market` is
 * deliberately part of the mounted boundary, so its poller is invalidated
 * before a new market can publish a response.
 */
export function SyntheticWorkspace<T>({
  applySnapshot,
  market,
  onPollError,
  poll,
  render,
  store,
}: SyntheticWorkspaceProps<T>) {
  const snapshot = useDeskSelector(store, syntheticSelector) as T | null;

  useResourcePoller(
    async () => {
      try {
        return await poll();
      } catch (error) {
        onPollError(error);
        return undefined;
      }
    },
    (next) => {
      if (applySnapshot) {
        applySnapshot(next);
        return;
      }
      store.applyResource("synthetic", next, Date.now());
    },
    5_000,
    true,
  );

  return <div data-synthetic-market={market}>{render(snapshot)}</div>;
}
