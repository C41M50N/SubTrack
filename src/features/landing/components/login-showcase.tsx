import type { CSSProperties, ReactNode } from 'react';

import { BellIcon, CalendarIcon } from '@/features/landing/components/icons';
import { cn } from '@/lib/utils';

const RENEWALS = [
  {
    name: 'Netflix',
    logo: '/landing/logos/netflix.png',
    renews: 'Renews Fri, Oct 9 · monthly',
    amount: '$15.49',
  },
  {
    name: 'Amazon Prime',
    logo: '/landing/logos/amazon-prime.png',
    renews: 'Renews Sun, Oct 11 · yearly',
    amount: '$139.00',
  },
  {
    name: '1Password',
    logo: '/landing/logos/1password.png',
    renews: 'Renews Tue, Oct 13 · yearly',
    amount: '$35.88',
  },
];

/**
 * The blue panel beside the sign-in form. Its cards are a fixed composition,
 * so the narrower panel below `xl` scales the whole group down, as do windows
 * too short to fit it at full size.
 */
export function LoginShowcase({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between gap-10 overflow-clip rounded-3xl bg-brand-glow p-10 xl:p-14',
        className,
      )}
    >
      <div
        aria-hidden
        className="flex grow items-center justify-center xl:[@media(max-height:49rem)]:[zoom:0.8]"
      >
        <div className="relative h-111 w-143 shrink-0 [zoom:0.75] xl:[zoom:1]">
          <UpcomingCard />
          <FloatingCard
            tilt="-6deg"
            delay="450ms"
            className="top-7 left-0 w-65.5"
            icon={<BellIcon className="size-4.5" />}
            title="Yearly charge on Sunday"
            detail="Amazon Prime · $139.00"
          />
          <FloatingCard
            tilt="5deg"
            delay="570ms"
            className="top-89.5 left-80 w-63"
            icon={<CalendarIcon className="size-4.5" />}
            title="October overview"
            detail="$388.11 across 26 charges"
          />
        </div>
      </div>
      <div className="flex max-w-120 flex-col gap-3.5">
        <p className="text-[32px]/9 tracking-[-0.04em] text-white xl:text-[40px]/11">
          Every renewal, accounted for before it lands.
        </p>
        <p className="text-base/[25px] text-[#D6E8F6]">
          Costs, renewal dates, and billing history for everything you pay for,
          in one calm place.
        </p>
      </div>
    </div>
  );
}

function UpcomingCard() {
  return (
    <div className="absolute top-19.5 left-22.5 flex w-95 flex-col overflow-clip rounded-2xl bg-white shadow-[0_32px_64px_-24px_#051E3780,0_2px_6px_#051E3726] motion-safe:animate-product-rise">
      <div className="flex items-baseline justify-between border-b border-line-soft px-5 pt-4.5 pb-4">
        <p className="text-[15px]/5 font-semibold">Coming up</p>
        <p className="text-[13px]/4.5 text-ink-muted">Next 7 days</p>
      </div>
      <ul>
        {RENEWALS.map((renewal) => (
          <li
            key={renewal.name}
            className="flex items-center gap-3 border-b border-line-soft px-5 py-3 last:border-b-0"
          >
            <img
              src={renewal.logo}
              alt=""
              className="size-8 shrink-0 rounded-lg outline outline-black/6 -outline-offset-1"
            />
            <div className="flex min-w-0 grow flex-col gap-0.5">
              <p className="text-sm/4.5 font-medium">{renewal.name}</p>
              <p className="text-[13px]/[17px] text-ink-muted">
                {renewal.renews}
              </p>
            </div>
            <p className="shrink-0 text-sm/4.5 font-semibold tabular-nums">
              {renewal.amount}
            </p>
          </li>
        ))}
      </ul>
      <div className="flex items-baseline justify-between border-t border-line-soft bg-[#F8FAFC] px-5 py-3.5">
        <p className="text-[13px]/4.5 font-medium text-ink-muted">
          3 renewals this week
        </p>
        <p className="text-base/5 font-semibold tabular-nums">$190.37</p>
      </div>
    </div>
  );
}

/** A tilted notification that springs into place after the card rises. */
function FloatingCard({
  tilt,
  delay,
  className,
  icon,
  title,
  detail,
}: {
  tilt: string;
  delay: string;
  className: string;
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div
      style={{ '--tilt': tilt, animationDelay: delay } as CSSProperties}
      className={cn(
        'absolute flex origin-top-left rotate-(--tilt) items-center gap-3 rounded-[14px] bg-white px-4 py-3.5 shadow-[0_16px_32px_-12px_#051E3773] motion-safe:animate-card-in',
        className,
      )}
    >
      <span className="flex size-8.5 shrink-0 items-center justify-center rounded-[9px] bg-brand-wash text-brand">
        {icon}
      </span>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm/4.5 font-semibold">{title}</p>
        <p className="text-[13px]/4 font-medium text-ink-muted">{detail}</p>
      </div>
    </div>
  );
}
