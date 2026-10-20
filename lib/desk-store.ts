import { useSyncExternalStore } from "react";

import type {
  ActionKey,
  ActionState,
  DeskListener,
  DeskSelector,
  DeskSnapshot,
  DeskState,
  Unsubscribe,
} from "./desk-types";

type SelectorSubscription<T> = {
  listener: DeskListener;
  selector: DeskSelector<T>;
  value: T;
};

export interface DeskStore {
  applyResource(resource: string, value: unknown, revision: number): boolean;
  getState(): DeskState;
  runAction<T>(key: ActionKey, request: () => Promise<T>): Promise<T>;
  subscribe(listener: DeskListener): Unsubscribe;
  subscribeSelector<T>(selector: DeskSelector<T>, listener: DeskListener): Unsubscribe;
}

function actionError(error: unknown): string {
  return error instanceof Error ? error.message : "The requested action could not be completed.";
}

function initialState(initial: DeskSnapshot): DeskState {
  return {
    actions: {},
    resources: { ...initial.resources },
    revisions: {},
  };
}

export function createDeskStore(initial: DeskSnapshot): DeskStore {
  let state = initialState(initial);
  const listeners = new Set<DeskListener>();
  const selectorSubscriptions = new Set<SelectorSubscription<unknown>>();
  const inFlightActions = new Map<ActionKey, Promise<unknown>>();

  const notify = () => {
    for (const listener of listeners) listener();

    for (const subscription of selectorSubscriptions) {
      const nextValue = subscription.selector(state);
      if (!Object.is(subscription.value, nextValue)) {
        subscription.value = nextValue;
        subscription.listener();
      }
    }
  };

  const update = (next: DeskState) => {
    if (Object.is(state, next)) return;
    state = next;
    notify();
  };

  const setAction = (key: ActionKey, action: ActionState) => {
    update({
      ...state,
      actions: {
        ...state.actions,
        [key]: action,
      },
    });
  };

  return {
    applyResource(resource, value, revision) {
      const currentRevision = state.revisions[resource] ?? -1;
      if (revision < currentRevision) return false;

      update({
        ...state,
        resources: {
          ...state.resources,
          [resource]: value,
        },
        revisions: {
          ...state.revisions,
          [resource]: revision,
        },
      });
      return true;
    },

    getState() {
      return state;
    },

    runAction<T>(key: ActionKey, request: () => Promise<T>): Promise<T> {
      const duplicate = inFlightActions.get(key) as Promise<T> | undefined;
      if (duplicate) return duplicate;

      setAction(key, { pending: true });
      const action = Promise.resolve().then(request);
      inFlightActions.set(key, action);

      void action.then(
        () => setAction(key, { pending: false }),
        (error) => setAction(key, { error: actionError(error), pending: false }),
      ).finally(() => {
        inFlightActions.delete(key);
      });

      return action;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    subscribeSelector<T>(selector: DeskSelector<T>, listener: DeskListener) {
      const subscription: SelectorSubscription<T> = {
        listener,
        selector,
        value: selector(state),
      };
      selectorSubscriptions.add(subscription as SelectorSubscription<unknown>);
      return () => selectorSubscriptions.delete(subscription as SelectorSubscription<unknown>);
    },
  };
}

export function useDeskSelector<T>(store: DeskStore, selector: DeskSelector<T>): T {
  return useSyncExternalStore(
    (listener) => store.subscribeSelector(selector, listener),
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}
