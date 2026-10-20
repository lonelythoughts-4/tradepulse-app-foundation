"use client";

import type { ReactNode } from "react";

import { useDeskSelector, type DeskStore } from "../../lib/desk-store";
import type { DeskState } from "../../lib/desk-types";
import { useResourcePoller } from "./use-resource-poller";

type WalletWorkspaceProps<T> = {
  store: DeskStore;
  poll: () => Promise<T>;
  render: (dashboard: T) => ReactNode;
};

const walletDashboardSelector = (state: DeskState) => state.resources.dashboard;

/**
 * Wallet refreshes are scoped to its route.  Deposit and withdrawal controls
 * own their form state in LiveWalletScreen; this component owns only the
 * server projection that those controls render against.
 */
export function WalletWorkspace<T>({ store, poll, render }: WalletWorkspaceProps<T>) {
  const dashboard = useDeskSelector(store, walletDashboardSelector) as T | null;

  useResourcePoller(
    async () => poll(),
    (next) => store.applyResource("dashboard", next, Date.now()),
    15_000,
    true,
  );

  return dashboard ? render(dashboard) : null;
}
