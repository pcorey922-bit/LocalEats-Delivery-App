import { accountProfileResponse, accountResponseRead } from '../lib/account-response';
import { useAuth } from '../lib/auth';
import { getMyProfile, getGetMyProfileQueryKey, useGetMyProfile } from '@workspace/api-client-react';
import { accountReadOptions, sessionRead } from '../lib/account-read';

export function useAccountProfile() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  return useGetMyProfile({ query: {
    queryKey: [...getGetMyProfileQueryKey(), userId],
    enabled: !!isLoaded && !!isSignedIn,
    staleTime: 15000,
    queryFn: ({ signal }) => sessionRead(async (headers, requestSignal) => accountResponseRead(onResponse => getMyProfile({ signal: requestSignal, headers, onResponse }), accountProfileResponse), getToken, { signal }),
    ...accountReadOptions,
  } });
}
