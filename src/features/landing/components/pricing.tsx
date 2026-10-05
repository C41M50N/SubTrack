import { Link } from '@tanstack/react-router';

import { CheckIcon } from '@/features/landing/components/icons';
import { landingButtonVariants } from '@/features/landing/styles';
import { cn } from '@/lib/utils';

type Plan = {
  name: string;
  description: string;
  price: string;
  period: string;
  badge?: { label: string; className: string };
  cta: string;
  featured?: boolean;
  /** Introduces the feature list when it builds on another plan. */
  intro?: string;
  features: { label: string; comingSoon?: boolean }[];
};

const PLANS: Plan[] = [
  {
    name: 'Free',
    description: 'For getting the full picture.',
    price: '$0',
    period: 'forever',
    cta: 'Start free',
    features: [
      { label: 'Unlimited subscriptions in one collection' },
      { label: 'Dashboard, totals, and category breakdown' },
      { label: 'Upcoming calendar and invoice history' },
      { label: 'JSON and CSV import and export' },
    ],
  },
  {
    name: 'Pro',
    description: 'For staying ahead of every renewal.',
    price: '$5',
    period: 'per month',
    badge: { label: 'Recommended', className: 'bg-brand-wash text-brand' },
    cta: 'Start with Pro',
    featured: true,
    intro: 'Everything in Free, plus:',
    features: [
      { label: 'Unlimited collections' },
      { label: 'Renewal reminders and monthly overviews' },
      { label: 'Email, Discord, and webhook delivery' },
      { label: 'Smart import from statements and receipts' },
      { label: 'MCP server access', comingSoon: true },
    ],
  },
  {
    name: 'Pro Annual',
    description: 'Pro, billed once a year.',
    price: '$49',
    period: 'per year',
    badge: { label: 'Save $11', className: 'bg-surface text-ink-soft' },
    cta: 'Go annual',
    features: [
      { label: 'Everything in Pro' },
      { label: 'About two months free compared to monthly' },
      { label: 'One charge a year, and we’ll remind you before it renews' },
    ],
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="flex w-full max-w-280 flex-col items-center gap-14 pt-42 pb-38"
    >
      <div className="flex flex-col items-center gap-5 text-center">
        <h2 className="w-190 text-[56px]/15 tracking-[-0.04em]">
          Pricing with nothing to hide.
        </h2>
        <p className="w-150 text-lg/7.25 text-ink-muted">
          You’re the customer, not the product. EverySub never sells your data
          or gets paid to keep you subscribed to anything.
        </p>
      </div>
      <ul className="flex w-full gap-4">
        {PLANS.map((plan) => (
          <li
            key={plan.name}
            className={cn(
              'flex grow basis-0 flex-col gap-7 rounded-[22px] border bg-white p-8',
              plan.featured
                ? 'border-brand shadow-[0_0_0_1px_#176AAB,0_24px_48px_-20px_#176AAB59]'
                : 'border-line',
            )}
          >
            <div className="flex flex-col gap-2">
              <div className="flex h-6 items-center justify-between">
                <h3 className="text-[17px]/6 font-semibold">{plan.name}</h3>
                {plan.badge && (
                  <span
                    className={cn(
                      'flex h-6 items-center rounded-full px-2.5 text-xs/4 font-semibold',
                      plan.badge.className,
                    )}
                  >
                    {plan.badge.label}
                  </span>
                )}
              </div>
              <p className="text-[15px]/5.5 text-ink-muted">
                {plan.description}
              </p>
            </div>
            <p className="flex items-baseline gap-1.5">
              <span className="text-5xl/13 font-semibold tracking-[-0.04em]">
                {plan.price}
              </span>
              <span className="text-[15px]/4.5 font-medium text-ink-muted">
                {plan.period}
              </span>
            </p>
            <Link
              to="/login"
              className={landingButtonVariants({
                variant: plan.featured ? 'primary' : 'secondary',
                className: plan.featured && 'shadow-[inset_0_1px_0_#FFFFFF24]',
              })}
            >
              {plan.cta}
            </Link>
            <div className="flex flex-col gap-3.5 border-t border-line-soft pt-6">
              {plan.intro && (
                <p className="text-sm/4.5 font-semibold">{plan.intro}</p>
              )}
              <ul className="flex flex-col gap-3.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature.label}
                    className="flex items-center gap-2.5 text-[15px]/5 text-ink-soft"
                  >
                    <CheckIcon
                      strokeWidth={2.2}
                      className="size-4.5 shrink-0 self-start text-brand"
                    />
                    {feature.label}
                    {feature.comingSoon && (
                      <span className="flex h-5 items-center rounded-full border border-[#CFE3F2] bg-[#F3F8FC] px-1.75 text-[11px]/3.5 font-semibold text-brand">
                        Coming soon
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
