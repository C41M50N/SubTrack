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
    <section className="bg-gray-950 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <h2 className="font-bold text-3xl text-white tracking-tight sm:text-4xl">
            Private by default
          </h2>
          <p className="mt-4 text-gray-400 text-lg leading-8">
            The product is designed for deliberate tracking instead of hidden
            data access. It is simple because the workflow should stay simple.
          </p>
        </AnimatedSection>

        <AnimatedStaggerContainer className="mt-12 grid gap-6 md:grid-cols-3">
          {benefits.map((benefit) => (
            <AnimatedStaggerItem key={benefit.title}>
              <div className="h-full rounded-lg border border-gray-800 bg-gray-900 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-800">
                  <benefit.icon className="h-5 w-5 text-gray-100" />
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
