import {
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  XAxis,
  YAxis,
  type RectangleProps,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import type { SpendTrendPoint } from '@/features/dashboard/domain';
import {
  TREND_MONTHS_AFTER,
  TREND_MONTHS_BEFORE,
} from '@/features/dashboard/domain';
import { formatCurrencyFromCents } from '@/features/subscriptions/cost';

/** Bars stay slim regardless of card width; the band's leftover is air. */
const MAX_BAR_PX = 24;

/** Rounded data-end on the topmost segment only; the baseline stays square. */
const BAR_RADIUS = 4;

const chartConfig = {
  recordedCents: {
    label: 'Recorded',
    color: 'var(--chart-4)',
  },
  projectedCents: {
    label: 'Projected',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

type SpendTrendChartProps = {
  points: SpendTrendPoint[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

/**
 * Monthly spend, recorded months behind and projected months ahead.
 *
 * The two series are stacked so the current month reads as one bar: what has
 * been recorded so far sits under what is still expected. Every other month
 * only ever has one of the two, so the stack is invisible there.
 */
export function SpendTrendChart({
  points,
  isLoading,
  isError,
  onRetry,
}: SpendTrendChartProps) {
  return (
    <Card className="gap-0 py-0 lg:col-span-2">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base">Spend over time</CardTitle>
        <CardDescription>
          Recorded invoices for the past {TREND_MONTHS_BEFORE} months and
          projected invoices for the next {TREND_MONTHS_AFTER}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 pb-3">
        {isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : isError ? (
          <div className="grid h-72 place-items-center text-center text-sm text-muted-foreground">
            <div>
              <p>Recorded history is unavailable.</p>
              <button
                type="button"
                className="mt-1 text-sm font-medium text-destructive underline underline-offset-4"
                onClick={onRetry}
              >
                Retry history
              </button>
            </div>
          </div>
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-72 w-full"
            >
              <BarChart
                accessibilityLayer
                data={points}
                margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
                barCategoryGap="30%"
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={0}
                  minTickGap={0}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  width={52}
                  tickFormatter={formatAxisCurrency}
                />
                <ChartTooltip
                  cursor={{ fillOpacity: 0.5 }}
                  content={<SpendTooltip />}
                />
                <ChartLegend
                  verticalAlign="top"
                  align="right"
                  content={<SpendLegend />}
                />
                <Bar
                  dataKey="recordedCents"
                  stackId="spend"
                  fill="var(--color-recordedCents)"
                  maxBarSize={MAX_BAR_PX}
                  shape={<RecordedBar />}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="projectedCents"
                  stackId="spend"
                  fill="var(--color-projectedCents)"
                  maxBarSize={MAX_BAR_PX}
                  radius={[BAR_RADIUS, BAR_RADIUS, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ChartContainer>
            <SpendTable points={points} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * The recorded segment is the bottom of the stack. It gets the rounded
 * data-end only when nothing is projected above it; otherwise the projected
 * segment is the data-end and this one must stay square so the join is
 * seamless.
 */
function RecordedBar(props: RectangleProps & { payload?: SpendTrendPoint }) {
  const rounded = (props.payload?.projectedCents ?? 0) === 0;

  return (
    <Rectangle
      {...props}
      radius={rounded ? [BAR_RADIUS, BAR_RADIUS, 0, 0] : 0}
    />
  );
}

/** Legend order follows time (recorded, then projected), not stack order. */
const LEGEND_ORDER: string[] = ['recordedCents', 'projectedCents'];

function SpendLegend(props: React.ComponentProps<typeof ChartLegendContent>) {
  const payload = [...(props.payload ?? [])].sort(
    (a, b) =>
      LEGEND_ORDER.indexOf(String(a.dataKey)) -
      LEGEND_ORDER.indexOf(String(b.dataKey)),
  );

  return (
    <ChartLegendContent
      {...props}
      payload={payload}
      className="justify-end pt-0 pb-4"
    />
  );
}

type SpendTooltipProps = {
  active?: boolean;
  payload?: { payload: SpendTrendPoint }[];
};

function SpendTooltip({ active, payload }: SpendTooltipProps) {
  const point = payload?.[0]?.payload;

  if (!active || !point) {
    return null;
  }

  const rows = [
    { key: 'recordedCents', cents: point.recordedCents },
    { key: 'projectedCents', cents: point.projectedCents },
  ].filter((row) => row.cents > 0 || point.status === 'current');

  return (
    <div className="grid min-w-40 gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">
        {point.longLabel}
        {point.status === 'current' ? (
          <span className="ml-1 font-normal text-muted-foreground">
            · current month
          </span>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <div className="text-muted-foreground">
          No invoices {point.status === 'past' ? 'recorded' : 'projected'}
        </div>
      ) : (
        <div className="grid gap-1">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: `var(--color-${row.key})` }}
              />
              <span className="flex-1 text-muted-foreground">
                {chartConfig[row.key as keyof typeof chartConfig].label}
              </span>
              <span className="font-medium text-foreground tabular-nums">
                {formatCurrencyFromCents(row.cents)}
              </span>
            </div>
          ))}
          {rows.length > 1 ? (
            <div className="flex items-center gap-2 border-t border-border/50 pt-1">
              <span className="size-2.5 shrink-0" aria-hidden />
              <span className="flex-1 text-muted-foreground">Total</span>
              <span className="font-medium text-foreground tabular-nums">
                {formatCurrencyFromCents(
                  point.recordedCents + point.projectedCents,
                )}
              </span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** Screen-reader table so every plotted value is reachable without hover. */
function SpendTable({ points }: { points: SpendTrendPoint[] }) {
  return (
    <table className="sr-only">
      <caption>Monthly spend, recorded and projected</caption>
      <thead>
        <tr>
          <th scope="col">Month</th>
          <th scope="col">Recorded</th>
          <th scope="col">Projected</th>
        </tr>
      </thead>
      <tbody>
        {points.map((point) => (
          <tr key={point.monthKey}>
            <th scope="row">{point.longLabel}</th>
            <td>{formatCurrencyFromCents(point.recordedCents)}</td>
            <td>{formatCurrencyFromCents(point.projectedCents)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatAxisCurrency(cents: number): string {
  const dollars = cents / 100;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: dollars >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: dollars >= 1000 ? 1 : 0,
  }).format(dollars);
}
