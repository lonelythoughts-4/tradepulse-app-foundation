export function createIdempotencyKey(scope: string): string {
  const identifier = globalThis.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  return `${scope}:${identifier}`;
}

export function getIdempotencyKeyForPayload(
  keys: Map<string, string>,
  scope: string,
  fingerprint: string,
): string {
  const existing = keys.get(fingerprint);
  if (existing) return existing;
  const key = createIdempotencyKey(scope);
  keys.set(fingerprint, key);
  return key;
}
