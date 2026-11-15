/** Keep an earlier workspace response from replacing a newer selection. */
export function shouldApplyEnvironmentProjection(requestedEnvironment, selectedEnvironment) {
  return requestedEnvironment === selectedEnvironment;
}

/** Testnet access belongs to admins; losing that access must return to mainnet. */
export function shouldResetEnvironmentForAccess(isAdmin, selectedEnvironment) {
  return !isAdmin && selectedEnvironment === "testnet";
}
