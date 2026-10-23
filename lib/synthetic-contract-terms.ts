export type ManualContractType = "fixed" | "open_ended";

export type ContractDisclosure = {
  contract_type?: string;
  maximum_loss_percent?: number;
  manual_stop_loss_percent?: number;
  contract_reason?: string;
};

export const MINIMUM_OPEN_ENDED_LOSS_CAP = 5;
export const MAXIMUM_OPEN_ENDED_LOSS_CAP = 50;

export type OpenEndedTermsValidation =
  | { valid: true; maximumLossPercent: number; manualStopLossPercent?: number }
  | { valid: false; error: string };

export function normaliseManualContractType(value: unknown): ManualContractType {
  return value === "open_ended" ? "open_ended" : "fixed";
}

export function clampLossCap(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return MINIMUM_OPEN_ENDED_LOSS_CAP;
  return Math.min(MAXIMUM_OPEN_ENDED_LOSS_CAP, Math.max(MINIMUM_OPEN_ENDED_LOSS_CAP, numeric));
}

export function validateOpenEndedTerms(maximumLossPercent: unknown, manualStopLossPercent: unknown): OpenEndedTermsValidation {
  const cap = Number(maximumLossPercent);
  if (!Number.isFinite(cap) || cap < MINIMUM_OPEN_ENDED_LOSS_CAP || cap > MAXIMUM_OPEN_ENDED_LOSS_CAP) {
    return { valid: false, error: `Maximum loss cap must be between ${MINIMUM_OPEN_ENDED_LOSS_CAP}% and ${MAXIMUM_OPEN_ENDED_LOSS_CAP}%.` };
  }
  const rawStop = String(manualStopLossPercent ?? "").trim();
  if (!rawStop) return { valid: true, maximumLossPercent: cap };
  const stop = Number(manualStopLossPercent);
  if (!Number.isFinite(stop) || stop < MINIMUM_OPEN_ENDED_LOSS_CAP || stop > cap) {
    return { valid: false, error: `Optional tighter stop must be between ${MINIMUM_OPEN_ENDED_LOSS_CAP}% and the maximum loss cap.` };
  }
  return { valid: true, maximumLossPercent: cap, manualStopLossPercent: stop };
}

export function manualContractPreferences(type: ManualContractType, maximumLossPercent: unknown, manualStopLossPercent: unknown): Record<string, number | string> {
  // The UI uses the shorter "fixed" state while the financial API persists
  // the explicit, versioned contract name. Never send the display value over
  // the order boundary: the API must receive a valid immutable contract type.
  if (type === "fixed") return { contract_type: "fixed_duration" };
  const terms = validateOpenEndedTerms(maximumLossPercent, manualStopLossPercent);
  if (!terms.valid) throw new RangeError(terms.error);
  return {
    contract_type: "open_ended",
    maximum_loss_percent: terms.maximumLossPercent,
    ...(terms.manualStopLossPercent !== undefined ? { manual_stop_loss_percent: terms.manualStopLossPercent } : {}),
  };
}

export function contractTypeLabel(type: unknown): string {
  return normaliseManualContractType(type) === "open_ended" ? "Open-ended" : "Fixed duration";
}

export function contractReasonLabel(reason: unknown): string {
  const value = String(reason || "").trim();
  return value || "Confirmed at execution";
}
