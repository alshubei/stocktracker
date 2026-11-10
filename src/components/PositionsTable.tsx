import { useMemo, useState } from "react";
import type { Ticker } from "../config/universe.ts";
import { matchesTickerQuery } from "../config/universe.ts";
import type { WeightInputMode } from "../lib/allocation-input.ts";
import { weightToEur } from "../lib/allocation-input.ts";
import type { PositionResult } from "../lib/portfolio.ts";
import {
  formatEur,
  formatPct,
  formatShares,
  formatUsd,
  pnlClass,
} from "../lib/format.ts";
import { AllocationInput } from "./AllocationInput.tsx";
import { KindBadge } from "./KindBadge.tsx";
import { WeightInputModeToggle } from "./WeightInputModeToggle.tsx";

type PositionsTableProps = {
  universe: Ticker[];
  weights: Record<string, number>;
  positions: PositionResult[] | null;
  weightSum: number;
  weightsValid: boolean;
  capitalEur: number;
  weightInputMode: WeightInputMode;
  onWeightInputModeChange: (mode: WeightInputMode) => void;
  errors: Record<string, string>;
  selectedSymbols: string[];
  onAllocationCommit: (symbol: string, value: number) => void;
  onEqualSplit: () => void;
};

export function PositionsTable({
  universe,
  weights,
  positions,
  weightSum,
  weightsValid,
  capitalEur,
  weightInputMode,
  onWeightInputModeChange,
  errors,
  selectedSymbols,
  onAllocationCommit,
  onEqualSplit,
}: PositionsTableProps) {
  const [query, setQuery] = useState("");
  const bySymbol = new Map(positions?.map((p) => [p.symbol, p]) ?? []);
  const selected = useMemo(() => new Set(selectedSymbols), [selectedSymbols]);

  const visible = useMemo(() => {
    return universe.filter(
      (t) => selected.has(t.symbol) && matchesTickerQuery(t, query),
    );
  }, [universe, query, selected]);

  return (
    <section className="panel animate-[rise_0.75s_ease_both]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
        <h2 className="m-0 font-serif text-xl font-semibold">Positions</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="text-xs font-medium text-muted underline-offset-2 hover:text-ink hover:underline disabled:pointer-events-none disabled:opacity-40"
              onClick={onEqualSplit}
              disabled={selectedSymbols.length === 0}
            >
              Reset equally
            </button>
            <WeightInputModeToggle
              mode={weightInputMode}
              onChange={onWeightInputModeChange}
            />
          </div>
          <label className="field min-w-[12rem]">
            <span className="sr-only">Filter positions</span>
            <input
              className="field-input w-full"
              type="search"
              placeholder="Filter tickers…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <span className={weightsValid ? "text-muted" : "text-warn"}>
            {weightInputMode === "eur" ? (
              <>Allocated: {formatEur(weightToEur(weightSum, capitalEur))}</>
            ) : (
              <>Weights sum: {weightSum.toFixed(2)}%</>
            )}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[0.92rem]">
          <thead>
            <tr>
              {(
                [
                  "Ticker",
                  "Type",
                  weightInputMode === "eur" ? "Allocation €" : "Weight %",
                  "€ allocated",
                  "Entry $",
                  "Shares",
                  "Now €",
                  "P&L",
                  "Now $",
                ] as const
              ).map((label) => (
                <th
                  key={label}
                  className="border-b border-border px-2 py-2.5 text-left align-top text-[0.78rem] font-medium tracking-wide text-muted uppercase"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((ticker) => {
              const row = bySymbol.get(ticker.symbol);
              const err = errors[ticker.symbol];
              return (
                <tr key={ticker.symbol}>
                  <td className="border-b border-border px-2 py-2.5 align-top">
                    <div className="grid gap-0.5">
                      <strong>{ticker.symbol}</strong>
                      <span className="text-muted">{ticker.name}</span>
                      {err ? <span className="text-warn">{err}</span> : null}
                    </div>
                  </td>
                  <td className="border-b border-border px-2 py-2.5 align-top">
                    <KindBadge kind={ticker.kind} />
                  </td>
                  <td className="border-b border-border px-2 py-2.5 align-top">
                    <AllocationInput
                      id={`position-weight-${ticker.symbol}`}
                      symbol={ticker.symbol}
                      weightPercent={weights[ticker.symbol] ?? 0}
                      capitalEur={capitalEur}
                      mode={weightInputMode}
                      onCommit={onAllocationCommit}
                      className="field-input w-[5.5rem] min-w-[5rem] px-1.5 py-1 text-sm text-ink"
                    />
                  </td>
                  <td className="border-b border-border px-2 py-2.5 align-top">
                    {row ? formatEur(row.eurAllocated) : "—"}
                  </td>
                  <td className="border-b border-border px-2 py-2.5 align-top">
                    {row
                      ? `${formatUsd(row.entryPriceUsd)} (${row.entryDateUsed})`
                      : "—"}
                  </td>
                  <td className="border-b border-border px-2 py-2.5 align-top">
                    {row ? formatShares(row.shares) : "—"}
                  </td>
                  <td className="border-b border-border px-2 py-2.5 align-top">
                    {row ? formatEur(row.valueEur) : "—"}
                  </td>
                  <td
                    className={`border-b border-border px-2 py-2.5 align-top ${
                      row ? pnlClass(row.pnlEur) : ""
                    }`}
                  >
                    {row
                      ? `${formatEur(row.pnlEur)} (${formatPct(row.pnlPercent)})`
                      : "—"}
                  </td>
                  <td className="border-b border-border px-2 py-2.5 align-top">
                    {row ? formatUsd(row.valueUsd) : "—"}
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-2 py-3 text-muted">
                  {selectedSymbols.length === 0
                    ? "No tickers selected — pick some in Focus."
                    : "No positions match the filter."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
