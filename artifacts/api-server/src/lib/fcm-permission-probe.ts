// Offline preparation only. Nothing imports this into a route or worker.
// A future owner-only validation route needs separate review/deploy/execution approval.
// validate_only still calls FCM messages:send, which OAuth-only approval forbids.
export function prepareFcmPermissionProbe() {
  if (arguments.length !== 0) {
    throw new Error('Custom FCM validation inputs are not supported');
  }
  return Object.freeze({
    url: 'https://fcm.googleapis.com/v1/projects/rocoeats-3bd55/messages:send',
    method: 'POST' as const,
    redirect: 'error' as const,
    // Immutable serialized body; no caller-controlled flags, tokens, topic or data.
    body: JSON.stringify({
      validate_only: true,
      message: {
        topic: 'rocoeats-staging-permission-probe',
        data: { rocoeatsProbe: 'permission-validation-only' },
      },
    }),
  });
}
