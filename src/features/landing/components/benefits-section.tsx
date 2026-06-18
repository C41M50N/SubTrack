'use client';

import {
  IconBrandGithub,
  IconDownload,
  IconShieldLock,
} from '@tabler/icons-react';

import {
  AnimatedSection,
  AnimatedStaggerContainer,
  AnimatedStaggerItem,
} from './animated-section';
import { Eyebrow } from './eyebrow';

const benefits = [
  {
    icon: IconShieldLock,
    title: 'No bank connection',
    description:
      'SubTrack does not need account aggregation. You choose the subscriptions and details you want to track.',
  },
  {
    icon: IconDownload,
    title: 'Portable records',
    description:
      'Exports keep your subscription list useful outside the app for budgeting, cleanup, and review.',
  },
  {
    icon: IconBrandGithub,
    title: 'Open-source project',
    description:
      'The code is public, which makes SubTrack easy to inspect, learn from, and improve over time.',
  },
];

export function BenefitsSection() {
  return (
    <section className="relative isolate overflow-hidden bg-ink py-16 md:py-24">
      <div
        aria-hidden="true"
        className="-z-10 grain-overlay pointer-events-none absolute inset-0 opacity-[0.06]"
      />
      <div
        aria-hidden="true"
        className="-z-10 -translate-x-1/2 pointer-events-none absolute top-[-6rem] left-1/2 h-[420px] w-[820px] rounded-full bg-brand-500/20 blur-[130px]"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <Eyebrow tone="dark">Privacy first</Eyebrow>
          <h2 className="mt-4 text-balance font-bold text-3xl text-white tracking-tight sm:text-4xl">
            Private by default
          </h2>
          <p className="mt-4 text-pretty text-gray-400 text-lg leading-8">
            The product is designed for deliberate tracking instead of hidden
            data access. It is simple because the workflow should stay simple.
          </p>
        </AnimatedSection>

        <AnimatedStaggerContainer className="mt-12 grid gap-6 md:grid-cols-3">
          {benefits.map((benefit) => (
            <AnimatedStaggerItem key={benefit.title}>
              <div className="group hover:-translate-y-1 h-full rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xs transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-brand-200 ring-1 ring-white/10 transition-colors duration-300 group-hover:bg-white/15">
                  <benefit.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-semibold text-lg text-white">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-gray-400 leading-7">
                  {benefit.description}
                </p>
              </div>
            </AnimatedStaggerItem>
          ))}
        </AnimatedStaggerContainer>
      </div>
    </section>
  );
}
