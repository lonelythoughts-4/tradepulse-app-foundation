"use client";

import { useEffect, useRef } from "react";

export interface ResourcePollerOptions<T> {
  apply?: (value: T) => void;
  isVisible: () => boolean;
  poll: (token: number) => Promise<T | void>;
}

export interface ResourcePoller<T> {
  invalidate(): void;
  setVisible(visible: boolean): Promise<void>;
  tick(): Promise<void>;
}

export function createResourcePoller<T>(options: ResourcePollerOptions<T>): ResourcePoller<T> {
  let visible = options.isVisible();
  let latestToken = 0;
  let activeToken = 0;

  const tick = async () => {
    if (!visible || activeToken) return;
    const token = ++latestToken;
    activeToken = token;
    try {
      const value = await options.poll(token);
      if (token === latestToken && value !== undefined) options.apply?.(value);
    } finally {
      if (activeToken === token) activeToken = 0;
    }
  };

  return {
    invalidate() {
      latestToken += 1;
      activeToken = 0;
    },
    async setVisible(nextVisible) {
      const changed = visible !== nextVisible;
      visible = nextVisible;
      if (changed && visible) await tick();
    },
    tick,
  };
}

export function useResourcePoller<T>(
  poll: (token: number) => Promise<T | void>,
  apply: (value: T) => void,
  intervalMs: number,
  enabled: boolean,
): void {
  const pollRef = useRef(poll);
  const applyRef = useRef(apply);
  pollRef.current = poll;
  applyRef.current = apply;

  useEffect(() => {
    if (!enabled) return;
    const poller = createResourcePoller<T>({
      apply: (value) => applyRef.current(value),
      isVisible: () => document.visibilityState === "visible",
      poll: (token) => pollRef.current(token),
    });
    const onVisibilityChange = () => void poller.setVisible(document.visibilityState === "visible");
    void poller.tick();
    const timer = window.setInterval(() => void poller.tick(), intervalMs);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      poller.invalidate();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, intervalMs]);
}
