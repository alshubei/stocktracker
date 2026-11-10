import { useId, useMemo, useState } from "react";
import type { Ticker } from "../config/universe.ts";
import { matchesTickerQuery } from "../config/universe.ts";
import type { WeightInputMode } from "../lib/allocation-input.ts";
import { AllocationInput } from "./AllocationInput.tsx";
import { InfoIcon } from "./InfoIcon.tsx";
import { KindBadge } from "./KindBadge.tsx";
import { WeightInputModeToggle } from "./WeightInputModeToggle.tsx";

type TickerFocusProps = {
  universe: Ticker[];
  selectedSymbols: string[];
  weights: Record<string, number>;
  capitalEur: number;
  weightInputMode: WeightInputMode;
  onWeightInputModeChange: (mode: WeightInputMode) => void;
  onSelectedChange: (symbols: string[]) => void;
  onAllocationCommit: (symbol: string, value: number) => void;
  onEqualSplit: () => void;
};

const FOCUS_HINT =
  "Check one or more tickers to concentrate the what-if. Capital is split across the selection using relative weights.";

export function TickerFocus({
  universe,
  selectedSymbols,
  weights,
  capitalEur,
  weightInputMode,
  onWeightInputModeChange,
  onSelectedChange,
  onAllocationCommit,
  onEqualSplit,
}: TickerFocusProps) {
  const [query, setQuery] = useState("");
  const [hintOpen, setHintOpen] = useState(false);
  // Mobile: collapsed when a selection already exists so the chart stays first.
  const [mobileOpen, setMobileOpen] = useState(
    () => selectedSymbols.length === 0,
  );
  const hintId = useId();
  const bodyId = useId();
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
      className="panel grid min-w-0 gap-3 animate-[rise_0.6s_ease_both]"
      aria-label="Ticker search and selection"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <h2 className="m-0 font-serif text-xl font-semibold">Focus</h2>
          <button
            type="button"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-bg0 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-expanded={hintOpen}
            aria-controls={hintId}
            onClick={() => setHintOpen((open) => !open)}
          >
            <InfoIcon className="size-4" />
            <span className="sr-only">
              {hintOpen ? "Hide focus help" : "Show focus help"}
            </span>
          </button>
          <span className="truncate text-sm text-muted lg:hidden">
            {selectedSymbols.length === 0
              ? "None selected"
              : `${selectedSymbols.length} selected`}
          </span>
        </div>
        <button
          type="button"
          className="text-xs font-medium text-muted underline-offset-2 hover:text-ink hover:underline lg:hidden"
          aria-expanded={mobileOpen}
          aria-controls={bodyId}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? "Hide" : "Edit tickers"}
        </button>
      </div>
      <p className="sr-only">{FOCUS_HINT}</p>
      <div
        id={hintId}
        aria-hidden
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          hintOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <p className="mt-0 mb-0 max-w-2xl text-sm text-muted">{FOCUS_HINT}</p>
        </div>
      </div>

      <div
        id={bodyId}
        className={`grid gap-3 ${mobileOpen ? "" : "max-lg:hidden"}`}
      >
      <label className="field w-full">
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
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
      </div>

      <div className="grid gap-1" role="group" aria-label="Tickers">
        {filtered.map((ticker) => {
          const active = selected.has(ticker.symbol);
          const id = `ticker-check-${ticker.symbol}`;
          const weightId = `ticker-weight-${ticker.symbol}`;
          return (
            <div
              key={ticker.symbol}
              className={`flex min-w-0 flex-wrap items-center gap-2 rounded-md border bg-bg0 px-2 py-1.5 text-sm ${
                active ? "border-accent" : "border-border"
              }`}
            >
              <input
                id={id}
                className="check-input shrink-0"
                type="checkbox"
                checked={active}
                onChange={() => toggleSymbol(ticker.symbol)}
                aria-label={`Select ${ticker.symbol}`}
              />
              <label
                htmlFor={id}
                className="flex min-w-0 flex-1 basis-[8rem] cursor-pointer items-center gap-2"
              >
                <span className="shrink-0 font-semibold tracking-wide">
                  {ticker.symbol}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-muted">
                  {ticker.name}
                </span>
              </label>
              <KindBadge kind={ticker.kind} />
              {active ? (
                <AllocationInput
                  id={weightId}
                  symbol={ticker.symbol}
                  weightPercent={weights[ticker.symbol] ?? 0}
                  capitalEur={capitalEur}
                  mode={weightInputMode}
                  onCommit={onAllocationCommit}
                  className="field-input w-[4.5rem] max-w-full min-w-0 px-1.5 py-1 text-sm text-ink"
                />
              ) : (
                <span className="w-[4.5rem] shrink-0 text-right text-xs text-muted">
                  —
                </span>
              )}
            </div>
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
      </div>
    </section>
  );
}
