import type { ReactNode } from 'react';

import {
  DownloadIcon,
  MailIcon,
  WebhookIcon,
} from '@/features/landing/components/icons';
import { contentColumn, sectionHeading } from '@/features/landing/styles';
import { cn } from '@/lib/utils';

const MONTHLY_COSTS = [
  {
    name: 'Netflix',
    logo: '/landing/logos/netflix.png',
    billed: '$15.49 every month',
    monthly: '$15.49',
  },
  {
    name: 'Amazon Prime',
    logo: '/landing/logos/amazon-prime.png',
    billed: '$139.00 every year',
    monthly: '$11.58',
  },
  {
    name: '1Password',
    logo: '/landing/logos/1password.png',
    billed: '$35.88 every year',
    monthly: '$2.99',
  },
  {
    name: 'NordVPN',
    logo: '/landing/logos/nordvpn.png',
    billed: '$89.00 every 2 years',
    monthly: '$3.71',
  },
];

const COLLECTIONS = [
  { name: 'Personal', monthly: '$406.39/mo', dot: 'bg-brand', current: true },
  { name: 'Household', monthly: '$142.50/mo', dot: 'bg-brand-bright' },
  { name: 'Side project', monthly: '$61.00/mo', dot: 'bg-[#A7B0BA]' },
];

const EXPORTS = [
  {
    format: 'CSV',
    file: 'personal.csv',
    badge: 'bg-[#E8F4EC] text-[#1F7A45]',
  },
  {
    format: 'JSON',
    file: 'all-collections.json',
    badge: 'bg-brand-wash text-brand',
  },
];

const cardShadow = 'shadow-[0_18px_40px_-16px_#14233C33]';
const widgetShadow = 'shadow-[0_10px_24px_-14px_#14233C2E]';

export function Benefits() {
  return (
    <section
      id="features"
      className={cn(
        'flex flex-col gap-10 pt-24 md:gap-14 md:pt-38',
        contentColumn,
      )}
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <h2 className={cn('max-w-155 xl:w-155 xl:shrink-0', sectionHeading)}>
          The whole picture, without the spreadsheet.
        </h2>
        <p className="max-w-140 text-lg/7.25 text-ink-muted xl:w-100 xl:shrink-0">
          Charges arrive on different schedules. EverySub lines them up so you
          can see what you’re committed to and what’s next.
        </p>
      </div>
      {/* One column on phones. Tablets pair the calendar and reminders and
          let the wider cards span the row. Desktop columns give the 680px and
          424px cards of the design. */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[424fr_240fr_424fr]">
        <TotalsCard />
        <div className="flex h-115 flex-col gap-7 overflow-clip rounded-[22px] bg-surface px-6 pt-8 sm:px-8 sm:pt-9 md:h-125 xl:h-115">
          <CardHeading title="Know what’s coming up.">
            A calendar of expected charges shows the heavy weeks before they
            arrive.
          </CardHeading>
          <img
            src="/landing/screens/upcoming-calendar.webp"
            alt="A calendar of expected charges for October 2026, with each day shaded by how much is due."
            width={360}
            height={419}
            loading="lazy"
            className={cn(
              'h-auto w-full max-w-90 shrink-0 rounded-[14px] outline outline-line -outline-offset-1',
              cardShadow,
            )}
          />
        </div>
        <div className="flex flex-col gap-6 overflow-clip rounded-[22px] bg-surface px-6 pt-8 pb-6 sm:px-8 sm:pt-9 sm:pb-8 md:h-125 md:pb-0">
          <CardHeading title="Hear about renewals first.">
            Reminders before each charge and a monthly overview, sent wherever
            each collection chooses.
          </CardHeading>
          <ul className="flex flex-wrap gap-2">
            <Channel icon={<MailIcon className="size-3.75" />}>Email</Channel>
            <Channel
              icon={
                <img
                  src="/landing/logos/discord.svg"
                  alt=""
                  className="size-3.75"
                />
              }
            >
              Discord
            </Channel>
            <Channel icon={<WebhookIcon className="size-3.75" />}>
              Webhook
            </Channel>
          </ul>
          <img
            src="/landing/screens/reminder-email.webp"
            alt="A renewal reminder email: Streamline Video is expected to renew for $15.99 on Wed, Oct 7."
            width={360}
            height={248}
            loading="lazy"
            className={cn(
              'h-auto w-full max-w-90 shrink-0 rounded-[14px] outline outline-line -outline-offset-1',
              cardShadow,
            )}
          />
        </div>
        {/* `min-w-0` keeps the screenshot, which runs off the card's edge,
            from widening the grid. */}
        <div
          id="smart-import"
          className="relative flex h-125 min-w-0 scroll-mt-24 flex-col gap-7 overflow-clip rounded-[22px] bg-surface pt-8 pl-6 sm:pt-9 sm:pl-9 md:col-span-2"
        >
          <div className="max-w-120 pr-6">
            <CardHeading title="Set up from a statement in minutes.">
              Drop in a PDF statement, receipt, or screenshot. Smart import
              finds the recurring charges, and nothing is saved until you review
              it.
            </CardHeading>
          </div>
          <img
            src="/landing/screens/smart-import.webp"
            alt="Smart import's review step, listing subscriptions found in a statement with their cost, next invoice date, and category."
            width={822}
            height={420}
            loading="lazy"
            className="h-105 w-205.5 max-w-none shrink-0 rounded-xl bg-white shadow-[0_18px_40px_-16px_#14233C33,0_1px_2px_#14233C0F]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-b from-surface/0 via-surface/90 via-70% to-surface"
          />
        </div>
        <div className="col-span-full grid gap-4 lg:grid-cols-3">
          <SmallCard
            title="Keep things separate."
            description="Personal, household, side project. Each collection gets its own dashboard and totals."
          >
            <ul
              className={cn(
                'flex flex-col rounded-[14px] border border-line bg-white p-1.5',
                widgetShadow,
              )}
            >
              {COLLECTIONS.map((collection) => (
                <li
                  key={collection.name}
                  className={cn(
                    'flex h-10 items-center gap-2.5 rounded-[9px] px-2.5 text-sm/4.5',
                    collection.current && 'bg-surface',
                  )}
                >
                  <span
                    className={cn(
                      'size-2 shrink-0 rounded-full',
                      collection.dot,
                    )}
                  />
                  <span
                    className={cn(
                      'grow',
                      collection.current ? 'font-semibold' : 'font-medium',
                    )}
                  >
                    {collection.name}
                  </span>
                  <span className="w-21 shrink-0 text-right font-medium text-ink-muted">
                    {collection.monthly}
                  </span>
                </li>
              ))}
            </ul>
          </SmallCard>
          <SmallCard
            title="Your data stays portable."
            description="Export one collection or all of them as JSON or CSV, and import it back whenever you like."
          >
            <ul className="flex flex-col gap-2">
              {EXPORTS.map((item) => (
                <li
                  key={item.file}
                  className={cn(
                    'flex h-13 items-center gap-3 rounded-xl border border-line bg-white px-3.5',
                    widgetShadow,
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-9 shrink-0 items-center justify-center rounded-md text-[11px]/3.5 font-bold tracking-[0.04em]',
                      item.badge,
                    )}
                  >
                    {item.format}
                  </span>
                  <span className="grow text-sm/4.5 font-medium">
                    {item.file}
                  </span>
                  <DownloadIcon className="size-4 shrink-0 text-ink-muted" />
                </li>
              ))}
            </ul>
          </SmallCard>
          <SmallCard
            title="Honest about what’s real."
            description="Projected charges and recorded history are kept apart. EverySub never pretends a payment went through."
          >
            <ul
              className={cn(
                'flex flex-col rounded-[14px] border border-line bg-white px-3.5 py-1.5',
                widgetShadow,
              )}
            >
              <InvoiceRow date="Sep 6" amount="$20.00">
                <span className="flex h-6 w-23 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#E6EFF7] text-xs/4 font-semibold text-brand-strong">
                  <span className="size-1.75 rounded-xs bg-brand" />
                  Recorded
                </span>
              </InvoiceRow>
              <InvoiceRow date="Oct 6" amount="$20.00">
                <span className="flex h-6 w-23 shrink-0 items-center justify-center gap-1.5 rounded-full border border-dashed border-[#9FD3F2] bg-white text-xs/4 font-semibold text-[#1F6E9C]">
                  <span className="size-1.75 rounded-xs bg-brand-bright" />
                  Projected
                </span>
              </InvoiceRow>
            </ul>
          </SmallCard>
        </div>
      </div>
    </section>
  );
}

function TotalsCard() {
  return (
    <div className="flex flex-col gap-8 overflow-clip rounded-[22px] bg-surface p-6 sm:p-9 md:col-span-2 md:flex-row md:gap-5 md:pr-0 md:pb-0">
      <div className="flex flex-col justify-between gap-6 md:w-61 md:shrink-0 md:pb-9">
        <CardHeading title="See what it adds up to.">
          Weekly, monthly, yearly, and biennial plans become one monthly and
          yearly total.
        </CardHeading>
        <div className="flex flex-col gap-1">
          <p className="flex items-baseline gap-1">
            <span className="text-[40px]/11 font-semibold tracking-[-0.04em]">
              $4,876.70
            </span>
            <span className="text-[17px]/5.5 font-medium text-ink-muted">
              /yr
            </span>
          </p>
          <p className="text-[15px]/4.5 font-medium text-ink-muted">
            Across 30 subscriptions
          </p>
        </div>
      </div>
      <div className="flex md:grow md:basis-0 md:pt-1 md:pr-9 md:pb-9">
        <div
          className={cn(
            'flex grow flex-col overflow-clip rounded-[14px] border border-line bg-white',
            cardShadow,
          )}
        >
          <div className="flex flex-col gap-0.75 border-b border-line-soft px-4 pt-4.5 pb-4 sm:px-5">
            <p className="text-[15px]/5 font-semibold">
              Effective monthly cost
            </p>
            <p className="text-[13px]/4.5 text-ink-muted">
              Every billing cycle, in monthly terms
            </p>
          </div>
          <ul>
            {MONTHLY_COSTS.map((subscription) => (
              <li
                key={subscription.name}
                className="flex items-center gap-2.5 border-b border-line-soft px-4 py-3 last:border-b-0 sm:gap-3 sm:px-5"
              >
                <img
                  src={subscription.logo}
                  alt=""
                  className="size-8 shrink-0 rounded-lg outline outline-black/6 -outline-offset-1"
                />
                <div className="flex min-w-0 grow flex-col gap-0.5">
                  <p className="text-sm/4.5 font-medium">{subscription.name}</p>
                  <p className="text-[13px]/4.25 text-ink-muted">
                    {subscription.billed}
                  </p>
                </div>
                <PerMonth amount={subscription.monthly} />
              </li>
            ))}
          </ul>
          <div className="mt-auto flex items-baseline justify-between gap-3 border-t border-line-soft bg-[#F8FAFC] px-4 py-3.5 sm:px-5">
            <p className="text-[13px]/4.5 font-medium text-ink-muted">
              Total across 30 subscriptions
            </p>
            <PerMonth amount="$406.39" className="text-base/5" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CardHeading({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="text-[21px]/7 font-semibold tracking-[-0.02em]">
        {title}
      </h3>
      <p className="text-base/6.25 text-ink-muted">{children}</p>
    </div>
  );
}

function SmallCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-8 rounded-[22px] bg-surface p-6 sm:p-8 md:grid-cols-2 md:items-center md:gap-12 lg:grid-cols-1 lg:content-between lg:gap-11">
      <CardHeading title={title}>{description}</CardHeading>
      {children}
    </div>
  );
}

function Channel({ icon, children }: { icon: ReactNode; children: string }) {
  return (
    <li className="flex h-8 items-center gap-1.75 rounded-full border border-line bg-white px-3 text-sm/4.5 font-medium text-ink-soft">
      {icon}
      {children}
    </li>
  );
}

function PerMonth({
  amount,
  className = 'text-sm/4.5',
}: {
  amount: string;
  className?: string;
}) {
  return (
    <p className="flex shrink-0 items-baseline gap-px">
      <span className={cn('font-semibold tabular-nums', className)}>
        {amount}
      </span>
      <span className="text-xs/4 text-[#6B7380]">/mo</span>
    </p>
  );
}

function InvoiceRow({
  date,
  amount,
  children,
}: {
  date: string;
  amount: string;
  children: ReactNode;
}) {
  return (
    <li className="flex h-11 items-center gap-2.5 text-sm/4.5 font-medium not-last:border-b not-last:border-line-soft">
      <span className="w-12 shrink-0 text-ink-muted">{date}</span>
      <span className="grow">{amount}</span>
      {children}
    </li>
  );
}
