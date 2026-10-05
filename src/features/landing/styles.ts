import { cva } from 'class-variance-authority';

/**
 * The 1120px content column. The page sets `--gutter`, the least space kept
 * between the column and the edge of the screen.
 */
export const contentColumn = 'w-[calc(100%-2*var(--gutter))] max-w-280';

/** The colored panels, which run a little wider than the content column. */
export const panelColumn = 'w-[calc(100%-var(--gutter))] max-w-300';

export const sectionHeading = 'text-[40px]/11 tracking-[-0.04em] text-balance md:text-[56px]/15';

/**
 * A brand-colored ring for keyboard focus. `outline-none` also clears the
 * outline style, so focus has to set it again.
 */
export const focusRing =
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-brand';

/** Links styled as the landing page's buttons. Presses scale down slightly. */
export const landingButtonVariants = cva(
  'group inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap transition-[scale,background-color] duration-150 ease-reveal outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid motion-safe:active:scale-98',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-white hover:bg-brand-strong focus-visible:outline-brand',
        secondary: 'border border-[#DDE2E7] bg-white text-ink hover:bg-surface focus-visible:outline-brand',
        // These sit on the blue panel, where a brand ring wouldn't show.
        inverse: 'bg-white text-ink shadow-[0_8px_20px_-8px_#051E3773] hover:bg-brand-wash focus-visible:outline-white',
        'inverse-outline': 'border border-white/35 text-white hover:bg-white/10 focus-visible:outline-white',
      },
      size: {
        sm: 'h-9.5 rounded-[10px] px-4 text-[15px]/4.5 font-medium',
        md: 'h-11.5 rounded-xl px-5 text-[15px]/4.5 font-semibold',
        lg: 'h-12.5 rounded-xl px-5.5 text-base/5 font-semibold',
        xl: 'h-13 rounded-xl px-6 text-base/5 font-semibold',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

/** Nudges an arrow forward while its `group` parent is hovered or focused. */
export const arrowNudge =
  'shrink-0 transition-[translate] duration-150 ease-reveal motion-safe:group-hover:translate-x-0.5 motion-safe:group-focus-visible:translate-x-0.5';
