'use client';

import Link from 'next/link';
import { AnimatedSection } from './animated-section';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-8 py-16 text-center md:px-16 md:py-20">
            {/* Background decoration */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
            </div>

            <div className="relative">
              <h2 className="font-bold text-3xl text-white tracking-tight sm:text-4xl">
                Ready to take control of your subscriptions?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-gray-400 text-lg">
                Join thousands of people who\'ve stopped letting subscriptions
                drain their wallets. Start tracking today.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/auth/signup">
                  <Button
                    className="h-12 px-8 text-base"
                    size="lg"
                    variant="default"
                  >
                    Get Started for $15
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-gray-500 text-sm">
                One-time payment. Lifetime access. 30-day money-back guarantee.
              </p>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
