import { accountProfileResponse } from '../lib/account-response';
import { useAuth } from '@clerk/react';
import { getMyProfile, getGetMyProfileQueryKey, useGetMyProfile } from '@workspace/api-client-react';
import { accountReadOptions, sessionRead } from '../lib/account-read';

export function useAccountProfile() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  return useGetMyProfile({ query: {
    queryKey: [...getGetMyProfileQueryKey(), userId],
    enabled: !!isLoaded && !!isSignedIn,
    staleTime: 15000,
    queryFn: ({ signal }) => sessionRead(async (headers, requestSignal) => accountProfileResponse(await getMyProfile({ signal: requestSignal, headers })), getToken, { signal }),
    ...accountReadOptions,
  } });
}
