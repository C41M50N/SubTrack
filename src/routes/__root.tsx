import { TanStackDevtools } from '@tanstack/react-devtools';
import type { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
  type ErrorComponentProps,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';

import { Button } from '../components/Button';
import { Header } from '../components/Header';

import appCss from '../styles.css?url';

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  notFoundComponent: NotFound,
  errorComponent: RootError,
  shellComponent: RootDocument,
  component: RootLayout,
});

function RootLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const showHeader = pathname !== '/login';

  return (
    <>
      {showHeader ? <Header /> : null}
      <Outlet />
    </>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            {
              name: 'Tanstack Query',
              render: <ReactQueryDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-2xl flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
        404
      </p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-base leading-7 text-slate-600">
        The page you were looking for does not exist or has moved.
      </p>
      <Link className="text-sm font-medium underline underline-offset-4" to="/">
        Back to home
      </Link>
    </div>
  );
}

function RootError({ error, reset }: ErrorComponentProps) {
  const message = error instanceof Error ? error.message : 'Unexpected error';

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-500/80">
        Error
      </p>
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-base leading-7 text-slate-600">
        Try again or head back home. If the problem persists, contact support.
      </p>
      <div className="w-full rounded-md border border-black/10 bg-white/80 p-4 text-left text-sm text-slate-600">
        {message}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
        <Link
          className="text-sm font-medium underline underline-offset-4"
          to="/"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
