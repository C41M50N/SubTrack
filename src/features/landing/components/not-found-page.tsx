import { Link, useHydrated, useLocation } from '@tanstack/react-router';
import { format } from 'date-fns';
import { useState } from 'react';

import { ArrowRightIcon } from '@/features/landing/components/icons';
import { CompactFooter } from '@/features/landing/components/site-footer';
import { Wordmark } from '@/features/landing/components/wordmark';
import {
  arrowNudge,
  contentColumn,
  focusRing,
  landingButtonVariants,
} from '@/features/landing/styles';
import { cn } from '@/lib/utils';

/**
 * The receipt's barcode, as alternating bar and gap widths in pixels, read
 * left to right across a 264×40 box.
 */
const BARCODE_RUNS =
  '1311412221131112123223423122321121232233124212224222222222111213132112314232332221423131231213121342234221111313133143432313222';

const BARCODE_PATH = [...BARCODE_RUNS].reduce<{ x: number; path: string }>(
  ({ x, path }, run, index) => {
    const width = Number(run);
    const bar = index % 2 === 0 ? `M${x} 0h${width}v40h-${width}z` : '';

    return { x: x + width, path: path + bar };
  },
  { x: 0, path: '' },
).path;

/** The torn bottom edge: 32 teeth, each 10px wide and 9px deep. */
const TORN_EDGE_POINTS = [
  '0,0 320,0',
  ...Array.from(
    { length: 32 },
    (_, i) => `${315 - i * 10},9 ${310 - i * 10},0`,
  ),
].join(' ');

/**
 * Shown for any URL that doesn't match a page. It's light-only, like the
 * landing page.
 */
export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-between gap-12 bg-white py-4 text-ink scheme-light [--gutter:--spacing(5)] sm:py-10 sm:[--gutter:--spacing(8)]">
      <header className={cn('flex h-10 shrink-0 items-center', contentColumn)}>
        <Link to="/" className={cn('flex rounded-md', focusRing)}>
          <Wordmark />
        </Link>
      </header>
      <main
        className={cn(
          'flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-10',
          contentColumn,
        )}
      >
        <div className="flex flex-col gap-10 lg:max-w-140 lg:grow lg:basis-0">
          <div className="flex flex-col gap-6">
            <p className="text-sm/4.5 font-semibold tracking-[0.02em] text-brand">
              Error 404
            </p>
            <h1 className="text-[44px]/12 tracking-[-0.045em] text-balance sm:text-[60px]/16 xl:text-[72px]/19 xl:text-wrap">
              This page isn’t on the statement.
            </h1>
            <p className="max-w-120 text-[17px]/7 text-ink-muted sm:text-[19px]/7.5">
              The link may be old, or the page may have moved. Either way,
              nothing was charged for the detour.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/dashboard"
              className={landingButtonVariants({
                size: 'lg',
                className:
                  'shadow-[inset_0_1px_0_#FFFFFF24,0_1px_2px_#1018281F]',
              })}
            >
              Back to dashboard
              <ArrowRightIcon className={cn('size-4', arrowNudge)} />
            </Link>
            <Link
              to="/"
              className={landingButtonVariants({
                variant: 'secondary',
                size: 'lg',
                className: 'shadow-[0_1px_2px_#1018280D]',
              })}
            >
              Go to homepage
            </Link>
          </div>
        </div>
        <div
          aria-hidden
          className="flex h-120 shrink-0 items-center justify-center overflow-clip rounded-[28px] bg-surface sm:h-160 lg:w-100 xl:w-120"
        >
          <Receipt />
        </div>
      </main>
      <CompactFooter className={contentColumn} />
    </div>
  );
}

/**
 * A till receipt for the missing page. It prints the time it was viewed, which
 * waits for hydration since the server doesn't know the visitor's time zone.
 */
function Receipt() {
  const pathname = useLocation({ select: (location) => location.pathname });
  const hydrated = useHydrated();
  const [printedAt] = useState(() => new Date());

  return (
    <div className="flex w-80 shrink-0 rotate-4 flex-col [filter:drop-shadow(0_24px_32px_#14233C29)_drop-shadow(0_2px_4px_#14233C14)] [zoom:0.8] sm:[zoom:1] lg:[zoom:0.9] xl:[zoom:1] motion-safe:animate-product-rise">
      <div className="flex flex-col gap-5 rounded-t-md bg-white px-7 pt-8 pb-6 font-mono">
        <div className="flex flex-col items-center gap-1.5 text-xs/4 text-ink-muted">
          <p className="text-[15px]/5 font-semibold tracking-[0.18em] text-ink">
            EVERYSUB
          </p>
          <p>Receipt No. 404</p>
          {/* A non-breaking space holds the line until the time appears. */}
          <p>
            {hydrated
              ? format(printedAt, 'EEE, MMM d yyyy · h:mm a')
              : '\u00A0'}
          </p>
        </div>
        <dl className="flex flex-col gap-2.5 border-y border-dashed border-[#CDD3DA] py-4.5 text-[13px]/4.5">
          <ReceiptLine label="Page" value={pathname} />
          <ReceiptLine label="Status" value="Not found" />
          <ReceiptLine label="Renews" value="Never" />
        </dl>
        {/* Room for the stamp. The rotation lives on the wrapper so the
            stamp itself can press in from its center. */}
        <div className="relative h-19 shrink-0">
          <div className="absolute top-3.5 left-3 origin-top-left -rotate-12">
            <div className="flex flex-col items-center gap-0.5 rounded-[10px] border-3 border-brand px-4.5 pt-2.5 pb-2.25 text-brand opacity-92 shadow-[inset_0_0_0_2px_#FFFFFF,inset_0_0_0_3px_var(--color-brand)] motion-safe:animate-stamp-in">
              <p className="font-sans text-[30px]/8 font-extrabold tracking-[0.06em]">
                NOT FOUND
              </p>
              <p className="text-[11px]/3.5 font-semibold tracking-[0.24em]">
                ERROR · 404
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <p className="text-sm/5 font-semibold tracking-[0.08em]">TOTAL</p>
          <p className="text-xl/6 font-semibold">$0.00</p>
        </div>
        <div className="flex flex-col items-center gap-2.5 pt-1">
          <svg viewBox="0 0 264 40" className="h-10 w-66 fill-ink">
            <path d={BARCODE_PATH} />
          </svg>
          <p className="text-xs/4 text-ink-muted">Thanks for stopping by.</p>
        </div>
      </div>
      <svg viewBox="0 0 320 9" className="h-2.25 w-full fill-white">
        <polygon points={TORN_EDGE_POINTS} />
      </svg>
    </div>
  );
}

function ReceiptLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd className="min-w-0 truncate">{value}</dd>
    </div>
  );
}
