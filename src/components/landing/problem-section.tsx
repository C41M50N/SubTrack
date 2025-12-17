'use client';

import {
  IconAlertTriangle,
  IconCreditCard,
  IconEyeOff,
} from '@tabler/icons-react';
import {
  AnimatedSection,
  AnimatedStaggerContainer,
  AnimatedStaggerItem,
} from './animated-section';

const problems = [
  {
    icon: IconCreditCard,
    title: 'Unexpected charges',
    description:
      'That free trial you forgot about? It just charged your card. Again.',
  },
  {
    icon: IconEyeOff,
    title: 'Hidden costs',
    description:
      "Small monthly fees add up. $10 here, $15 there—suddenly it's $200/month.",
  },
  {
    icon: IconAlertTriangle,
    title: 'Missed cancellations',
    description:
      "You meant to cancel before the annual renewal. Now you're stuck for another year.",
  },
];

export function ProblemSection() {
  return (
    <section className="bg-gray-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <h2 className="font-bold text-3xl text-gray-900 tracking-tight sm:text-4xl">
            Subscriptions are eating your budget
          </h2>
          <p className="mt-4 text-gray-600 text-lg">
            The average person has 12 active subscriptions and underestimates
            their monthly spend by 2-3x. Sound familiar?
          </p>
        </AnimatedSection>

        <AnimatedStaggerContainer className="mt-12 grid gap-8 md:mt-16 md:grid-cols-3">
          {problems.map((problem) => (
            <AnimatedStaggerItem key={problem.title}>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50">
                  <problem.icon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900 text-lg">
                  {problem.title}
                </h3>
                <p className="mt-2 text-gray-600">{problem.description}</p>
              </div>
            </AnimatedStaggerItem>
          ))}
        </AnimatedStaggerContainer>
      </div>
    </section>
  );
}
