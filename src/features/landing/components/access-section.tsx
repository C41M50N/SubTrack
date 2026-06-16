'use client';

import { IconBrandGithub, IconCheck } from '@tabler/icons-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from './animated-section';
import { LandingPrimaryAction } from './landing-action';

const accessPoints = [
  'Create an account and start tracking subscriptions in the dashboard',
  'Use collections and categories to keep personal and work costs separate',
  'Review the public codebase before depending on the app',
  'Export data when you want a backup or spreadsheet view',
];

export function AccessSection() {
  return (
    <section
      className="border-gray-200 border-b bg-gray-50 py-16 md:py-24"
      id="access"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-[1fr_0.85fr] lg:px-8">
        <AnimatedSection>
          <h2 className="font-bold text-3xl text-gray-950 tracking-tight sm:text-4xl">
            Start with the app, or inspect the code first
          </h2>
          <p className="mt-4 max-w-2xl text-gray-600 text-lg leading-8">
            SubTrack is a portfolio-grade product and an open-source project.
            The hosted app keeps the workflow fast, while GitHub keeps the
            implementation visible.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.08}>
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <ul className="space-y-4">
              {accessPoints.map((point) => (
                <li className="flex gap-3 text-gray-700" key={point}>
                  <IconCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <LandingPrimaryAction className="w-full" />
              <Button asChild className="w-full" variant="outline">
                <Link
                  href="https://github.com/C41M50N/SubTrack"
                  rel="noreferrer"
                  target="_blank"
                >
                  <IconBrandGithub className="mr-2 h-4 w-4" />
                  View GitHub
                </Link>
              </Button>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
