import { useMemo, useState } from "react";
import type { Ticker } from "../config/universe.ts";
import { matchesTickerQuery } from "../config/universe.ts";
import type { PositionResult } from "../lib/portfolio.ts";
import {
  formatEur,
  formatPct,
  formatShares,
  formatUsd,
  pnlClass,
} from "../lib/format.ts";
import { KindBadge } from "./KindBadge.tsx";

type PositionsTableProps = {
  universe: Ticker[];
  weights: Record<string, number>;
  positions: PositionResult[] | null;
  weightSum: number;
  weightsValid: boolean;
  errors: Record<string, string>;
  selectedSymbols: string[];
  onSelectedChange: (symbols: string[]) => void;
  onWeightChange: (symbol: string, weight: number) => void;
  onEqualSplit: () => void;
};

export function PositionsTable({
  universe,
  weights,
  positions,
  weightSum,
  weightsValid,
  errors,
  selectedSymbols,
  onSelectedChange,
  onWeightChange,
  onEqualSplit,
}: PositionsTableProps) {
  const [query, setQuery] = useState("");
  const bySymbol = new Map(positions?.map((p) => [p.symbol, p]) ?? []);
  const selected = useMemo(() => new Set(selectedSymbols), [selectedSymbols]);

  const visible = useMemo(() => {
    const matched = universe.filter((t) => matchesTickerQuery(t, query));
    if (selectedSymbols.length > 0 && selectedSymbols.length < universe.length && !query.trim()) {
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
  const isPartialSelection =
    selectedSymbols.length > 0 && selectedSymbols.length < universe.length;

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
    <section className="positions">
      <div className="positions-head">
        <h2>Positions</h2>
        <div className="positions-actions">
          <label className="table-search">
            <span className="sr-only">Filter positions</span>
            <input
              type="search"
              placeholder="Filter tickers…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <span className={weightsValid ? "muted" : "warn"}>
            Weights sum: {weightSum.toFixed(2)}%
          </span>
          <button type="button" className="ghost" onClick={onEqualSplit}>
            Equal split
          </button>
        </div>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th className="check-col">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  aria-label="Select all tickers"
                />
              </th>
              <th>Ticker</th>
              <th>Type</th>
              <th>Weight %</th>
              <th>€ allocated</th>
              <th>Entry $</th>
              <th>Shares</th>
              <th>Now €</th>
              <th>P&amp;L</th>
              <th>Now $</th>
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
                  className={`${isOn && isPartialSelection ? "row-focus" : ""}${dimmed ? " row-dim" : ""}`}
                >
                  <td className="check-col">
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={() => toggleSymbol(ticker.symbol)}
                      aria-label={`Select ${ticker.symbol}`}
                    />
                  </td>
                  <td>
                    <div className="ticker-cell">
                      <strong>{ticker.symbol}</strong>
                      <span className="muted">{ticker.name}</span>
                      {err ? <span className="warn">{err}</span> : null}
                    </div>
                  </td>
                  <td>
                    <KindBadge kind={ticker.kind} />
                  </td>
                  <td>
                    <input
                      className="weight-input"
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={weights[ticker.symbol] ?? 0}
                      onChange={(e) =>
                        onWeightChange(ticker.symbol, Number(e.target.value))
                      }
                    />
                  </td>
                  <td>
                    {dimmed ? "—" : row ? formatEur(row.eurAllocated) : "—"}
                  </td>
                  <td>
                    {!dimmed && row
                      ? `${formatUsd(row.entryPriceUsd)} (${row.entryDateUsed})`
                      : "—"}
                  </td>
                  <td>{!dimmed && row ? formatShares(row.shares) : "—"}</td>
                  <td>{!dimmed && row ? formatEur(row.valueEur) : "—"}</td>
                  <td
                    className={
                      !dimmed && row ? pnlClass(row.pnlEur) : undefined
                    }
                  >
                    {!dimmed && row
                      ? `${formatEur(row.pnlEur)} (${formatPct(row.pnlPercent)})`
                      : "—"}
                  </td>
                  <td>{!dimmed && row ? formatUsd(row.valueUsd) : "—"}</td>
                </tr>
              );
            })}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={10} className="muted">
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
