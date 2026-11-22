export type SyntheticQuoteStatus = "connecting" | "delayed" | "live" | "reconnecting";

type Quote = {
  market: string;
  latest: { timestamp?: number; created_at?: number };
  received_at: number;
  server_updated_at: number;
};

export function syntheticQuoteStatus({
  error,
  market,
  now,
  quote,
}: {
  error: boolean;
  market: string;
  now: number;
  quote?: Quote;
}): SyntheticQuoteStatus {
  if (error) return "reconnecting";
  if (!quote || quote.market !== market) return "connecting";

  const receivedAge = now - Number(quote.received_at);
  if (!Number.isFinite(receivedAge) || receivedAge < -2500 || receivedAge > 2500) {
    return "connecting";
  }

  const tickTimestamp = Number(quote.latest.timestamp ?? quote.latest.created_at);
  const tickAge = Number(quote.server_updated_at) - tickTimestamp;
  if (Number.isFinite(tickAge) && tickAge >= -1 && tickAge <= 1) return "live";
  if (Number.isFinite(tickAge) && tickAge > 1) return "delayed";
  return "connecting";
}
