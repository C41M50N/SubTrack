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
          A small starter with room to grow.
        </h1>
        <p className="m-0 max-w-3xl text-base leading-7 text-slate-600">
          TanStack Start gives you type-safe routing, server functions, and
          modern SSR defaults. Use this as a clean foundation, then layer in
          your own routes, styling, and add-ons.
        </p>
      </section>
    </main>
  );
}
