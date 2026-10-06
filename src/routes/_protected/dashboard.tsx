import { createFileRoute, redirect } from '@tanstack/react-router';

import { collectionsQueryOptions } from '@/features/collections/queries';
import { AccountSetup } from '@/features/onboarding/components/account-setup';

export const Route = createFileRoute('/_protected/dashboard')({
  beforeLoad: async ({ context }) => {
    const collections = await context.queryClient.ensureQueryData(
      collectionsQueryOptions(),
    );

    const [first] = collections;

    if (first) {
      throw redirect({
        to: '/c/$collectionId/dashboard',
        params: { collectionId: first.id },
      });
    }
  },
  // Accounts without a collection get one automatically.
  component: AccountSetup,
});
