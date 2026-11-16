export type FlashbackSessionAvailability = {
  state?: string;
  product_version?: string;
};

const DIRECTION_PRODUCT_VERSION = "market-direction-v1";

export function getFlashbackStartAvailability(
  sessions: readonly FlashbackSessionAvailability[],
): { sealed: boolean; direction: boolean } {
  const active = sessions.filter(
    (session) => session.state === "sealed" || session.state === "ready_to_reveal",
  );
  const hasOpenSlot = active.length < 2;

  return {
    sealed: hasOpenSlot && !active.some((session) => session.product_version !== DIRECTION_PRODUCT_VERSION),
    direction: hasOpenSlot && !active.some((session) => session.product_version === DIRECTION_PRODUCT_VERSION),
  };
}

export function parseFlashbackEntryAmount(value: string): number | null {
  const normalized = value.trim();
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}
