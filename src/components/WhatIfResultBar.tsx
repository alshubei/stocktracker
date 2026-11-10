import type { PortfolioResult } from "../lib/portfolio.ts";
import { formatEur, formatPct, pnlClass } from "../lib/format.ts";

type WhatIfResultBarProps = {
  result: PortfolioResult;
  focusLabel?: string | null;
};

export function WhatIfResultBar({
  result,
  focusLabel = null,
}: WhatIfResultBarProps) {
  const tickerPhrase =
    result.positions.length === 1
      ? result.positions[0]!.symbol
      : `${result.positions.length} tickers`;

  const edge =
    result.totalPnlPercent > 0
      ? "border-accent/40"
      : result.totalPnlPercent < 0
        ? "border-neg/35"
        : "border-border";

  const wash =
    result.totalPnlPercent > 0
      ? "from-accent/[0.10] to-transparent"
      : result.totalPnlPercent < 0
        ? "from-neg/[0.08] to-transparent"
        : "from-transparent to-transparent";

  const arrow =
    result.totalPnlPercent === 0
      ? "→"
      : result.totalPnlPercent > 0
        ? "▲"
        : "▼";

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-30 border-t ${edge} bg-[#18241f]/[0.94] shadow-[0_-12px_32px_rgba(0,0,0,0.28)] backdrop-blur-lg`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b ${wash}`}
        aria-hidden
      />
      <div className="pointer-events-auto relative mx-auto flex w-full min-w-0 max-w-[1280px] flex-col items-center gap-2 px-4 py-3.5 pb-[max(0.85rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-end sm:justify-center sm:gap-6">
        <div className="flex min-w-0 max-w-full flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
          <div className="min-w-0 text-center sm:text-left">
            <span className="mb-0.5 block text-[0.7rem] font-medium tracking-wide text-muted uppercase">
              Now worth
            </span>
            <strong className="block font-serif text-[1.35rem] leading-none tabular-nums tracking-tight [overflow-wrap:anywhere] sm:text-[1.7rem]">
              {formatEur(result.totalValueEur)}
            </strong>
          </div>
          <div
            className={`flex min-w-0 flex-wrap items-baseline justify-center gap-1.5 font-semibold tabular-nums ${pnlClass(result.totalPnlPercent)}`}
          >
            <span className="text-base sm:text-lg" aria-hidden>
              {arrow}
            </span>
            <span className="text-lg sm:text-xl">
              {formatPct(result.totalPnlPercent)}
            </span>
            <span className="text-sm opacity-90 sm:text-base">
              ({formatEur(result.totalPnlEur)})
            </span>
          </div>
        </div>

        <p className="m-0 max-w-full text-center text-xs leading-snug text-muted [overflow-wrap:anywhere] sm:max-w-none sm:flex-1 sm:text-left sm:text-[0.82rem]">
          If you had put{" "}
          <span className="text-ink">{formatEur(result.capitalEur)}</span> into{" "}
          <span className="text-ink">{tickerPhrase}</span>
          {focusLabel ? (
            <span className="text-muted"> ({focusLabel})</span>
          ) : null}{" "}
          on <span className="text-ink">{result.entryDate}</span>.
        </p>
      </div>
    </div>
  );
}
