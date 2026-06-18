'use client';

import { IconMenu2, IconX } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/features/auth/auth-client';
import { cn } from '@/utils';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#access', label: 'Access' },
  { href: '#faq', label: 'FAQ' },
];

export function Header() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-gray-200/70 border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/65">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link className="flex items-center" href="/" onClick={closeMobileMenu}>
          <Image
            alt="SubTrack"
            height={24}
            priority
            src="/subtrack_full.jpg"
            width={210}
          />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              className="rounded-md px-3 py-2 font-medium text-gray-600 text-sm transition-colors hover:bg-gray-100 hover:text-gray-950"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
          <Link
            className="rounded-md px-3 py-2 font-medium text-gray-600 text-sm transition-colors hover:bg-gray-100 hover:text-gray-950"
            href="https://github.com/C41M50N/SubTrack"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </Link>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <Button asChild size="sm" variant="default">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button asChild size="sm" variant="default">
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <button
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation"
          className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-950 md:hidden"
          onClick={() => setMobileMenuOpen((value) => !value)}
          type="button"
        >
          {mobileMenuOpen ? (
            <IconX className="h-5 w-5" />
          ) : (
            <IconMenu2 className="h-5 w-5" />
          )}
        </button>
      </nav>

      <div
        className={cn(
          'border-gray-200 border-b bg-white md:hidden',
          mobileMenuOpen ? 'block' : 'hidden'
        )}
      >
        <div className="space-y-1 px-4 py-3">
          {navLinks.map((link) => (
            <Link
              className="block rounded-md px-3 py-2 font-medium text-gray-600 text-sm transition-colors hover:bg-gray-100 hover:text-gray-950"
              href={link.href}
              key={link.href}
              onClick={closeMobileMenu}
            >
              {link.label}
            </Link>
          ))}
          <Link
            className="block rounded-md px-3 py-2 font-medium text-gray-600 text-sm transition-colors hover:bg-gray-100 hover:text-gray-950"
            href="https://github.com/C41M50N/SubTrack"
            onClick={closeMobileMenu}
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </Link>

          <div className="flex gap-2 pt-2">
            {session ? (
              <Button asChild className="w-full" size="sm">
                <Link href="/dashboard" onClick={closeMobileMenu}>
                  Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild className="flex-1" size="sm" variant="ghost">
                  <Link href="/auth/login" onClick={closeMobileMenu}>
                    Log in
                  </Link>
                </Button>
                <Button asChild className="flex-1" size="sm">
                  <Link href="/auth/signup" onClick={closeMobileMenu}>
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
