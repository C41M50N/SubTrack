'use client';

import { IconBrandGithub, IconBrandLinkedin } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ],
  resources: [
    {
      label: 'GitHub',
      href: 'https://github.com/C41M50N/SubTrack',
      external: true,
    },
    { label: 'Login', href: '/auth/login' },
    { label: 'Sign Up', href: '/auth/signup' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand column */}
          <div className="md:col-span-2">
            <Link href="/">
              <Image
                alt="SubTrack"
                height={24}
                src="/subtrack_full.jpg"
                width={180}
              />
            </Link>
            <p className="mt-4 max-w-sm text-gray-600 text-sm">
              The straightforward way to track your subscriptions. No bank
              linking, no complexity—just clarity on where your money goes.
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
                href="https://github.com/C41M50N/SubTrack"
                target="_blank"
              >
                <IconBrandGithub className="h-5 w-5" />
              </Link>
              <Link
                className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
                href="https://www.linkedin.com/in/charles-buffington/"
                target="_blank"
              >
                <IconBrandLinkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Product</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    className="text-gray-600 text-sm transition-colors hover:text-gray-900"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources links */}
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Resources</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    className="text-gray-600 text-sm transition-colors hover:text-gray-900"
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-center text-gray-500 text-sm">
            Made by{' '}
            <Link
              className="font-medium text-gray-700 hover:text-gray-900"
              href="https://www.linkedin.com/in/charles-buffington/"
              target="_blank"
            >
              Charles Buffington
            </Link>
            . All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
