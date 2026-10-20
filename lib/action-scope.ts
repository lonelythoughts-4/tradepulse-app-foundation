import type { ActionKey, ActionState } from "./desk-types";

export interface ActionScope {
  begin(key: ActionKey): void;
  complete(key: ActionKey): void;
  error(key: ActionKey): string | undefined;
  fail(key: ActionKey, error: unknown): void;
  pending(key: ActionKey): boolean;
}

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : "The requested action could not be completed.";
}

export function createActionScope(): ActionScope {
  const states = new Map<ActionKey, ActionState>();

  return {
    begin(key) {
      states.set(key, { pending: true });
    },
    complete(key) {
      states.set(key, { pending: false });
    },
    error(key) {
      return states.get(key)?.error;
    },
    fail(key, error) {
      states.set(key, { error: messageFor(error), pending: false });
    },
    pending(key) {
      return Boolean(states.get(key)?.pending);
    },
  };
}
