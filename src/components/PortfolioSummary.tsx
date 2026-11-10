import {
  Area,
  AreaChart,
  CartesianGrid,
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
import { ChartTooltip } from "./ChartTooltip.tsx";

type PortfolioSummaryProps = {
  result: PortfolioResult | null;
  focusLabel?: string | null;
};

export function PortfolioSummary({
  result,
  focusLabel = null,
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

  return (
    <section className="panel animate-[rise_0.75s_ease_both]">
      {focusLabel ? (
        <p className="mb-3 text-sm font-semibold text-accent">
          Focused: {focusLabel}
        </p>
      ) : null}
      <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
        <div>
          <span className="mb-1 block text-sm text-muted">Current value</span>
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
            className={`block text-[1.35rem] ${pnlClass(result.totalPnlEur)}`}
          >
            {formatEur(result.totalPnlEur)}
          </strong>
          <span className={`text-sm ${pnlClass(result.totalPnlPercent)}`}>
            {formatPct(result.totalPnlPercent)}
          </span>
        </div>
        <div>
          <span className="mb-1 block text-sm text-muted">FX EURUSD</span>
          <strong className="block text-[1.35rem]">
            {result.latestFx.toFixed(4)}
          </strong>
          <span className="text-sm text-muted">
            entry {result.entryFx.toFixed(4)}
          </span>
        </div>
      </div>

      <div className="min-h-[260px] w-full">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={result.valueSeries}>
            <defs>
              <linearGradient id="valueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0.02} />
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
            <Tooltip content={<ChartTooltip />} />
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
        </ResponsiveContainer>
      </div>
    </section>
  );
}
