export type FundingOutcome = "applied" | "already-recorded" | null;

export function fundingFeedback(pending: boolean, outcome: FundingOutcome) {
  if (pending) {
    return {
      buttonLabel: "Funding…",
      status: outcome === "applied"
        ? "Funding applied. Change a funding field before sending another credit."
        : "Submitting this funding request…",
    };
  }
  if (outcome === "applied") {
    return {
      buttonLabel: "Funding recorded",
      status: "Funding applied. Change a funding field before sending another credit.",
    };
  }
  if (outcome === "already-recorded") {
    return {
      buttonLabel: "Already recorded",
      status: "An equivalent funding action was already recorded. Change a funding field before sending another credit.",
    };
  }
  return {
    buttonLabel: "Fund user",
    status: "Funding will be recorded in the selected admin workspace.",
  };
}
