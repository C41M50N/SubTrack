'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LandingPrimaryAction } from './landing-action';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-24 pb-8 md:pt-32 md:pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            animate={{ opacity: 1, y: 0 }}
            className="font-bold text-4xl text-gray-950 tracking-tight sm:text-5xl"
            initial={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.5 }}
          >
            Subscription tracking, without bank linking
          </motion.h1>

          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-6 max-w-3xl text-gray-600 text-lg leading-8"
            initial={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            SubTrack gives you a clean place to track recurring costs, renewal
            dates, categories, collections, reminders, and exports without
            connecting financial accounts.
          </motion.p>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.5, delay: 0.16 }}
          >
            <LandingPrimaryAction className="h-11 px-7" />
            <Button asChild className="h-11 px-7" size="lg" variant="outline">
              <Link href="#features">See Features</Link>
            </Button>
          </motion.div>

          <motion.p
            animate={{ opacity: 1 }}
            className="mt-5 text-gray-500 text-sm"
            initial={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
          >
            Open source, manually controlled, and built for exportable data.
          </motion.p>
        </div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-12"
          initial={{ opacity: 0, y: 28 }}
          transition={{ duration: 0.6, delay: 0.24 }}
        >
          <div className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex h-9 items-center gap-1.5 border-gray-100 border-b bg-gray-50 px-4">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
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
        </motion.div>
      </div>
    </section>
  );
}
