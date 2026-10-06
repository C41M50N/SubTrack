import { CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type StatementLine = {
  date: string;
  merchant: string;
  amount: string;
  /** A recurring charge, highlighted the way smart import picks it out. */
  recurring?: boolean;
};

const LINES: StatementLine[] = [
  { date: '09/03', merchant: 'NETFLIX.COM', amount: '15.49', recurring: true },
  { date: '09/05', merchant: 'SHELL OIL 5744', amount: '52.30' },
  { date: '09/07', merchant: 'SPOTIFY USA', amount: '11.99', recurring: true },
  {
    date: '09/09',
    merchant: 'APPLE.COM/BILL',
    amount: '2.99',
    recurring: true,
  },
  { date: '09/12', merchant: 'BLUE BOTTLE #12', amount: '6.75' },
  {
    date: '09/14',
    merchant: 'NOTION LABS INC',
    amount: '10.00',
    recurring: true,
  },
  { date: '09/15', merchant: 'TRADER JOE’S #552', amount: '48.17' },
  { date: '09/16', merchant: 'CHEVRON 0091', amount: '41.08' },
  { date: '09/19', merchant: 'WHOLE FOODS MKT', amount: '86.42' },
];

const RECURRING_COUNT = LINES.filter((line) => line.recurring).length;

/**
 * A card statement with its subscriptions highlighted, so the drop zone shows
 * what smart import does instead of describing it. Purely decorative.
 */
export function StatementIllustration({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none select-none', className)}
    >
      {/* Fades out below what it found, so the statement reads as continuing
          rather than being cut off by the drop zone's edge. */}
      <div className="h-110 w-68 rotate-[2.5deg] rounded-lg bg-card [mask-image:linear-gradient(to_bottom,#000_60%,transparent_78%)] px-4.5 pt-5 shadow-[0_24px_40px_-8px_rgb(20_35_60/0.16),0_2px_4px_rgb(20_35_60/0.08)] ring-1 ring-foreground/5">
        <div className="flex items-start justify-between border-b border-dashed border-foreground/20 pb-3.5">
          <div className="flex flex-col gap-1">
            <span className="text-[13px]/4 font-semibold">Card statement</span>
            <span className="font-mono text-[11px]/3.5 text-muted-foreground">
              Sep 1 – Sep 30
            </span>
          </div>
          <span className="font-mono text-[11px]/4 text-muted-foreground">
            •••• 4021
          </span>
        </div>
        <ul className="mt-3.5 flex flex-col gap-1 font-mono text-[11px]/3.5">
          {LINES.map((line) => (
            <li
              key={line.date}
              className={cn(
                'flex h-7 items-center gap-2.5 rounded-[5px] px-2',
                line.recurring
                  ? 'bg-primary/12 font-medium text-primary dark:bg-primary-light/15 dark:text-primary-light'
                  : 'text-muted-foreground',
              )}
            >
              <span className="w-9.5 shrink-0 opacity-70">{line.date}</span>
              <span className="min-w-0 flex-1 truncate">{line.merchant}</span>
              <span className="w-11 shrink-0 text-right">{line.amount}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="absolute top-77 -left-6 flex -rotate-3 items-center gap-2.5 rounded-full bg-popover py-2 pr-4 pl-2.5 text-sm font-semibold text-popover-foreground shadow-[0_12px_24px_-4px_rgb(20_35_60/0.2),0_1px_3px_rgb(20_35_60/0.1)] ring-1 ring-foreground/5">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <CheckIcon className="size-3.5" strokeWidth={3} />
        </span>
        {RECURRING_COUNT} subscriptions found
      </div>
    </div>
  );
}
