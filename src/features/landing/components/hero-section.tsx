'use client';

import { IconLock } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Eyebrow } from './eyebrow';
import { LandingPrimaryAction } from './landing-action';

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden pt-28 pb-10 md:pt-36 md:pb-16">
      {/* Ambient brand glow behind the hero. */}
      <div
        aria-hidden="true"
        className="-z-10 -translate-x-1/2 pointer-events-none absolute top-[-6rem] left-1/2 h-[460px] w-[820px] max-w-none rounded-full bg-brand-200/45 blur-[130px]"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.5 }}
          >
            <Eyebrow>Open-source subscription tracker</Eyebrow>
          </motion.div>

          <motion.h1
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 text-balance font-bold text-4xl text-gray-950 tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.05]"
            initial={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            Subscription tracking, without bank linking
          </motion.h1>

          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-6 max-w-2xl text-pretty text-gray-600 text-lg leading-8"
            initial={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            SubTrack gives you a clean place to track recurring costs, renewal
            dates, categories, collections, reminders, and exports without
            connecting financial accounts.
          </motion.p>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.5, delay: 0.18 }}
          >
            <LandingPrimaryAction className="h-11 px-7" />
            <Button asChild className="h-11 px-7" size="lg" variant="outline">
              <Link href="#features">See features</Link>
            </Button>
          </motion.div>

          <motion.p
            animate={{ opacity: 1 }}
            className="mt-5 text-gray-500 text-sm"
            initial={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.26 }}
          >
            Open source, manually controlled, and built for exportable data.
          </motion.p>
        </div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="relative mt-14 md:mt-16"
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.24 }}
        >
          {/* Soft glow grounding the screenshot. */}
          <div
            aria-hidden="true"
            className="-z-10 -translate-x-1/2 pointer-events-none absolute top-12 left-1/2 h-72 w-[88%] max-w-4xl rounded-full bg-brand-300/25 blur-[110px]"
          />

          {/* Outer tray + inner screen (nested "device" frame). */}
          <div className="mx-auto max-w-5xl rounded-2xl border border-gray-200/70 bg-gray-50/70 p-1.5 shadow-brand-lg backdrop-blur-sm sm:p-2">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex h-10 items-center gap-3 border-gray-100 border-b bg-gray-50/80 px-4">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                </div>
              </div>
              <Image
                alt="SubTrack dashboard with subscription table and spending insights"
                className="w-full"
                height={2000}
                priority
                src="/dashboard.png"
                width={3000}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
