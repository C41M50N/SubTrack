'use client';

import { IconBrandGithub, IconDashboard, IconMenu2 } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/features/auth/auth-client';
import { cn } from '@/utils';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

export function Header() {
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link className="flex items-center" href="/">
          <Image
            alt="SubTrack"
            height={24}
            src="/subtrack_full.jpg"
            width={210}
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              className="rounded-md px-3 py-2 font-medium text-gray-600 text-sm transition-colors hover:bg-gray-100 hover:text-gray-900"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
          <Link
            className="ml-2 flex items-center gap-1.5 rounded-md px-3 py-2 font-medium text-gray-600 text-sm transition-colors hover:bg-gray-100 hover:text-gray-900"
            href="https://github.com/C41M50N/SubTrack"
            target="_blank"
          >
            <IconBrandGithub className="size-4" />
            GitHub
          </Link>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          {!session ? (
            <>
              <Link href="/auth/login">
                <Button size="sm" variant="ghost">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" variant="default">
                  Get Started
                </Button>
              </Link>
            </>
          ) : (
            <Button
              onClick={() => router.push('/dashboard')}
              size="sm"
              variant="default"
            >
              <IconDashboard className="mr-1.5" size={16} />
              Dashboard
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          type="button"
        >
          <IconMenu2 className="size-5" />
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        className={cn(
          'border-b border-gray-200/50 bg-white/95 backdrop-blur-md md:hidden',
          mobileMenuOpen ? 'block' : 'hidden'
        )}
      >
        <div className="space-y-1 px-4 py-3">
          {navLinks.map((link) => (
            <Link
              className="block rounded-md px-3 py-2 font-medium text-gray-600 text-sm hover:bg-gray-100 hover:text-gray-900"
              href={link.href}
              key={link.href}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            className="flex items-center gap-1.5 rounded-md px-3 py-2 font-medium text-gray-600 text-sm hover:bg-gray-100 hover:text-gray-900"
            href="https://github.com/C41M50N/SubTrack"
            target="_blank"
          >
            <IconBrandGithub className="size-4" />
            GitHub
          </Link>
          <div className="flex gap-2 pt-2">
            {!session ? (
              <>
                <Link className="flex-1" href="/auth/login">
                  <Button className="w-full" size="sm" variant="ghost">
                    Log in
                  </Button>
                </Link>
                <Link className="flex-1" href="/auth/signup">
                  <Button className="w-full" size="sm" variant="default">
                    Get Started
                  </Button>
                </Link>
              </>
            ) : (
              <Button
                className="w-full"
                onClick={() => router.push('/dashboard')}
                size="sm"
                variant="default"
              >
                <IconDashboard className="mr-1.5" size={16} />
                Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
