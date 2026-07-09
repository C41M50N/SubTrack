import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { collectionsQueryOptions } from '@/features/collections/queries';

export const Route = createFileRoute('/_protected/c/$collectionId')({
  loader: async ({ context, params }) => {
    const collections = await context.queryClient.ensureQueryData(
      collectionsQueryOptions(),
    );

    const collection = collections.find(
      (candidate) => candidate.id === params.collectionId,
    );

    // The collection id in the URL is stale or not ours: fall back to the
    // first collection, or to /dashboard when the user has none.
    if (!collection) {
      const [first] = collections;

      if (first) {
        throw redirect({
          to: '/c/$collectionId/dashboard',
          params: { collectionId: first.id },
        });
      }

      throw redirect({ to: '/dashboard' });
    }

    return { collection };
  },
  component: CollectionLayout,
});

function CollectionLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
