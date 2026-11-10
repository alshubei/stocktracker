import type { ValueSeriesPoint } from "../lib/portfolio.ts";
import { formatEur, formatUsd, pnlClass } from "../lib/format.ts";

type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ payload?: ValueSeriesPoint }>;
};

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="min-w-[200px] rounded-lg border border-border bg-panel px-3 py-2 text-sm text-ink shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
      <div className="mb-1 text-muted">{String(label ?? point.date)}</div>
      <div className="mb-2 font-semibold">{formatEur(point.valueEur)}</div>
      <ul className="m-0 list-none space-y-2 p-0">
        {point.tickers.map((t) => (
          <li key={t.symbol} className="flex flex-col gap-0.5">
            <span className="font-semibold tracking-wide">{t.symbol}</span>
            <span className={pnlClass(t.hoverUsd - t.entryUsd)}>
              {formatUsd(t.entryUsd)} → {formatUsd(t.hoverUsd)}
            </span>
            <span className="text-xs text-muted">
              now {formatUsd(t.latestUsd)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
