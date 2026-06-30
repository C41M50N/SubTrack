import { Outlet, createFileRoute } from '@tanstack/react-router';

import { requireSession } from '@/features/auth/require-session';

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    const session = await requireSession(location.href);

    return { user: session.user };
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  return <Outlet />;
}
