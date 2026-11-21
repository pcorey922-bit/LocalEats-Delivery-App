import audiences from '../../../../config/native-audiences.json';

export type AppAudience = keyof typeof audiences;
export function appMetadata(value: unknown = 'customer') {
  if (value !== 'customer' && value !== 'driver') throw new Error('Unknown native app audience');
  return audiences[value];
}
// Build identity controls presentation only. Every driver action still requires
// current server-side approval, including the existing owner-driver exception.
export function driverBuild(value: unknown): boolean { return value === 'driver'; }
export function appReturnScheme(value: unknown) { return value === 'driver' ? audiences.driver.scheme : audiences.customer.scheme; }
