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
  onSelectedChange: (symbols: string[]) => void;
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
  onSelectedChange,
  onAllocationCommit,
  onEqualSplit,
}: PositionsTableProps) {
  const [query, setQuery] = useState("");
  const bySymbol = new Map(positions?.map((p) => [p.symbol, p]) ?? []);
  const selected = useMemo(() => new Set(selectedSymbols), [selectedSymbols]);
  const isPartialSelection =
    selectedSymbols.length > 0 && selectedSymbols.length < universe.length;

  const visible = useMemo(() => {
    const matched = universe.filter((t) => matchesTickerQuery(t, query));
    if (
      selectedSymbols.length > 0 &&
      selectedSymbols.length < universe.length &&
      !query.trim()
    ) {
      return [...matched].sort((a, b) => {
        const aOn = selected.has(a.symbol) ? 0 : 1;
        const bOn = selected.has(b.symbol) ? 0 : 1;
        return aOn - bOn;
      });
    }
    return matched;
  }, [universe, query, selectedSymbols, selected]);

  const allSymbols = universe.map((t) => t.symbol);
  const allSelected =
    allSymbols.length > 0 && allSymbols.every((s) => selected.has(s));
  const someSelected = selectedSymbols.length > 0 && !allSelected;

  function toggleSymbol(symbol: string) {
    if (selected.has(symbol)) {
      onSelectedChange(selectedSymbols.filter((s) => s !== symbol));
    } else {
      onSelectedChange([...selectedSymbols, symbol]);
    }
  }

  function toggleSelectAll(checked: boolean) {
    onSelectedChange(checked ? allSymbols : []);
  }

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
              <>
                Allocated
                {isPartialSelection ? " (selection)" : ""}:{" "}
                {formatEur(weightToEur(weightSum, capitalEur))}
              </>
            ) : (
              <>
                Weights sum
                {isPartialSelection ? " (selection)" : ""}:{" "}
                {weightSum.toFixed(2)}%
              </>
            )}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[0.92rem]">
          <thead>
            <tr>
              <th className="w-8 px-2 py-2.5 text-center align-middle text-[0.78rem] font-medium tracking-wide text-muted uppercase">
                <input
                  className="check-input"
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  aria-label="Select all tickers"
                />
              </th>
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
              const isOn = selected.has(ticker.symbol);
              const dimmed = isPartialSelection && !isOn;
              return (
                <tr
                  key={ticker.symbol}
                  className={`${isOn && isPartialSelection ? "bg-accent/10" : ""} ${dimmed ? "opacity-45" : ""}`}
                >
                  <td className="w-8 border-b border-border px-2 py-2.5 text-center align-middle">
                    <input
                      className="check-input"
                      type="checkbox"
                      checked={isOn}
                      onChange={() => toggleSymbol(ticker.symbol)}
                      aria-label={`Select ${ticker.symbol}`}
                    />
                  </td>
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
                    {dimmed || !isOn ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <AllocationInput
                        id={`position-weight-${ticker.symbol}`}
                        symbol={ticker.symbol}
                        weightPercent={weights[ticker.symbol] ?? 0}
                        capitalEur={capitalEur}
                        mode={weightInputMode}
                        onCommit={onAllocationCommit}
                        className="field-input w-[5.5rem] min-w-[5rem] px-1.5 py-1 text-sm text-ink"
                      />
                    )}
                  </td>
                  <td className="border-b border-border px-2 py-2.5 align-top">
                    {dimmed ? "—" : row ? formatEur(row.eurAllocated) : "—"}
                  </td>
                  <td className="border-b border-border px-2 py-2.5 align-top">
                    {!dimmed && row
                      ? `${formatUsd(row.entryPriceUsd)} (${row.entryDateUsed})`
                      : "—"}
                  </td>
                  <td className="border-b border-border px-2 py-2.5 align-top">
                    {!dimmed && row ? formatShares(row.shares) : "—"}
                  </td>
                  <td className="border-b border-border px-2 py-2.5 align-top">
                    {!dimmed && row ? formatEur(row.valueEur) : "—"}
                  </td>
                  <td
                    className={`border-b border-border px-2 py-2.5 align-top ${
                      !dimmed && row ? pnlClass(row.pnlEur) : ""
                    }`}
                  >
                    {!dimmed && row
                      ? `${formatEur(row.pnlEur)} (${formatPct(row.pnlPercent)})`
                      : "—"}
                  </td>
                  <td className="border-b border-border px-2 py-2.5 align-top">
                    {!dimmed && row ? formatUsd(row.valueUsd) : "—"}
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-2 py-3 text-muted">
                  No positions match the filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
