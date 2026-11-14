import { useAuth } from '@clerk/react';
import { getMyProfile, getGetMyProfileQueryKey, useGetMyProfile } from '@workspace/api-client-react';
import { accountReadOptions, sessionRead } from '../lib/account-read';

export function useAccountProfile() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  return useGetMyProfile({ query: {
    queryKey: [...getGetMyProfileQueryKey(), userId],
    enabled: !!isLoaded && !!isSignedIn,
    staleTime: 15000,
    queryFn: ({ signal }) => sessionRead(headers => getMyProfile({ signal, headers }), getToken),
    ...accountReadOptions,
  } });
}
