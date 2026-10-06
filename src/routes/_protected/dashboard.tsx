import { createFileRoute, redirect } from '@tanstack/react-router';

import { collectionsQueryOptions } from '@/features/collections/queries';

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
  component: NoCollections,
});

function NoCollections() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col items-start px-6 py-12 sm:px-8">
      <h2 className="mb-2 text-2xl font-semibold">No collections yet</h2>
      <p className="text-base text-slate-600">
        Create your first collection to start tracking subscriptions.
      </p>
    </main>
  );
}
