import { queryOptions } from '@tanstack/react-query';

import { getOnboarding } from '@/features/onboarding/api';

export type OnboardingData = Awaited<ReturnType<typeof getOnboarding>>;
export type ReminderInvitationData = NonNullable<OnboardingData['reminderInvitation']>;

export const onboardingQueryKey = ['onboarding'] as const;

export function onboardingQueryOptions() {
  return queryOptions({
    queryKey: onboardingQueryKey,
    queryFn: () => getOnboarding(),
  });
}
