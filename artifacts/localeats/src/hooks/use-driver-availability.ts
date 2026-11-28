import { useAuth } from '../lib/auth';
import { useQuery } from '@tanstack/react-query';
import { customFetch } from '../../../../lib/api-client-react/src/custom-fetch';
import { accountReadOptions, retryAccountRead, sessionRead } from '../lib/account-read';

import { driverAvailabilityResponse, DriverAvailabilityResponseError, type DriverAvailabilityState } from '../lib/driver-availability';

// All observers of this query must use the same bounded, session-aware read.
export function useDriverAvailability(enabled = true) {
  const { userId, getToken } = useAuth();
  return useQuery<DriverAvailabilityState, Error>({
    queryKey: ['driver-availability', userId],
    queryFn: async ({ signal }) => driverAvailabilityResponse(await sessionRead((headers, requestSignal) =>
      customFetch<DriverAvailabilityState>('/api/driver/availability', { headers, signal: requestSignal }), getToken, { signal })),
    ...accountReadOptions,
    retry: (count, error) => !(error instanceof DriverAvailabilityResponseError) && retryAccountRead(count, error),
    enabled: !!userId && enabled,
    refetchInterval: 15000,
  });
}
