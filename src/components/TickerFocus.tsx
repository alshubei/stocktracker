import { useMemo, useState } from "react";
import type { Ticker } from "../config/universe.ts";
import { matchesTickerQuery } from "../config/universe.ts";
import { KindBadge } from "./KindBadge.tsx";

type TickerFocusProps = {
  universe: Ticker[];
  selectedSymbols: string[];
  onSelectedChange: (symbols: string[]) => void;
};

export function TickerFocus({
  universe,
  selectedSymbols,
  onSelectedChange,
}: TickerFocusProps) {
  const [query, setQuery] = useState("");
  const selected = useMemo(() => new Set(selectedSymbols), [selectedSymbols]);

  const filtered = useMemo(
    () => universe.filter((t) => matchesTickerQuery(t, query)),
    [universe, query],
  );

  const allSymbols = universe.map((t) => t.symbol);
  const allSelected =
    allSymbols.length > 0 && allSymbols.every((s) => selected.has(s));
  const someSelected = selectedSymbols.length > 0 && !allSelected;

  const selectedTickers = universe.filter((t) => selected.has(t.symbol));

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
    <section
      className="panel grid gap-3.5 animate-[rise_0.6s_ease_both]"
      aria-label="Ticker search and selection"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <label className="mt-1 inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-ink">
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
            <span>Select all</span>
          </label>
          <div>
            <h2 className="m-0 font-serif text-xl font-semibold">Focus</h2>
            <p className="mt-1 mb-0 max-w-xl text-sm text-muted">
              Check one or more tickers to concentrate the what-if. Capital is
              split across the selection using relative weights.
            </p>
          </div>
        </div>
        <label className="field min-w-[14rem]">
          Search
          <input
            className="field-input w-full"
            type="search"
            placeholder="NVDA, Broadcom, ETF…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2.5" role="group" aria-label="Tickers">
        {filtered.map((ticker) => {
          const active = selected.has(ticker.symbol);
          const id = `ticker-check-${ticker.symbol}`;
          return (
            <label
              key={ticker.symbol}
              htmlFor={id}
              className={`grid min-w-[10.5rem] cursor-pointer grid-cols-[auto_1fr] gap-x-2.5 gap-y-0.5 rounded-lg border bg-bg0 px-3 py-2.5 ${
                active ? "border-accent" : "border-border"
              }`}
            >
              <input
                id={id}
                className="check-input row-span-3 self-center"
                type="checkbox"
                checked={active}
                onChange={() => toggleSymbol(ticker.symbol)}
              />
              <span className="font-semibold tracking-wide">
                {ticker.symbol}
              </span>
              <KindBadge kind={ticker.kind} />
              <span className="max-w-[11rem] truncate text-xs text-muted">
                {ticker.name}
              </span>
            </label>
          );
        })}
        {filtered.length === 0 ? (
          <span className="text-muted">No tickers match “{query}”.</span>
        ) : null}
      </div>

      {selectedTickers.length === 0 ? (
        <p className="m-0 rounded-lg border border-warn/40 bg-warn/12 px-3.5 py-2.5 text-[0.92rem]">
          No tickers selected — check at least one to compute P&amp;L.
        </p>
      ) : selectedTickers.length < universe.length ? (
        <p className="m-0 rounded-lg border border-accent/35 bg-accent/12 px-3.5 py-2.5 text-[0.92rem]">
          Concentrating on{" "}
          <strong>{selectedTickers.map((t) => t.symbol).join(", ")}</strong>{" "}
          ({selectedTickers.length}/{universe.length}) — summary and chart use
          full capital across this selection.
        </p>
      ) : null}
    </section>
  );
}
