import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { authClient } from '@/features/auth/client';
import { getSession } from '@/features/auth/session';

type LoginSearch = {
  redirect?: string;
};

const FALLBACK_REDIRECT = '/dashboard';

function getSafeRedirect(redirectTo?: string) {
  if (!redirectTo) {
    return FALLBACK_REDIRECT;
  }

  if (!redirectTo.startsWith('/') || redirectTo.startsWith('//')) {
    return FALLBACK_REDIRECT;
  }

  return redirectTo;
}

export const Route = createFileRoute('/login')({
  validateSearch: (search): LoginSearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const session = await getSession();

    if (session) {
      throw redirect({
        href: getSafeRedirect(search.redirect),
      });
    }
  },
  component: Login,
});

function Login() {
  const search = Route.useSearch();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsPending(true);
    setErrorMessage(null);

    const callbackURL = getSafeRedirect(search.redirect);
    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL,
    });

    if (error) {
      setIsPending(false);
      setErrorMessage(error.message || 'Unable to sign in right now.');
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-12">
      <section className="w-full rounded-3xl border border-black/10 bg-white/80 p-8 shadow-sm backdrop-blur">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          Login
        </p>
        <h1 className="mb-3 text-3xl font-bold text-slate-900 sm:text-4xl">
          Sign in to continue
        </h1>
        <p className="mb-6 text-base leading-7 text-slate-600">
          Use your Google account to access protected routes.
        </p>
        <Button
          onClick={handleGoogleSignIn}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? 'Redirecting...' : 'Continue with Google'}
        </Button>
        {errorMessage ? (
          <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
        ) : null}
      </section>
    </main>
  );
}
