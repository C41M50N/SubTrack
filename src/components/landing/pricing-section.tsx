'use client';

import { IconCheck } from '@tabler/icons-react';
import Link from 'next/link';
import { AnimatedSection } from './animated-section';
import { Button } from '@/components/ui/button';

const features = [
  'Unlimited subscriptions',
  'Unlimited collections',
  'Custom categories',
  'Cost analytics & insights',
  'CSV export',
  'Monthly summary emails',
  'Cancel reminders',
  'Lifetime updates',
];

export function PricingSection() {
  return (
    <section className="py-20 md:py-28" id="pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <h2 className="font-bold text-3xl text-gray-900 tracking-tight sm:text-4xl">
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-gray-600 text-lg">
            One price. Full access. No subscriptions to track your
            subscriptions.
          </p>
        </AnimatedSection>

        <AnimatedSection className="mt-12 md:mt-16" delay={0.1}>
          <div className="mx-auto max-w-lg">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
              {/* Header */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 px-8 py-8 text-center">
                <h3 className="font-semibold text-lg text-white">
                  Lifetime Access
                </h3>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="font-bold text-5xl text-white tracking-tight">
                    $15
                  </span>
                  <span className="text-gray-400 text-lg">USD</span>
                </div>
                <p className="mt-2 text-gray-400 text-sm">
                  One-time payment, forever access
                </p>
              </div>

              {/* Features */}
              <div className="px-8 py-8">
                <ul className="space-y-4">
                  {features.map((feature) => (
                    <li className="flex items-start gap-3" key={feature}>
                      <IconCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link className="mt-8 block" href="/auth/signup">
                  <Button className="h-12 w-full text-base" size="lg">
                    Get Started Now
                  </Button>
                </Link>

                <p className="mt-4 text-center text-gray-500 text-sm">
                  No recurring fees. No hidden costs.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
