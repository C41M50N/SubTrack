import { ChevronRightIcon } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { CategoryShare, CategorySlice } from '@/features/dashboard/domain';
import { foldCategoryShares } from '@/features/dashboard/domain';
import { formatCurrencyFromCents } from '@/features/subscriptions/cost';
import { cn } from '@/lib/utils';

/* Ring geometry, in viewBox units. */
const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 86;
const RING_WIDTH = 14;
const ACTIVE_RING_WIDTH = RING_WIDTH + 4;
/** Surface gap between slices along the ring's centerline. */
const GAP = 3;
/** Extra transparent stroke under each arc so slivers stay easy to hover. */
const HIT_PADDING = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type CategoryBreakdownProps = {
  entries: CategoryShare[];
};

/**
 * Donut of effective monthly cost by category with a ranked legend.
 *
 * The ring gives concentration at a glance; the legend keeps every amount
 * legible without hover. Hovering or focusing either side highlights both and
 * swaps the center figure to that category. Click pins the selection.
 */
export function CategoryBreakdown({ entries }: CategoryBreakdownProps) {
  const slices = useMemo(() => foldCategoryShares(entries), [entries]);
  const geometry = useMemo(() => layoutArcs(slices), [slices]);
  const totalCents = entries.reduce(
    (sum, entry) => sum + entry.monthlyCents,
    0,
  );
  const totalCount = entries.reduce((sum, entry) => sum + entry.count, 0);

  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const [otherOpen, setOtherOpen] = useState(false);
  const foldedListId = useId();

  // A pinned index can outlive its slice when the data changes underneath it.
  const active =
    pinned !== null && pinned < slices.length
      ? pinned
      : hovered !== null && hovered < slices.length
        ? hovered
        : null;
  const focus = active !== null ? slices[active] : null;

  useEffect(() => {
    if (pinned === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPinned(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [pinned]);

  const togglePin = (index: number) =>
    setPinned((current) => (current === index ? null : index));

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base">Spend by category</CardTitle>
        <CardDescription>Effective monthly cost</CardDescription>
      </CardHeader>
      <CardContent className="@container p-0">
        <div className="grid grid-cols-1 @[520px]:grid-cols-[260px_1fr] @[520px]:items-center">
          <div className="grid place-items-center px-6 pt-6 pb-4 @[520px]:px-4 @[520px]:py-6">
            <div className="relative w-full max-w-[220px]">
              <svg
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                className="block aspect-square w-full overflow-visible"
                aria-hidden="true"
                onPointerLeave={() => setHovered(null)}
              >
                {totalCents === 0 ? (
                  <circle
                    cx={CENTER}
                    cy={CENTER}
                    r={RADIUS}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth={RING_WIDTH}
                  />
                ) : (
                  slices.map((slice, index) => (
                    <Arc
                      key={sliceKey(slice)}
                      slice={slice}
                      geometry={geometry[index]}
                      isActive={index === active}
                      isDimmed={active !== null && index !== active}
                      onPointerEnter={() => setHovered(index)}
                      onClick={() => togglePin(index)}
                    />
                  ))
                )}
              </svg>
              <div className="pointer-events-none absolute inset-0 grid place-content-center px-10 text-center">
                {focus ? (
                  <>
                    <div className="max-w-[120px] truncate text-xs font-medium leading-tight">
                      {focus.category}
                    </div>
                    <div className="my-0.5 text-2xl font-semibold leading-none tracking-tight">
                      {formatCurrencyFromCents(focus.monthlyCents)}
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {formatShare(focus.share)} · {formatCount(focus.count)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs leading-tight text-muted-foreground">
                      Total
                    </div>
                    <div className="my-0.5 text-2xl font-semibold leading-none tracking-tight">
                      {formatCurrencyFromCents(totalCents)}
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      per month · {formatCount(totalCount)}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <ul
            className="border-t py-1 @[520px]:border-t-0 @[520px]:border-l @[520px]:py-2"
            aria-label="Categories ranked by monthly cost"
          >
            {slices.map((slice, index) => {
              const isActive = index === active;
              const isOther = slice.kind === 'other';

              return (
                <li key={sliceKey(slice)} className="contents">
                  <button
                    type="button"
                    className={cn(
                      'grid w-full grid-cols-[10px_1fr_auto] items-center gap-2.5 px-6 py-2 text-left outline-ring focus-visible:outline-2 focus-visible:-outline-offset-2',
                      isActive && 'bg-accent',
                    )}
                    aria-pressed={isOther ? undefined : pinned === index}
                    aria-expanded={isOther ? otherOpen : undefined}
                    aria-controls={isOther ? foldedListId : undefined}
                    style={{ color: sliceColor(slice) }}
                    onPointerEnter={() => setHovered(index)}
                    onPointerLeave={() => setHovered(null)}
                    onFocus={() => setHovered(index)}
                    onBlur={() => setHovered(null)}
                    onClick={() =>
                      isOther ? setOtherOpen((open) => !open) : togglePin(index)
                    }
                  >
                    <span
                      className="size-2.5 rounded-[3px] bg-current"
                      aria-hidden="true"
                    />
                    <span className="flex min-w-0 items-center gap-1.5 text-foreground">
                      <span className="truncate text-sm font-medium">
                        {slice.category}
                      </span>
                      {slice.kind === 'other' && (
                        <span
                          className={cn(
                            'inline-flex shrink-0 items-center gap-0.5 text-xs whitespace-nowrap text-muted-foreground',
                            isActive && 'text-foreground',
                          )}
                        >
                          {slice.folded.length} more
                          <ChevronRightIcon
                            className={cn(
                              'size-3 transition-transform duration-150',
                              otherOpen && 'rotate-90',
                            )}
                            aria-hidden="true"
                          />
                        </span>
                      )}
                    </span>
                    <span className="flex items-baseline gap-2 whitespace-nowrap text-foreground">
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrencyFromCents(slice.monthlyCents)}
                      </span>
                      <span className="min-w-[3ch] text-right text-xs text-muted-foreground tabular-nums">
                        {formatShare(slice.share)}
                      </span>
                    </span>
                  </button>
                  {slice.kind === 'other' && otherOpen && (
                    <ul id={foldedListId} className="pb-1">
                      {slice.folded.map((entry) => (
                        <li
                          key={entry.category}
                          className="grid grid-cols-[1fr_auto] gap-2 py-1 pr-6 pl-11 text-[13px] text-muted-foreground"
                        >
                          <span className="truncate">{entry.category}</span>
                          <span className="tabular-nums">
                            {formatCurrencyFromCents(entry.monthlyCents)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

type ArcGeometry = {
  /** Degrees clockwise from 12 o'clock. */
  start: number;
  end: number;
  /** A lone slice is a closed ring rather than an arc with caps. */
  full: boolean;
};

type ArcProps = {
  slice: CategorySlice;
  geometry: ArcGeometry;
  isActive: boolean;
  isDimmed: boolean;
  onPointerEnter: () => void;
  onClick: () => void;
};

function Arc({
  slice,
  geometry,
  isActive,
  isDimmed,
  onPointerEnter,
  onClick,
}: ArcProps) {
  const color = sliceColor(slice);
  const visibleStyle = {
    strokeWidth: isActive ? ACTIVE_RING_WIDTH : RING_WIDTH,
    opacity: isDimmed ? 0.35 : 1,
  };
  const visibleClassName =
    'cursor-pointer transition-[stroke-width,opacity] duration-150 ease-out';

  if (geometry.full) {
    return (
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        fill="none"
        stroke={color}
        className={visibleClassName}
        style={visibleStyle}
        onPointerEnter={onPointerEnter}
        onClick={onClick}
      />
    );
  }

  return (
    <>
      <path
        d={arcPath(
          Math.max(0, geometry.start - 1),
          Math.min(360, geometry.end + 1),
        )}
        fill="none"
        stroke="transparent"
        strokeWidth={RING_WIDTH + HIT_PADDING}
        className="cursor-pointer"
        onPointerEnter={onPointerEnter}
        onClick={onClick}
      />
      <path
        d={arcPath(geometry.start, geometry.end)}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        className={visibleClassName}
        style={visibleStyle}
        onPointerEnter={onPointerEnter}
        onClick={onClick}
      />
    </>
  );
}

/** A user category literally named "Other" must not collide with the fold. */
function sliceKey(slice: CategorySlice): string {
  return `${slice.kind}:${slice.category}`;
}

function sliceColor(slice: CategorySlice): string {
  return slice.kind === 'other'
    ? 'var(--category-other)'
    : `var(--category-${slice.slot})`;
}

function formatShare(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function formatCount(count: number): string {
  return count === 1 ? '1 sub' : `${count} subs`;
}

function polar(angle: number): [number, number] {
  const radians = ((angle - 90) * Math.PI) / 180;
  return [
    CENTER + RADIUS * Math.cos(radians),
    CENTER + RADIUS * Math.sin(radians),
  ];
}

function arcPath(startDeg: number, endDeg: number): string {
  const [x1, y1] = polar(startDeg);
  const [x2, y2] = polar(endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1.toFixed(3)} ${y1.toFixed(3)} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2.toFixed(3)} ${y2.toFixed(3)}`;
}

/**
 * Places each slice around the ring.
 *
 * Round caps add half the ring width of visible length at both ends, so the
 * drawn arc is shortened by a full ring width and the *visible* extent (arc
 * plus caps) stays proportional to share. A slice too small for its caps
 * collapses to a zero-length path, which round caps render as a dot.
 */
function layoutArcs(slices: CategorySlice[]): ArcGeometry[] {
  if (slices.length === 1) return [{ start: 0, end: 360, full: true }];

  const usable = CIRCUMFERENCE - slices.length * GAP;
  let cursor = 0;

  return slices.map((slice) => {
    const visiblePx = slice.share * usable;
    const arcPx = Math.max(0.01, visiblePx - RING_WIDTH);
    const startPx = cursor + RING_WIDTH / 2;
    cursor += visiblePx + GAP;

    return {
      start: (startPx / CIRCUMFERENCE) * 360,
      end: ((startPx + arcPx) / CIRCUMFERENCE) * 360,
      full: false,
    };
  });
}
