export type ActionKey = `${string}:${string}`;

export type DeskResources = Readonly<Record<string, unknown>>;

export interface DeskSnapshot {
  resources: DeskResources;
}

export interface ActionState {
  error?: string;
  pending: boolean;
}

export interface DeskState {
  actions: Readonly<Record<ActionKey, ActionState>>;
  resources: DeskResources;
  revisions: Readonly<Record<string, number>>;
}

export type DeskListener = () => void;
export type DeskSelector<T> = (state: DeskState) => T;
export type Unsubscribe = () => void;
