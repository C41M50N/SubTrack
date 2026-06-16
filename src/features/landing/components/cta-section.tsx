'use client';

import { AnimatedSection } from './animated-section';
import { LandingPrimaryAction } from './landing-action';

export function CTASection() {
  return (
    <section className="bg-gray-950 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <AnimatedSection className="mx-auto max-w-2xl">
          <h2 className="font-bold text-3xl text-white tracking-tight sm:text-4xl">
            Bring every subscription into one clear view
          </h2>
          <p className="mt-4 text-gray-400 text-lg leading-8">
            Add the services you care about, organize them your way, and make
            renewal dates easier to act on.
          </p>
          <div className="mt-8">
            <LandingPrimaryAction className="h-11 px-7" />
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
