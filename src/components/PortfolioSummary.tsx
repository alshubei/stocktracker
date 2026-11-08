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
import { formatEur, formatPct, formatUsd, pnlClass } from "../lib/format.ts";

type PortfolioSummaryProps = {
  result: PortfolioResult | null;
};

export function PortfolioSummary({ result }: PortfolioSummaryProps) {
  if (!result) {
    return (
      <section className="summary">
        <p className="muted">Load market data to see portfolio summary.</p>
      </section>
    );
  }

  return (
    <section className="summary">
      <div className="summary-stats">
        <div>
          <span className="stat-label">Current value</span>
          <strong>{formatEur(result.totalValueEur)}</strong>
          <span className="secondary">{formatUsd(result.totalValueUsd)}</span>
        </div>
        <div>
          <span className="stat-label">P&amp;L since entry</span>
          <strong className={pnlClass(result.totalPnlEur)}>
            {formatEur(result.totalPnlEur)}
          </strong>
          <span className={`secondary ${pnlClass(result.totalPnlPercent)}`}>
            {formatPct(result.totalPnlPercent)}
          </span>
        </div>
        <div>
          <span className="stat-label">FX EURUSD</span>
          <strong>{result.latestFx.toFixed(4)}</strong>
          <span className="secondary">
            entry {result.entryFx.toFixed(4)}
          </span>
        </div>
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={result.valueSeries}>
            <defs>
              <linearGradient id="valueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              width={72}
              tickFormatter={(v: number) =>
                new Intl.NumberFormat("de-DE", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(v)
              }
            />
            <Tooltip
              formatter={(value: number) => [formatEur(value), "Value"]}
              contentStyle={{
                background: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
            />
            <Area
              type="monotone"
              dataKey="valueEur"
              stroke="var(--accent)"
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
