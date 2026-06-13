import { api } from '@/utils/api';
import { USER_DATA_STALE_TIME_MS } from '@/utils/query-cache';

export function useUser() {
  const { data: user, refetch: refreshUserData } =
    api.users.getCurrentUser.useQuery(undefined, {
      staleTime: USER_DATA_STALE_TIME_MS,
    });

  return { user, refreshUserData };
}
