'use client';

import { IconBrandGithub } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Access', href: '#access' },
    { label: 'FAQ', href: '#faq' },
  ],
  resources: [
    {
      label: 'GitHub',
      href: 'https://github.com/C41M50N/SubTrack',
      external: true,
    },
    { label: 'Log in', href: '/auth/login' },
    { label: 'Sign up', href: '/auth/signup' },
  ],
};

export function Footer() {
  return (
    <footer className="border-gray-200 border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/">
              <Image
                alt="SubTrack"
                height={24}
                src="/subtrack_full.jpg"
                width={180}
              />
            </Link>
            <p className="mt-4 max-w-sm text-gray-600 text-sm leading-6">
              A straightforward dashboard for tracking recurring costs, renewal
              dates, organization, reminders, and exports.
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                aria-label="SubTrack on GitHub"
                className="rounded-md p-2 text-gray-500 transition-colors hover:bg-brand-50 hover:text-brand-700"
                href="https://github.com/C41M50N/SubTrack"
                rel="noreferrer"
                target="_blank"
              >
                <IconBrandGithub className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-950 text-sm">Product</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    className="text-gray-600 text-sm transition-colors hover:text-brand-700"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-950 text-sm">Resources</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    className="text-gray-600 text-sm transition-colors hover:text-brand-700"
                    href={link.href}
                    rel={link.external ? 'noreferrer' : undefined}
                    target={link.external ? '_blank' : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-gray-200 border-t pt-8">
          <p className="text-center text-gray-500 text-sm">
            Made by{' '}
            <Link
              className="font-medium text-gray-700 hover:text-gray-950"
              href="https://www.linkedin.com/in/charles-buffington/"
              rel="noreferrer"
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
