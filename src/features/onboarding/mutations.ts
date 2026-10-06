import { useMutation, useQueryClient } from '@tanstack/react-query';

import { collectionsListQueryKey } from '@/features/collections/queries';
import { markReminderInvitationShown, setUpAccount } from '@/features/onboarding/api';
import { onboardingQueryKey, type OnboardingData } from '@/features/onboarding/queries';

export function useSetUpAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (timeZone: string | undefined) => setUpAccount({ data: { timeZone } }),
    // The collection routes read the cached list, which is still empty and
    // unobserved here, so it has to refetch before navigating.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: collectionsListQueryKey, refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: onboardingQueryKey }),
      ]),
  });
}

export function useMarkReminderInvitationShown() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markReminderInvitationShown(),
    // The open dialog keeps its own copy, so the cache can let go right away.
    onMutate: () =>
      queryClient.setQueryData<OnboardingData>(onboardingQueryKey, (current) =>
        current ? { ...current, reminderInvitation: null } : current,
      ),
  });
}
