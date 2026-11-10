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

export function PortfolioSummary({
  result,
  compareSeries = [],
  compareData = [],
}: PortfolioSummaryProps) {
  if (!result) {
    return (
      <section className="panel animate-[rise_0.75s_ease_both]">
        <p className="m-0 text-muted">
          Load market data to see portfolio summary.
        </p>
      </section>
    );
  }

  const chartColor = pnlChartColor(result.totalPnlEur);
  const comparing = compareSeries.length > 0;
  const drawable = compareSeries.filter((s) => s.result != null);
  const fxDelta = result.latestFx - result.entryFx;

  return (
    <section className="panel animate-[rise_0.75s_ease_both]">
      <div className="mb-4">
        <div className="mx-auto grid max-w-xl grid-cols-2 gap-6">
          <div>
            <span className="mb-1 block text-sm text-muted">
              {comparing ? "What-if value" : "Current value"}
            </span>
            <strong className="block text-[1.35rem]">
              {formatEur(result.totalValueEur)}
            </strong>
            <span className="text-sm text-muted">
              {formatUsd(result.totalValueUsd)}
            </span>
          </div>
          <div>
            <span className="mb-1 block text-sm text-muted">
              P&amp;L since entry
            </span>
            <strong
              className={`flex items-baseline gap-2 text-[1.35rem] ${pnlClass(result.totalPnlEur)}`}
            >
              <span>{formatEur(result.totalPnlEur)}</span>
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
            <span className={`text-sm ${pnlClass(result.totalPnlPercent)}`}>
              {formatPct(result.totalPnlPercent)}
            </span>
          </div>
        </div>
        <p
          className="mt-3 mb-0 text-center text-xs text-muted"
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

      <div className="h-[280px] w-full lg:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {comparing ? (
            <LineChart data={compareData}>
              <CartesianGrid stroke="#2a3831" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#93a59b", fontSize: 12 }}
                minTickGap={40}
              />
              <YAxis
                tick={{ fill: "#93a59b", fontSize: 12 }}
                width={72}
                tickFormatter={(v: number) =>
                  new Intl.NumberFormat("de-DE", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(v)
                }
              />
              <Tooltip
                content={<CompareChartTooltip series={drawable} />}
                wrapperStyle={{ pointerEvents: "auto", outline: "none" }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: "#93a59b" }}
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
            <AreaChart data={result.valueSeries}>
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
                tick={{ fill: "#93a59b", fontSize: 12 }}
                minTickGap={40}
              />
              <YAxis
                tick={{ fill: "#93a59b", fontSize: 12 }}
                width={72}
                tickFormatter={(v: number) =>
                  new Intl.NumberFormat("de-DE", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(v)
                }
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
