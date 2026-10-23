export type ContractInfoState = {
  hovered: boolean;
  focused: boolean;
  activation: "open" | "closed" | null;
};

export const initialContractInfoState: ContractInfoState = {
  hovered: false,
  focused: false,
  activation: null,
};

export function contractInfoExpanded(state: ContractInfoState): boolean {
  return state.activation === "open" || (state.activation === null && (state.hovered || state.focused));
}

function withTransientTrigger(state: ContractInfoState, trigger: "hovered" | "focused", active: boolean): ContractInfoState {
  const wasInactive = !state.hovered && !state.focused;
  return {
    ...state,
    [trigger]: active,
    // A fresh hover or focus starts a new transient disclosure. An explicit
    // click/keyboard choice remains stable until the control is left and used again.
    activation: active && wasInactive ? null : state.activation,
  };
}

export function contractInfoHover(state: ContractInfoState, hovered: boolean): ContractInfoState {
  return withTransientTrigger(state, "hovered", hovered);
}

export function contractInfoFocus(state: ContractInfoState, focused: boolean): ContractInfoState {
  return withTransientTrigger(state, "focused", focused);
}

export function activateContractInfo(state: ContractInfoState): ContractInfoState {
  // Focus precedes click for mouse and keyboard activation. The first
  // activation pins the already-visible explanation instead of closing it.
  return { ...state, activation: state.activation === "open" ? "closed" : "open" };
}
