export type DriverAvailabilityState = {
  approved: boolean;
  ownerDriverAccess?: boolean;
  available: boolean;
  online: boolean;
  activeOrderId: string | null;
};
export class DriverAvailabilityResponseError extends Error {
  constructor() {
    super('The server driver-availability response could not be validated. Retry availability; no permissions changed. Code: DRIVER_AVAILABILITY_RESPONSE_INVALID.');
  }
}
export function driverAvailabilityResponse(value: unknown): DriverAvailabilityState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new DriverAvailabilityResponseError();
  const state = value as Record<string, unknown>;
  if (['approved', 'available', 'online'].some(key => typeof state[key] !== 'boolean') ||
      !(state.activeOrderId === null || typeof state.activeOrderId === 'string' && state.activeOrderId.length > 0) ||
      state.ownerDriverAccess !== undefined && typeof state.ownerDriverAccess !== 'boolean') throw new DriverAvailabilityResponseError();
  return value as DriverAvailabilityState;
}
