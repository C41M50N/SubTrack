import { Link } from '@tanstack/react-router';
import { type CSSProperties, type ReactNode, useRef } from 'react';

import {
  ArrowRightIcon,
  CalendarIcon,
} from '@/features/landing/components/icons';
import { arrowNudge, landingButtonVariants } from '@/features/landing/styles';
import { useRevealOnce } from '@/hooks/use-reveal-once';
import { cn } from '@/lib/utils';

export function CtaSection() {
  const panelRef = useRef<HTMLDivElement>(null);
  const reveal = useRevealOnce(panelRef, { threshold: 0.4 });

  return (
    <section className="flex w-full justify-center pt-42 pb-38">
      <div
        ref={panelRef}
        data-reveal={reveal}
        className="group/cta relative flex w-300 shrink-0 flex-col items-center gap-7 overflow-clip rounded-[28px] bg-brand-glow px-20 py-26 text-center"
      >
        <h2 className="w-160 text-[64px]/17 tracking-[-0.045em] text-white">
          Find out before your statement does.
        </h2>
        <p className="w-140 text-[19px]/7.5 text-[#D6E8F6]">
          Add your first subscriptions in a few minutes. Free to start, with no
          card and no bank connection.
        </p>
        <div className="flex items-center gap-3 pt-2">
          <Link
            to="/login"
            className={landingButtonVariants({
              variant: 'inverse',
              size: 'xl',
            })}
          >
            Start tracking free
            <ArrowRightIcon className={cn('size-4', arrowNudge)} />
          </Link>
          <Link
            to="/login"
            className={landingButtonVariants({
              variant: 'inverse-outline',
              size: 'xl',
            })}
          >
            Sign in
          </Link>
        </div>
        <FloatingCard
          tilt="-7deg"
          delay="150ms"
          className="top-14 left-14 w-57.5"
          icon={
            <span className="flex size-8.5 shrink-0 items-center justify-center rounded-[9px] bg-surface">
              <img
                src="/landing/logos/netflix.svg"
                alt=""
                className="size-4.5"
              />
            </span>
          }
          title="Netflix renews Friday"
          detail="$15.49 expected"
        />
        <FloatingCard
          tilt="6deg"
          delay="270ms"
          className="right-13 bottom-15 w-65.5"
          icon={
            <span className="flex size-8.5 shrink-0 items-center justify-center rounded-[9px] bg-brand-wash">
              <CalendarIcon className="size-4.5 text-brand" />
            </span>
          }
          title="November overview"
          detail="$388.11 across 26 charges"
        />
      </div>
    </section>
  );
}

/**
 * A tilted notification that springs into place the first time the panel
 * scrolls into view.
 */
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
      aria-hidden
      style={{ '--tilt': tilt, animationDelay: delay } as CSSProperties}
      className={cn(
        'absolute flex origin-top-left rotate-(--tilt) items-center gap-3 rounded-[14px] bg-white px-4 py-3.5 text-left shadow-[0_16px_32px_-12px_#051E3773] group-data-[reveal=pending]/cta:opacity-0 motion-safe:group-data-[reveal=in]/cta:animate-card-in',
        className,
      )}
    >
      {icon}
      <div className="flex flex-col gap-0.5">
        <p className="text-sm/4.5 font-semibold">{title}</p>
        <p className="text-[13px]/4 font-medium text-ink-muted">{detail}</p>
      </div>
    </div>
  );
}
