import { CommerceError } from './commerce-policy';

// Fixed launch ceiling, independent of editable pricing or client-supplied flags.
export const launchArea = { city: 'Rockwood', region: 'TN', postalCode: '37854' } as const;
type Location = { city?: unknown; region?: unknown; postalCode?: unknown };
export function rockwoodPostalAddress(address: Location | null | undefined) {
  const text = (value: unknown) => typeof value === 'string' ? value.trim().toLowerCase() : '';
  return !!address && text(address.city) === 'rockwood' &&
    ['tn', 'tennessee'].includes(text(address.region)) && /^37854(?:-\d{4})?$/.test(text(address.postalCode));
}
export function requireLaunchDeliveryArea(restaurant: Location | null | undefined, address: Location | null | undefined, configuredPostalCodes: readonly string[]) {
  if (!configuredPostalCodes.includes(launchArea.postalCode))
    throw new CommerceError(409, 'Rockwood delivery is unavailable in the current service policy. Contact operations.');
  if (!rockwoodPostalAddress(restaurant) || !rockwoodPostalAddress(address))
    throw new CommerceError(409, 'Initial delivery is limited to Rockwood, Tennessee, ZIP 37854. Both the restaurant and delivery address must be in this service area.');
}
// Postal/locality checks are not proof of municipal boundaries. A customer can
// type a mailing locality; verified geocoding + an approved polygon are still a
// launch prerequisite before representing this as city-limit enforcement.

export function requireLaunchPostalCodes(codes: readonly string[]) {
  if (!codes.length || codes.some(code => code !== launchArea.postalCode))
    throw new CommerceError(409, 'Initial launch service ZIP must be 37854 only. A pricing update cannot expand the Rockwood launch area.');
}
