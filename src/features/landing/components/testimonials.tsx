import { PauseIcon, PlayIcon } from 'lucide-react';
import { type CSSProperties, useState } from 'react';

import { focusRing } from '@/features/landing/styles';
import { cn } from '@/lib/utils';

const QUOTES = [
  {
    quote:
      'I guessed I paid about $150 a month for subscriptions. It was $312. Seeing the yearly number was the wake-up call.',
    name: 'Maya Ruiz',
    detail: 'Tracks 27 subscriptions',
    initials: 'MR',
    avatar: 'bg-[#E1F0F9] text-[#035F8F]',
  },
  {
    quote:
      'The annual renewals always got me. Now I hear about them three days ahead and decide on my own terms.',
    name: 'Daniel Kim',
    detail: 'Freelance designer',
    initials: 'DK',
    avatar: 'bg-[#FCE9E0] text-[#A8441C]',
  },
  {
    quote:
      'I dropped in three months of statements, and it found two subscriptions I’d forgotten I was paying for.',
    name: 'Priya Shah',
    detail: 'Tracks 19 subscriptions',
    initials: 'PS',
    avatar: 'bg-[#DFF4EB] text-[#0F6E4E]',
  },
  {
    quote:
      'Family streaming lives in one collection and my work tools in another. Splitting costs is finally easy.',
    name: 'Tom Walsh',
    detail: 'Household of four',
    initials: 'TW',
    avatar: 'bg-[#FBF0D6] text-[#875C00]',
  },
  {
    quote:
      'It never nags me to cancel anything. It shows me the numbers and lets me make the call.',
    name: 'Lena Moretti',
    detail: 'Tracks 12 subscriptions',
    initials: 'LM',
    avatar: 'bg-[#FBE6EE] text-[#A93D66]',
  },
];

/** A 344px card plus the 16px gap after it. */
const CARD_PITCH = 360;
const CARD_WIDTH = 344;
/** Matches the `animate-marquee` speed. */
const PIXELS_PER_SECOND = 30;
/** The band width the marquee was designed at, and the widest it gets. */
const FRAME_WIDTH = 1440;

/**
 * Starts the loop part way through, so the first frame matches the design:
 * the middle card centered, with part of a card at each edge.
 */
const START_OFFSET =
  Math.floor(QUOTES.length / 2) * CARD_PITCH + CARD_WIDTH / 2 - FRAME_WIDTH / 2;

const trackStyle = {
  '--count': QUOTES.length,
  animationDelay: `${-START_OFFSET / PIXELS_PER_SECOND}s`,
} as CSSProperties;

export function Testimonials() {
  const [paused, setPaused] = useState(false);

  return (
    <section className="flex w-full flex-col items-center gap-14 overflow-clip bg-[#E6F0FA] pt-30 pb-18 motion-reduce:pb-32">
      <div className="flex flex-col items-center gap-5 text-center">
        <h2 className="w-190 text-[56px]/15 tracking-[-0.04em]">
          Less guessing, fewer surprises.
        </h2>
        <p className="w-140 text-lg/7.25 text-ink-muted">
          What people notice once every subscription is in one place.
        </p>
      </div>
      <div className="flex w-full flex-col items-center gap-6">
        {/* Under reduced motion this becomes a row you scroll yourself, with
            the first card lined up with the page's content column. */}
        <div className="group/marquee w-full overflow-x-clip [mask-image:linear-gradient(90deg,transparent_0,#000_120px,#000_calc(100%-120px),transparent_100%)] motion-safe:max-w-360 motion-reduce:-my-6 motion-reduce:snap-x motion-reduce:snap-mandatory motion-reduce:scroll-px-[calc((100%-1120px)/2)] motion-reduce:overflow-x-auto motion-reduce:px-[calc((100%-1120px)/2)] motion-reduce:py-6">
          <div
            data-paused={paused ? '' : undefined}
            style={trackStyle}
            className="flex w-max animate-marquee group-focus-within/marquee:paused group-hover/marquee:paused data-paused:paused motion-safe:ml-[calc(50%-720px)]"
          >
            <QuoteSet />
            <QuoteSet duplicate />
          </div>
        </div>
        <div className="flex w-full max-w-280 justify-end motion-reduce:hidden">
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? 'Play testimonials' : 'Pause testimonials'}
            className={cn(
              'flex size-8 items-center justify-center rounded-full bg-white text-ink-soft shadow-[0_1px_2px_#14233C1A] transition-[scale,color] duration-150 ease-reveal hover:text-ink motion-safe:active:scale-98',
              focusRing,
            )}
          >
            {paused ? (
              <PlayIcon className="size-3.5 translate-x-px fill-current" />
            ) : (
              <PauseIcon className="size-3.5 fill-current" />
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * One copy of the quotes. The marquee renders two in a row so the loop is
 * seamless; the duplicate is hidden from assistive tech and from focus, and
 * isn't rendered at all under reduced motion.
 */
function QuoteSet({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <ul
      aria-hidden={duplicate || undefined}
      inert={duplicate}
      className={cn(
        'flex gap-4 pr-4 motion-reduce:pr-0',
        duplicate && 'motion-reduce:hidden',
      )}
    >
      {QUOTES.map((item) => (
        <li key={item.name} className="flex w-86 shrink-0 snap-start">
          <figure className="flex grow flex-col justify-between gap-7 rounded-[20px] bg-white p-7 shadow-[0_1px_2px_#14233C0F,0_8px_24px_-8px_#14233C0A]">
            <blockquote className="text-[17px]/6.75">“{item.quote}”</blockquote>
            <figcaption className="flex items-center gap-3">
              <span
                aria-hidden
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-full text-sm/4.5 font-semibold',
                  item.avatar,
                )}
              >
                {item.initials}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[15px]/4.5 font-semibold">
                  {item.name}
                </span>
                <span className="text-sm/4.5 text-ink-muted">
                  {item.detail}
                </span>
              </span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
