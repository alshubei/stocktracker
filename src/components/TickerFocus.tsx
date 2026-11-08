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
    <section className="ticker-focus" aria-label="Ticker search and selection">
      <div className="ticker-focus-head">
        <div className="ticker-focus-title-row">
          <label className="select-all">
            <input
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
            <h2>Focus</h2>
            <p className="muted">
              Check one or more tickers to concentrate the what-if. Capital is
              split across the selection using relative weights. ◆ stock · ▤
              ETF
            </p>
          </div>
        </div>
        <label className="ticker-search">
          Search
          <input
            type="search"
            placeholder="NVDA, Broadcom, ETF…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="ticker-chips" role="group" aria-label="Tickers">
        {filtered.map((ticker) => {
          const active = selected.has(ticker.symbol);
          const id = `ticker-check-${ticker.symbol}`;
          return (
            <label
              key={ticker.symbol}
              htmlFor={id}
              className={`ticker-chip ${ticker.kind}${active ? " active" : ""}`}
            >
              <input
                id={id}
                type="checkbox"
                checked={active}
                onChange={() => toggleSymbol(ticker.symbol)}
              />
              <span className="ticker-chip-symbol">{ticker.symbol}</span>
              <KindBadge kind={ticker.kind} />
              <span className="ticker-chip-name">{ticker.name}</span>
            </label>
          );
        })}
        {filtered.length === 0 ? (
          <span className="muted">No tickers match “{query}”.</span>
        ) : null}
      </div>

      {selectedTickers.length === 0 ? (
        <p className="focus-banner warn-inline">
          No tickers selected — check at least one to compute P&amp;L.
        </p>
      ) : selectedTickers.length < universe.length ? (
        <p className="focus-banner">
          Concentrating on{" "}
          <strong>
            {selectedTickers.map((t) => t.symbol).join(", ")}
          </strong>{" "}
          ({selectedTickers.length}/{universe.length}) — summary, presets, and
          chart use full capital across this selection.
        </p>
      ) : null}
    </section>
  );
}
