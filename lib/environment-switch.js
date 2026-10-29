/** Keep an earlier workspace response from replacing a newer selection. */
export function shouldApplyEnvironmentProjection(requestedEnvironment, selectedEnvironment) {
  return requestedEnvironment === selectedEnvironment;
}
