'use client';

import {
  IconAlertTriangle,
  IconCalendarDue,
  IconReceiptOff,
} from '@tabler/icons-react';
import {
  AnimatedSection,
  AnimatedStaggerContainer,
  AnimatedStaggerItem,
} from './animated-section';
import { Eyebrow } from './eyebrow';

const problems = [
  {
    icon: IconReceiptOff,
    title: 'Scattered receipts',
    description:
      'Subscriptions live across app stores, email receipts, invoices, and old trial signups.',
  },
  {
    icon: IconCalendarDue,
    title: 'Renewals sneak up',
    description:
      'Monthly and annual billing cycles are easy to miss until the charge has already happened.',
  },
  {
    icon: IconAlertTriangle,
    title: 'Costs blur together',
    description:
      'Small recurring charges are hard to evaluate when they are spread across different services.',
  },
];

export function ProblemSection() {
  return (
    <section className="border-gray-200 border-y bg-gray-50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <Eyebrow>The problem</Eyebrow>
          <h2 className="mt-4 text-balance font-bold text-3xl text-gray-950 tracking-tight sm:text-4xl">
            The hard part is seeing everything at once
          </h2>
          <p className="mt-4 text-pretty text-gray-600 text-lg leading-8">
            SubTrack is intentionally manual, so you decide what goes in. Once
            it is there, the monthly picture gets much easier to read.
          </p>
        </AnimatedSection>

        <AnimatedStaggerContainer className="mt-12 grid gap-6 md:grid-cols-3">
          {problems.map((problem) => (
            <AnimatedStaggerItem key={problem.title}>
              <div className="group hover:-translate-y-1 h-full rounded-xl border border-gray-200/80 bg-white p-6 shadow-brand-xs transition-all duration-300 hover:border-brand-200 hover:shadow-brand">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-colors duration-300 group-hover:bg-brand-100">
                  <problem.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-semibold text-gray-950 text-lg">
                  {problem.title}
                </h3>
                <p className="mt-2 text-gray-600 leading-7">
                  {problem.description}
                </p>
              </div>
            </AnimatedStaggerItem>
          ))}
        </AnimatedStaggerContainer>
      </div>
    </section>
  );
}
