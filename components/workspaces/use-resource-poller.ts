"use client";

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type WorkspacePollingContextValue = {
  activeWorkspace: string;
  isVisible: boolean;
};

const WorkspacePollingContext = createContext<WorkspacePollingContextValue>({
  activeWorkspace: "",
  isVisible: true,
});

export function WorkspacePollingProvider({
  activeWorkspace,
  isVisible,
  children,
}: WorkspacePollingContextValue & { children: ReactNode }) {
  const value = useMemo(
    () => ({ activeWorkspace, isVisible }),
    [activeWorkspace, isVisible],
  );
  return createElement(WorkspacePollingContext.Provider, { value }, children);
}

export function useDocumentVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(document.visibilityState === "visible");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  return isVisible;
}

export function useWorkspacePollingState(workspace: string) {
  const context = useContext(WorkspacePollingContext);
  return {
    activeWorkspace: context.activeWorkspace,
    isActive: context.activeWorkspace === workspace,
    isVisible: context.isVisible,
  };
}

export function isWorkspacePollingAllowed(
  activeWorkspace: string,
  workspace: string,
  isVisible: boolean,
  enabled: boolean,
): boolean {
  return enabled && isVisible && activeWorkspace === workspace;
}

export interface ResourcePollerOptions<T> {
  apply?: (value: T) => void;
  isVisible: () => boolean;
  onError?: (error: unknown, token: number) => void;
  poll: (token: number, signal: AbortSignal) => Promise<T | void>;
}

export interface ResourcePoller<T> {
  invalidate(): void;
  setVisible(visible: boolean): Promise<void>;
  tick(): Promise<void>;
}

export function createResourcePoller<T>(options: ResourcePollerOptions<T>): ResourcePoller<T> {
  let visible = options.isVisible();
  let latestToken = 0;
  let active: { token: number; controller: AbortController } | null = null;
  let refreshWhenVisible = false;

  const tick = async () => {
    if (!visible || active) return;
    const token = ++latestToken;
    const controller = new AbortController();
    active = { token, controller };
    try {
      const value = await options.poll(token, controller.signal);
      if (token === latestToken && value !== undefined) options.apply?.(value);
    } catch (error) {
      if (token === latestToken && !controller.signal.aborted) {
        if (options.onError) options.onError(error, token);
        else throw error;
      }
    } finally {
      if (active?.token === token) active = null;
      if (refreshWhenVisible && visible) {
        refreshWhenVisible = false;
        void tick();
      }
    }
  };

  return {
    invalidate() {
      latestToken += 1;
      refreshWhenVisible = false;
      active?.controller.abort();
    },
    async setVisible(nextVisible) {
      const changed = visible !== nextVisible;
      visible = nextVisible;
      if (changed && !visible) {
        latestToken += 1;
        refreshWhenVisible = false;
        active?.controller.abort();
      }
      if (changed && visible) {
        if (active) refreshWhenVisible = true;
        else await tick();
      }
    },
    tick,
  };
}

export function useResourcePoller<T>(
  poll: (token: number, signal: AbortSignal) => Promise<T | void>,
  apply: (value: T) => void,
  intervalMs: number,
  enabled: boolean,
  resourceKey: string,
  onError: (error: unknown) => void,
  workspace: string,
): void {
  const pollRef = useRef(poll);
  const applyRef = useRef(apply);
  const onErrorRef = useRef(onError);
  const pollingState = useWorkspacePollingState(workspace);
  pollRef.current = poll;
  applyRef.current = apply;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!isWorkspacePollingAllowed(
      pollingState.activeWorkspace,
      workspace,
      pollingState.isVisible && document.visibilityState === "visible",
      enabled,
    )) return;
    let failureNotified = false;
    const poller = createResourcePoller<T>({
      apply: (value) => applyRef.current(value),
      isVisible: () => true,
      onError: (error) => {
        if (failureNotified) return;
        failureNotified = true;
        onErrorRef.current(error);
      },
      poll: async (token, signal) => {
        const value = await pollRef.current(token, signal);
        failureNotified = false;
        return value;
      },
    });
    void poller.tick();
    const timer = intervalMs > 0
      ? window.setInterval(() => void poller.tick(), intervalMs)
      : null;
    return () => {
      void poller.setVisible(false);
      if (timer !== null) window.clearInterval(timer);
    };
  }, [
    enabled,
    intervalMs,
    pollingState.activeWorkspace,
    pollingState.isActive,
    pollingState.isVisible,
    resourceKey,
    workspace,
  ]);
}
