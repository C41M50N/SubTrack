import { api } from '@/utils/api';

export function useUser() {
  const { data: user, refetch: refreshUserData } =
    api.users.getCurrentUser.useQuery(undefined, {
      staleTime: Number.POSITIVE_INFINITY,
    });

  return { user, refreshUserData };
}
