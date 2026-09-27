import { Link, createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { authClient } from '@/features/auth/client';
import { getSession } from '@/features/auth/session';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await getSession();

    return { session };
  },
  component: App,
});

function App() {
  const { session } = Route.useRouteContext();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.assign('/');
          },
        },
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:px-8">
      <h1 className="mb-3 text-3xl font-bold">EverySub</h1>
      <p className="mb-6 text-base text-muted-foreground">
        See what your subscriptions cost and what is coming up next.
      </p>
      {session ? (
        <Button
          className="inline-flex"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? 'Logging out...' : 'Log out'}
        </Button>
      ) : (
        <Link to="/login">
          <Button className="inline-flex">Sign In</Button>
        </Link>
      )}
    </main>
  );
}
