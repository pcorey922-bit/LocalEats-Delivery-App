// Fixed non-delivering request for the separate owner-only validation path.
// Deployment and real execution require separate approval; never used by a worker.
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
