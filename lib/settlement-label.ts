/**
 * Human-readable settlement reasons shared by fleet and activity surfaces.
 * Keep this outside a route component so a workspace never depends on shell
 * implementation details.
 */
export function formatSettlementExitReason(reason?: string): string {
  return reason ? reason.replaceAll("_", " ") : "Recorded settlement";
}
