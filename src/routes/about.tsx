import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
  component: About,
});

function About() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:px-8">
      <section className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          About
        </p>
        <h1 className="mb-3 text-3xl font-bold text-slate-900 sm:text-4xl">
          Keep your subscriptions in view.
        </h1>
        <p className="m-0 max-w-3xl text-base leading-7 text-slate-600">
          EverySub brings your subscription costs, upcoming renewals, and
          recorded billing history into one place. Organize subscriptions in
          collections and see how they add up over time.
        </p>
      </section>
    </main>
  );
}
