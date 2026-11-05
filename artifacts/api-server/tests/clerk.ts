// Test bundle only. Production app uses the real @clerk/express middleware.
export const clerkMiddleware =
  () => (_req: unknown, _res: unknown, next: () => void) =>
    next();
export const getAuth = (req: {
  get: (name: string) => string | undefined;
}) => ({ userId: req.get("x-test-user") || null });
