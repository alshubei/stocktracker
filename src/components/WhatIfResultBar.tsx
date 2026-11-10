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

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 border-t border-border bg-panel/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <p className="pointer-events-auto mx-auto m-0 max-w-[1180px] text-center text-sm leading-snug text-ink sm:text-[0.95rem]">
        If you had put <strong>{formatEur(result.capitalEur)}</strong> into{" "}
        <strong>{tickerPhrase}</strong>
        {focusLabel ? (
          <span className="text-muted"> ({focusLabel})</span>
        ) : null}{" "}
        on <strong>{result.entryDate}</strong>, it would be worth{" "}
        <strong>{formatEur(result.totalValueEur)}</strong> now{" "}
        <span className={pnlClass(result.totalPnlPercent)}>
          ({formatPct(result.totalPnlPercent)})
        </span>
        .
      </p>
    </div>
  );
}
