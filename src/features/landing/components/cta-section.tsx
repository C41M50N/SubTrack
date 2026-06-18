'use client';

import { AnimatedSection } from './animated-section';
import { Eyebrow } from './eyebrow';
import { LandingPrimaryAction } from './landing-action';

export function CTASection() {
  return (
    <section className="relative isolate overflow-hidden bg-ink py-20 md:py-28">
      <div
        aria-hidden="true"
        className="-z-10 grain-overlay pointer-events-none absolute inset-0 opacity-[0.06]"
      />
      <div
        aria-hidden="true"
        className="-z-10 -translate-x-1/2 pointer-events-none absolute bottom-[-8rem] left-1/2 h-[440px] w-[760px] rounded-full bg-brand-500/25 blur-[140px]"
      />

      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <AnimatedSection className="mx-auto max-w-2xl">
          <Eyebrow className="justify-center" tone="dark">
            Ready when you are
          </Eyebrow>
          <h2 className="mt-4 text-balance font-bold text-3xl text-white tracking-tight sm:text-4xl">
            Bring every subscription into one clear view
          </h2>
          <p className="mt-4 text-pretty text-gray-400 text-lg leading-8">
            Add the services you care about, organize them your way, and make
            renewal dates easier to act on.
          </p>
          <div className="mt-9">
            <LandingPrimaryAction className="h-11 px-7" />
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
