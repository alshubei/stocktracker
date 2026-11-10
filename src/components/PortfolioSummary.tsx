import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PortfolioResult } from "../lib/portfolio.ts";
import {
  formatEur,
  formatPct,
  formatUsd,
  pnlChartColor,
  pnlClass,
} from "../lib/format.ts";
import { WHAT_IF_SERIES_ID } from "../lib/snapshots.ts";
import { ChartTooltip } from "./ChartTooltip.tsx";
import {
  CompareChartTooltip,
  type CompareSeriesMeta,
} from "./CompareChartTooltip.tsx";

export type ChartSeriesModel = CompareSeriesMeta & {
  result: PortfolioResult | null;
};

type PortfolioSummaryProps = {
  result: PortfolioResult | null;
  /** When non-empty, chart overlays what-if + snapshots. */
  compareSeries?: ChartSeriesModel[];
  compareData?: Array<Record<string, string | number>>;
};

const compactEurAxis = (v: number) =>
  new Intl.NumberFormat("de-DE", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);

/** Tight plot margins — favor series width over axis chrome. */
const CHART_MARGIN = { top: 6, right: 4, left: 0, bottom: 0 };

export function PortfolioSummary({
  result,
  compareSeries = [],
  compareData = [],
}: PortfolioSummaryProps) {
  if (!result) {
    return (
      <section className="panel min-w-0 animate-[rise_0.75s_ease_both]">
        <p className="m-0 text-muted">
          Chart waits for market data. You can still set Focus, weights, and
          snapshots offline.
        </p>
      </section>
    );
  }

  const chartColor = pnlChartColor(result.totalPnlEur);
  const comparing = compareSeries.length > 0;
  const drawable = compareSeries.filter((s) => s.result != null);
  const fxDelta = result.latestFx - result.entryFx;

  return (
    <section className="panel min-w-0 overflow-hidden p-3 animate-[rise_0.75s_ease_both] max-sm:-mx-1.5 sm:p-4">
      <div className="mb-3 min-w-0 px-0.5 sm:mb-4 sm:px-0">
        <div className="mx-auto grid max-w-xl grid-cols-2 gap-3 sm:gap-6">
          <div className="min-w-0">
            <span className="mb-1 block text-xs text-muted sm:text-sm">
              {comparing ? "What-if value" : "Current value"}
            </span>
            <strong className="block text-[1.2rem] tabular-nums [overflow-wrap:anywhere] sm:text-[1.35rem]">
              {formatEur(result.totalValueEur)}
            </strong>
            <span className="text-xs text-muted sm:text-sm">
              {formatUsd(result.totalValueUsd)}
            </span>
          </div>
          <div className="min-w-0">
            <span className="mb-1 block text-xs text-muted sm:text-sm">
              P&amp;L since entry
            </span>
            <strong
              className={`flex flex-wrap items-baseline gap-2 text-[1.2rem] tabular-nums sm:text-[1.35rem] ${pnlClass(result.totalPnlEur)}`}
            >
              <span className="[overflow-wrap:anywhere]">
                {formatEur(result.totalPnlEur)}
              </span>
              <span
                className={`text-sm font-semibold ${pnlClass(result.totalPnlEur)}`}
                title={
                  result.totalPnlEur === 0
                    ? "Flat since entry"
                    : result.totalPnlEur > 0
                      ? "Gain since entry"
                      : "Loss since entry"
                }
                aria-label={
                  result.totalPnlEur === 0
                    ? "P&L flat since entry"
                    : result.totalPnlEur > 0
                      ? "P&L up since entry"
                      : "P&L down since entry"
                }
              >
                {result.totalPnlEur === 0
                  ? "→"
                  : result.totalPnlEur > 0
                    ? "▲"
                    : "▼"}
              </span>
            </strong>
            <span className={`text-xs sm:text-sm ${pnlClass(result.totalPnlPercent)}`}>
              {formatPct(result.totalPnlPercent)}
            </span>
          </div>
        </div>
        <p
          className="mt-2 mb-0 text-center text-[0.7rem] text-muted sm:mt-3 sm:text-xs"
          title={
            fxDelta === 0
              ? "EURUSD unchanged vs entry"
              : fxDelta > 0
                ? `EURUSD up vs entry ${result.entryFx.toFixed(4)}`
                : `EURUSD down vs entry ${result.entryFx.toFixed(4)}`
          }
        >
          EURUSD {result.latestFx.toFixed(4)}
          <span className={`ml-1 font-semibold ${pnlClass(fxDelta)}`}>
            {fxDelta === 0 ? "→" : fxDelta > 0 ? "▲" : "▼"}
          </span>
          <span className="mx-1.5 text-border" aria-hidden>
            ·
          </span>
          entry {result.entryFx.toFixed(4)}
        </p>
      </div>

      {/* Full-bleed plot on small screens; reclaim side padding for the series */}
      <div className="-mx-1.5 h-[260px] min-w-0 overflow-hidden sm:mx-0 sm:h-[280px] lg:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {comparing ? (
            <LineChart data={compareData} margin={CHART_MARGIN}>
              <CartesianGrid stroke="#2a3831" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#93a59b", fontSize: 10 }}
                minTickGap={28}
                tickMargin={4}
                height={28}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#93a59b", fontSize: 10 }}
                width={40}
                tickMargin={2}
                axisLine={false}
                tickLine={false}
                tickFormatter={compactEurAxis}
              />
              <Tooltip
                content={<CompareChartTooltip series={drawable} />}
                wrapperStyle={{ pointerEvents: "auto", outline: "none" }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#93a59b", paddingTop: 4 }}
                iconSize={8}
                formatter={(value) => {
                  const match = drawable.find((s) => s.id === value);
                  return match?.label ?? value;
                }}
              />
              {drawable.map((series) => (
                <Line
                  key={series.id}
                  type="monotone"
                  dataKey={series.id}
                  name={series.id}
                  stroke={series.color}
                  strokeWidth={
                    series.id === WHAT_IF_SERIES_ID ? 2.5 : 1.75
                  }
                  strokeDasharray={
                    series.id === WHAT_IF_SERIES_ID ? undefined : "5 4"
                  }
                  dot={false}
                  connectNulls={false}
                  isAnimationActive
                  animationDuration={600}
                />
              ))}
            </LineChart>
          ) : (
            <AreaChart data={result.valueSeries} margin={CHART_MARGIN}>
              <defs>
                <linearGradient id="valueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.35} />
                  <stop
                    offset="100%"
                    stopColor={chartColor}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2a3831" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#93a59b", fontSize: 10 }}
                minTickGap={28}
                tickMargin={4}
                height={28}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#93a59b", fontSize: 10 }}
                width={40}
                tickMargin={2}
                axisLine={false}
                tickLine={false}
                tickFormatter={compactEurAxis}
              />
              <Tooltip
                content={<ChartTooltip />}
                wrapperStyle={{ pointerEvents: "auto", outline: "none" }}
              />
              <Area
                type="monotone"
                dataKey="valueEur"
                stroke={chartColor}
                fill="url(#valueFill)"
                strokeWidth={2}
                isAnimationActive
                animationDuration={700}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}
