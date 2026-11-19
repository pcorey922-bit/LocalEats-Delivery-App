import pushPolicy from '../../../../config/native-push-policy.json';
export class PushExpiredError extends Error {
  readonly code = 'notification/expired';
  constructor() { super('Notification push lifetime ended; the in-app inbox remains available.'); }
}
export function notificationPushDeadline(createdAt: Date) {
  return new Date(createdAt.getTime() + pushPolicy.maxAgeSeconds * 1000);
}
export function pushLifetime(expiresAt?: Date, now = Date.now()) {
  const expires = expiresAt?.getTime() ?? now + pushPolicy.maxAgeSeconds * 1000;
  const ttlSeconds = Math.min(pushPolicy.maxAgeSeconds, Math.floor((expires - now) / 1000));
  if (!Number.isFinite(ttlSeconds) || ttlSeconds < 1) throw new PushExpiredError();
  return { ttlSeconds, expiresAtSeconds: Math.floor(expires / 1000) };
}
