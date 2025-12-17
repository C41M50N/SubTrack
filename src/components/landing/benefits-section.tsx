'use client';

import {
  IconBuildingBank,
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
    title: 'Privacy-first',
    description:
      "Your data stays yours. We don't sell your information or share it with third parties. Ever.",
  },
  {
    icon: IconBuildingBank,
    title: 'No bank linking required',
    description:
      "Unlike other tools, we don't need access to your bank accounts. You control what information you add.",
  },
  {
    icon: IconDownload,
    title: 'Full data portability',
    description:
      'Export your data anytime in standard formats. If you ever want to leave, your data comes with you.',
  },
];

export function BenefitsSection() {
  return (
    <section className="bg-gray-900 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mx-auto max-w-2xl text-center">
          <h2 className="font-bold text-3xl text-white tracking-tight sm:text-4xl">
            Built different
          </h2>
          <p className="mt-4 text-gray-400 text-lg">
            We believe subscription tracking should be simple and private.
            That\'s why we built SubTrack with these principles at its core.
          </p>
        </AnimatedSection>

        <AnimatedStaggerContainer className="mt-12 grid gap-8 md:mt-16 md:grid-cols-3">
          {benefits.map((benefit) => (
            <AnimatedStaggerItem key={benefit.title}>
              <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                  <benefit.icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="mt-4 font-semibold text-lg text-white">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-gray-400">{benefit.description}</p>
              </div>
            </AnimatedStaggerItem>
          ))}
        </AnimatedStaggerContainer>
      </div>
    </section>
  );
}
