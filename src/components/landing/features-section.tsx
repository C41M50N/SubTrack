'use client';

import {
  IconBell,
  IconCategory,
  IconChartBar,
  IconDownload,
  IconFolders,
  IconTable,
} from '@tabler/icons-react';
import Image from 'next/image';
import { AnimatedSection } from './animated-section';
import { cn } from '@/utils';

const features = [
  {
    icon: IconTable,
    title: 'All your subscriptions in one place',
    description:
      "A clean, powerful table view to manage every subscription. Sort by cost, filter by category, and see exactly what you're paying for at a glance.",
    image: '/assets/table.png',
  },
  {
    icon: IconChartBar,
    title: 'Know where your money goes',
    description:
      'Instant cost breakdowns show your monthly, yearly, and total spending. No surprises—just clear numbers that help you make smart decisions.',
    image: '/assets/metrics.png',
  },
  {
    icon: IconCategory,
    title: 'Organize with categories',
    description:
      'Create custom categories like "Streaming", "Software", or "Fitness". Group your subscriptions however makes sense for your life.',
    image: '/assets/categories.png',
  },
  {
    icon: IconFolders,
    title: 'Separate personal and work',
    description:
      'Use collections to keep different subscription groups organized. Perfect for separating personal expenses from business ones.',
    image: '/assets/collections.png',
  },
  {
    icon: IconDownload,
    title: 'Your data, your way',
    description:
      'Export everything to CSV anytime. Your subscription data belongs to you, and you can take it wherever you need.',
    image: '/assets/export.png',
  },
  {
    icon: IconBell,
    title: 'Stay informed',
    description:
      'Get monthly summary emails with upcoming renewals and spending insights. Never be surprised by a charge again.',
    image: '/assets/email.png',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 md:py-28" id="features">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <h2 className="font-bold text-3xl text-gray-900 tracking-tight sm:text-4xl">
            Everything you need to take control
          </h2>
          <p className="mt-4 text-gray-600 text-lg">
            Simple, focused tools that help you understand and manage your
            recurring expenses without the complexity.
          </p>
        </AnimatedSection>

        <div className="mt-16 space-y-20 md:mt-24 md:space-y-32">
          {features.map((feature, index) => (
            <AnimatedSection delay={0.1} key={feature.title}>
              <div
                className={cn(
                  'flex flex-col items-center gap-8 lg:flex-row lg:gap-16',
                  index % 2 === 1 && 'lg:flex-row-reverse'
                )}
              >
                {/* Text content */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="mt-4 font-semibold text-2xl text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-gray-600 text-lg leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Image */}
                <div className="flex-1">
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-lg">
                    <Image
                      alt={feature.title}
                      className="w-full"
                      height={400}
                      quality={100}
                      src={feature.image}
                      width={600}
                    />
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
