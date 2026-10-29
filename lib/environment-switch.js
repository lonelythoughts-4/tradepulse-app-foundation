/** Keep an earlier workspace response from replacing a newer selection. */
export function shouldApplyEnvironmentProjection(requestedEnvironment, selectedEnvironment) {
  return requestedEnvironment === selectedEnvironment;
}

/** A workspace transition must never render the prior workspace as the next one. */
export function shouldClearEnvironmentProjection(currentEnvironment, nextEnvironment) {
  return currentEnvironment !== nextEnvironment;
}
