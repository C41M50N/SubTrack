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
import { cn } from '@/utils';
import { AnimatedSection } from './animated-section';

const features = [
  {
    icon: IconTable,
    title: 'Manage every subscription',
    description:
      'Use a focused table to sort, filter, edit, move, and review the services you pay for.',
    image: '/assets/table.png',
  },
  {
    icon: IconChartBar,
    title: 'Read the spending picture',
    description:
      'See recurring cost metrics by week, month, and year so the total is visible before renewal dates arrive.',
    image: '/assets/metrics.png',
  },
  {
    icon: IconCategory,
    title: 'Create useful categories',
    description:
      'Group subscriptions by the way you think about them, from streaming and software to work tools.',
    image: '/assets/categories.png',
  },
  {
    icon: IconFolders,
    title: 'Separate collections',
    description:
      'Keep personal, work, household, or project-specific subscriptions in separate collections.',
    image: '/assets/collections.png',
  },
  {
    icon: IconDownload,
    title: 'Export your data',
    description:
      'Download subscription data when you need a spreadsheet, backup, or a clean handoff.',
    image: '/assets/export.png',
  },
  {
    icon: IconBell,
    title: 'Stay aware of renewals',
    description:
      'Use summary emails and cancellation reminders to keep renewal dates from disappearing into the background.',
    image: '/assets/email.png',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-16 md:py-24" id="features">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <h2 className="font-bold text-3xl text-gray-950 tracking-tight sm:text-4xl">
            Built around the subscription workflow
          </h2>
          <p className="mt-4 text-gray-600 text-lg leading-8">
            The app stays focused on the core loop: add what you pay for,
            organize it, understand the total, and keep your data portable.
          </p>
        </AnimatedSection>

        <div className="mt-14 space-y-16 md:mt-20 md:space-y-24">
          {features.map((feature, index) => (
            <AnimatedSection delay={0.08} key={feature.title}>
              <div
                className={cn(
                  'grid items-center gap-8 lg:grid-cols-2 lg:gap-14',
                  index % 2 === 1 && 'lg:[&>*:first-child]:order-2'
                )}
              >
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-md border border-gray-200 bg-white">
                    <feature.icon className="h-5 w-5 text-[#516282]" />
                  </div>
                  <h3 className="mt-5 font-semibold text-2xl text-gray-950">
                    {feature.title}
                  </h3>
                  <p className="mt-3 max-w-xl text-gray-600 text-lg leading-8">
                    {feature.description}
                  </p>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-6 lg:p-8">
                  <Image
                    alt={feature.title}
                    className="w-full rounded-md border border-gray-200 bg-white"
                    height={400}
                    src={feature.image}
                    width={600}
                  />
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
