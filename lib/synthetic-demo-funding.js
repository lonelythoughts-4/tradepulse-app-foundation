/** @typedef {"wallet" | "credit"} SyntheticFundingSource */

/**
 * Active demo funds never enter a manual Synthetic order. Both remaining
 * manual sources execute under mainnet safeguards and need acknowledgement.
 * @param {SyntheticFundingSource} source
 */
export function syntheticFundingNeedsDisclosure(source) {
  return source === "wallet" || source === "credit";
}

/**
 * Return the spendable capacity for the source the customer actually chose.
 * @param {SyntheticFundingSource} source
 * @param {{ allocation?: { available_usd?: number, manual_available_usd?: number }, demo?: { available_usd?: number, credit_available_usd?: number } } | null | undefined} snapshot
 */
export function syntheticFundingCapacity(source, snapshot) {
  if (source === "credit") return Math.max(0, Number(snapshot?.demo?.credit_available_usd || 0));
  return Math.max(0, Number(snapshot?.allocation?.manual_available_usd ?? snapshot?.allocation?.available_usd ?? 0));
}
