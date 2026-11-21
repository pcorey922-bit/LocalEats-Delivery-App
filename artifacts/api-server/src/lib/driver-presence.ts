export const presenceFreshMs = 90000;

// All callers supply database time: host clock skew must not admit disconnected
// drivers or reject fresh heartbeats. Future/corrupt timestamps fail closed.
export function presenceIsFresh(
  presence:
    { available: boolean | null; heartbeatAt: Date | null } | null | undefined,
  now: Date,
) {
  if (!presence?.available || !presence.heartbeatAt) return false;
  const age = now.getTime() - presence.heartbeatAt.getTime();
  return Number.isFinite(age) && age >= 0 && age < presenceFreshMs;
}
