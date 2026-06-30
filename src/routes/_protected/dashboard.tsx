import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const displayName = user.name ?? user.email ?? 'there';

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:px-8">
      <h2 className="mb-4 text-2xl font-semibold">Dashboard</h2>
      <span className="text-base text-slate-600">Welcome, {displayName}!</span>
    </main>
  );
}
