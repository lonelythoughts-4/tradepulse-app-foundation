/**
 * Human-readable settlement reasons shared by fleet and activity surfaces.
 * Keep this outside a route component so a workspace never depends on shell
 * implementation details.
 */
const exitLabels: Record<string, string> = {
  take_profit: "Take profit",
  stop_loss: "Stop loss",
  user_close: "User close",
  fixed_expiry: "Fixed expiry",
};

export function formatSettlementExitReason(reason?: string, netPnl?: number): string {
  const value = reason?.trim();
  if (!value) return "Recorded settlement";
  const normalized = value.toLowerCase();
  if (normalized === "contract_expiry") return exitLabels.fixed_expiry;
  if (normalized.startsWith("game_") || normalized === "auto_daily_goal" || normalized === "auto_daily_loss_limit") {
    return typeof netPnl === "number" && Number.isFinite(netPnl) && netPnl > 0
      ? exitLabels.take_profit
      : exitLabels.stop_loss;
  }
  return exitLabels[normalized] || value.replaceAll("_", " ");
}
