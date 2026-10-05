import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * - `static`: show the final state. Used for the server render, before
 *   hydration, under reduced motion, and when the element is already on
 *   screen at mount.
 * - `pending`: hide the element until it scrolls into view.
 * - `in`: play the entrance. Never goes back to `pending`.
 */
export type RevealState = 'static' | 'pending' | 'in';

type RevealOptions = {
  /** Fraction of the element that must be visible before it reveals. */
  threshold?: number;
};

/**
 * Plays an entrance animation once, the first time an element scrolls into
 * view. Expose the result as `data-reveal` on the element, and apply hidden
 * starting styles only under `[data-reveal="pending"]`.
 */
export function useRevealOnce(ref: RefObject<Element | null>, { threshold = 0 }: RevealOptions = {}): RevealState {
  const [state, setState] = useState<RevealState>('static');

  // A layout effect hides the element before the first paint, so it never
  // flashes in its final state and then disappears.
  useLayoutEffect(() => {
    const element = ref.current;

    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches || isOnScreen(element)) {
      return;
    }

    setState('pending');

    const observer = new IntersectionObserver(
      ([entry]) => {
        // The observer also reports the first sliver entering the viewport,
        // so check the ratio, not just `isIntersecting`.
        if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
          setState('in');
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, threshold]);

  return state;
}

function isOnScreen(element: Element) {
  const { top, bottom } = element.getBoundingClientRect();

  return top < window.innerHeight && bottom > 0;
}
