'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-blue-100 via-blue-50 to-transparent opacity-60 blur-3xl" />
        <div className="absolute top-1/4 right-0 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-gradient-to-bl from-indigo-100 via-purple-50 to-transparent opacity-40 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-medium text-blue-700 text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Simple subscription tracking
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 font-bold text-4xl text-gray-900 tracking-tight sm:text-5xl md:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Stop losing money to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              forgotten subscriptions
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-6 max-w-2xl text-gray-600 text-lg md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            SubTrack is a straightforward tool to track all your subscriptions
            in one place. No bank linking, no complicated setup—just a clean
            dashboard to see exactly where your money goes each month.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/auth/signup">
              <Button
                className="h-12 px-8 text-base"
                size="lg"
                variant="default"
              >
                Get Started for $15
              </Button>
            </Link>
            <Link href="#features">
              <Button
                className="h-12 px-8 text-base"
                size="lg"
                variant="outline"
              >
                See how it works
              </Button>
            </Link>
          </motion.div>

          {/* Trust note */}
          <motion.p
            animate={{ opacity: 1 }}
            className="mt-4 text-gray-500 text-sm"
            initial={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            One-time payment. No recurring fees. Full access forever.
          </motion.p>
        </div>

        {/* Dashboard Preview */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 md:mt-20"
          initial={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <div className="relative mx-auto max-w-5xl">
            {/* Glow effect behind image */}
            <div className="absolute inset-0 -z-10 translate-y-4 rounded-2xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 blur-2xl" />

            {/* Dashboard image container */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
              <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <Image
                alt="SubTrack Dashboard"
                className="w-full"
                height={2000}
                priority
                quality={100}
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
