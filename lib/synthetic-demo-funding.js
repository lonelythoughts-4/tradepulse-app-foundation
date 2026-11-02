/** @typedef {"wallet" | "demo" | "credit"} SyntheticFundingSource */

/**
 * The shared virtual pool is not a live-wallet authorization. Converted demo
 * credit executes under mainnet safeguards, so it keeps the acknowledgement.
 * @param {SyntheticFundingSource} source
 */
export function syntheticFundingNeedsDisclosure(source) {
  return source !== "demo";
}

/**
 * Return the spendable capacity for the source the customer actually chose.
 * @param {SyntheticFundingSource} source
 * @param {{ allocation?: { available_usd?: number, manual_available_usd?: number }, demo?: { available_usd?: number, credit_available_usd?: number } } | null | undefined} snapshot
 */
export function syntheticFundingCapacity(source, snapshot) {
  if (source === "demo") return Math.max(0, Number(snapshot?.demo?.available_usd || 0));
  if (source === "credit") return Math.max(0, Number(snapshot?.demo?.credit_available_usd || 0));
  return Math.max(0, Number(snapshot?.allocation?.manual_available_usd ?? snapshot?.allocation?.available_usd ?? 0));
}
