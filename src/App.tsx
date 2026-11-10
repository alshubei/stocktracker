import { useCallback, useEffect, useMemo, useState } from "react";
import { PortfolioSummary } from "./components/PortfolioSummary.tsx";
import { PositionsTable } from "./components/PositionsTable.tsx";
import { SnapshotsPanel } from "./components/SnapshotsPanel.tsx";
import { TickerFocus } from "./components/TickerFocus.tsx";
import { SiteFooter } from "./components/SiteFooter.tsx";
import { TopBar } from "./components/TopBar.tsx";
import { WhatIfResultBar } from "./components/WhatIfResultBar.tsx";
import { UNIVERSE, equalWeights, findTicker } from "./config/universe.ts";
import {
  redistributeEurAllocation,
  selectedWeightSum,
  type WeightInputMode,
} from "./lib/allocation-input.ts";
import { fetchUniverseSeries } from "./lib/api.ts";
import {
  computePortfolio,
  type PortfolioResult,
  type PricePoint,
  weightsAreValid,
} from "./lib/portfolio.ts";
import {
  WHAT_IF_COLOR,
  WHAT_IF_SERIES_ID,
  addSnapshot,
  mergeSeries,
  snapshotPortfolioReady,
  removeSnapshot,
  snapshotColor,
  type PortfolioSnapshot,
} from "./lib/snapshots.ts";
import { loadConfig, saveConfig, todayIso } from "./lib/storage.ts";

type MarketBundle = {
  priceSeriesBySymbol: Record<string, PricePoint[]>;
  fxSeries: PricePoint[];
  errors: Record<string, string>;
  fetchedFrom: string;
  fetchedTo: string;
};

type PortfolioInputs = {
  capitalEur: number;
  entryDate: string;
  weights: Record<string, number>;
  selectedSymbols: string[];
};

function earliestNeededDate(dates: string[]): string {
  return [...dates].sort()[0]!;
}

/** Selected symbols only — weights must already sum to ~100%. */
function positionsForSelection(
  selectedSymbols: string[],
  weights: Record<string, number>,
  priced: Set<string>,
): Array<{ symbol: string; weightPercent: number }> | null {
  const chosen = selectedSymbols.filter((s) => priced.has(s));
  if (chosen.length === 0) return null;

  const slice: Record<string, number> = {};
  for (const symbol of chosen) {
    slice[symbol] = weights[symbol] ?? 0;
  }
  if (!weightsAreValid(slice)) return null;

  return chosen.map((symbol) => ({
    symbol,
    weightPercent: slice[symbol]!,
  }));
}

function selectionIsFull(selectedSymbols: string[]): boolean {
  return (
    selectedSymbols.length === UNIVERSE.length &&
    UNIVERSE.every((t) => selectedSymbols.includes(t.symbol))
  );
}

function inputsAreWeightValid(input: PortfolioInputs): boolean {
  if (input.selectedSymbols.length === 0) return false;
  const slice: Record<string, number> = {};
  for (const symbol of input.selectedSymbols) {
    slice[symbol] = input.weights[symbol] ?? 0;
  }
  return weightsAreValid(slice);
}

export default function App() {
  const initial = useMemo(() => loadConfig(), []);
  const [capitalEur, setCapitalEur] = useState(initial.capitalEur);
  const [weights, setWeights] = useState(initial.weights);
  const [entryDate, setEntryDate] = useState(initial.entryDate);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(
    initial.selectedSymbols,
  );
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>(
    initial.snapshots,
  );
  const [snapshotName, setSnapshotName] = useState("");
  const [weightInputMode, setWeightInputMode] =
    useState<WeightInputMode>("eur");
  const [market, setMarket] = useState<MarketBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState(todayIso());

  useEffect(() => {
    saveConfig({
      capitalEur,
      weights,
      entryDate,
      selectedSymbols,
      snapshots,
    });
  }, [capitalEur, weights, entryDate, selectedSymbols, snapshots]);

  const fetchFromKey = useMemo(() => {
    const dates = [entryDate, ...snapshots.map((s) => s.entryDate)];
    return earliestNeededDate(dates);
  }, [entryDate, snapshots]);

  const loadMarket = useCallback(async (from: string) => {
    setLoading(true);
    setError(null);
    const to = todayIso();
    try {
      const data = await fetchUniverseSeries(
        UNIVERSE.map((t) => t.symbol),
        from,
        to,
      );
      setAsOfDate(to);
      setMarket({
        ...data,
        fetchedFrom: from,
        fetchedTo: to,
      });
      if (Object.keys(data.errors).length === UNIVERSE.length) {
        setError("Could not load any ticker history from Yahoo.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load market data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMarket(fetchFromKey);
  }, [loadMarket, fetchFromKey]);

  const buildResult = useCallback(
    (input: PortfolioInputs): PortfolioResult | null => {
      if (!market || input.selectedSymbols.length === 0) return null;
      if (!inputsAreWeightValid(input)) return null;

      const priced = new Set(
        Object.entries(market.priceSeriesBySymbol)
          .filter(([, points]) => points.length > 0)
          .map(([symbol]) => symbol),
      );

      const positions = positionsForSelection(
        input.selectedSymbols,
        input.weights,
        priced,
      );
      if (!positions) return null;

      return computePortfolio({
        capitalEur: input.capitalEur,
        entryDate: input.entryDate,
        asOfDate,
        positions,
        priceSeriesBySymbol: market.priceSeriesBySymbol,
        fxSeries: market.fxSeries,
      });
    },
    [market, asOfDate],
  );

  const liveInput = useMemo<PortfolioInputs>(
    () => ({ capitalEur, entryDate, weights, selectedSymbols }),
    [capitalEur, entryDate, weights, selectedSymbols],
  );

  const activeResult = useMemo(() => {
    try {
      return buildResult(liveInput);
    } catch {
      return null;
    }
  }, [buildResult, liveInput]);

  const snapshotRows = useMemo(() => {
    return snapshots.map((snapshot, index) => {
      let result: PortfolioResult | null = null;
      try {
        result = buildResult(snapshot);
      } catch {
        result = null;
      }
      return {
        snapshot,
        index,
        valueEur: result?.totalValueEur ?? null,
        pnlPercent: result?.totalPnlPercent ?? null,
        result,
      };
    });
  }, [snapshots, buildResult]);

  const compareSeries = useMemo(() => {
    if (snapshots.length === 0) return [];
    return [
      {
        id: WHAT_IF_SERIES_ID,
        label: "What-if",
        color: WHAT_IF_COLOR,
        result: activeResult,
      },
      ...snapshotRows.map((row) => ({
        id: row.snapshot.id,
        label: row.snapshot.name,
        color: snapshotColor(row.index),
        result: row.result,
      })),
    ];
  }, [snapshots.length, activeResult, snapshotRows]);

  const compareData = useMemo(() => {
    if (compareSeries.length === 0) return [];
    return mergeSeries(
      compareSeries
        .filter((s) => s.result)
        .map((s) => ({
          id: s.id,
          points: s.result!.valueSeries.map((p) => ({
            date: p.date,
            valueEur: p.valueEur,
          })),
        })),
    );
  }, [compareSeries]);

  const isFullSelection = selectionIsFull(selectedSymbols);
  const sum = selectedWeightSum(selectedSymbols, weights);
  const valid = inputsAreWeightValid(liveInput);

  const portfolioReady = snapshotPortfolioReady({
    capitalEur,
    entryDate,
    selectedSymbols,
    weightsValid: valid,
  });

  const focusLabel = useMemo(() => {
    if (isFullSelection || selectedSymbols.length === 0) return null;
    if (selectedSymbols.length === 1) {
      const t = findTicker(selectedSymbols[0]!);
      return t ? `${t.symbol} · ${t.kind}` : selectedSymbols[0]!;
    }
    return `${selectedSymbols.length} tickers selected`;
  }, [isFullSelection, selectedSymbols]);

  function handleSelectedChange(symbols: string[]) {
    setSelectedSymbols(symbols);
    if (symbols.length === 0) return;
    // Keep selection weights at 100% when the set changes.
    setWeights((prev) => ({ ...prev, ...equalWeights(symbols) }));
  }

  function handleAllocationCommit(
    symbol: string,
    value: number,
    mode: WeightInputMode = weightInputMode,
  ) {
    if (mode === "eur") {
      setWeights((prev) =>
        redistributeEurAllocation(
          prev,
          selectedSymbols,
          symbol,
          value,
          capitalEur,
        ),
      );
      return;
    }
    setWeights((prev) => ({
      ...prev,
      [symbol]: Number.isFinite(value) ? value : 0,
    }));
  }

  function handleEqualSplit() {
    const symbols =
      selectedSymbols.length > 0
        ? selectedSymbols
        : UNIVERSE.map((t) => t.symbol);
    setWeights((prev) => ({ ...prev, ...equalWeights(symbols) }));
  }

  function handleSaveSnapshot() {
    const next = addSnapshot(snapshots, {
      name: snapshotName,
      capitalEur,
      entryDate,
      weights,
      selectedSymbols,
    });
    if (!next) return;
    setSnapshots(next);
    setSnapshotName("");
  }

  function handleLoadSnapshot(id: string) {
    const snap = snapshots.find((s) => s.id === id);
    if (!snap) return;
    setCapitalEur(snap.capitalEur);
    setEntryDate(snap.entryDate);
    setWeights({ ...snap.weights });
    setSelectedSymbols([...snap.selectedSymbols]);
    setSnapshotName(snap.name);
  }

  return (
    <div className="mx-auto grid max-w-[1180px] gap-5 px-5 py-6 pb-28 max-sm:px-3.5 max-sm:py-4 max-sm:pb-32">
      <TopBar
        capitalEur={capitalEur}
        entryDate={entryDate}
        loading={loading}
        onCapitalChange={(value) => {
          if (Number.isFinite(value) && value > 0) setCapitalEur(value);
        }}
        onEntryDateChange={setEntryDate}
        onRefresh={() => void loadMarket(fetchFromKey)}
      />

      <TickerFocus
        universe={UNIVERSE}
        selectedSymbols={selectedSymbols}
        weights={weights}
        capitalEur={capitalEur}
        weightInputMode={weightInputMode}
        onWeightInputModeChange={setWeightInputMode}
        onSelectedChange={handleSelectedChange}
        onAllocationCommit={handleAllocationCommit}
        onEqualSplit={handleEqualSplit}
      />

      {selectedSymbols.length === 0 ? (
        <div className="rounded-[10px] border border-warn/50 bg-warn/12 px-4 py-3">
          Select at least one ticker to compute the what-if portfolio.
        </div>
      ) : !valid ? (
        <div className="rounded-[10px] border border-warn/50 bg-warn/12 px-4 py-3">
          {weightInputMode === "percent"
            ? `Selected weights must sum to 100% (currently ${sum.toFixed(2)}%). Fix the % values — they are not auto-balanced.`
            : `Selected weights must sum to 100% before P&L can run (currently ${sum.toFixed(2)}%). Edit a € amount to rebalance, or switch to % and fix the split.`}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[10px] border border-neg/50 bg-neg/12 px-4 py-3">
          {error}
        </div>
      ) : null}

      <SnapshotsPanel
        name={snapshotName}
        onNameChange={setSnapshotName}
        portfolioReady={portfolioReady}
        onSave={handleSaveSnapshot}
        rows={snapshotRows}
        onRemove={(id) => setSnapshots((prev) => removeSnapshot(prev, id))}
        onLoad={handleLoadSnapshot}
      />

      <PortfolioSummary
        result={activeResult}
        compareSeries={compareSeries}
        compareData={compareData}
      />

      <PositionsTable
        universe={UNIVERSE}
        weights={weights}
        positions={activeResult?.positions ?? null}
        weightSum={sum}
        weightsValid={valid}
        capitalEur={capitalEur}
        weightInputMode={weightInputMode}
        onWeightInputModeChange={setWeightInputMode}
        errors={market?.errors ?? {}}
        selectedSymbols={selectedSymbols}
        onSelectedChange={handleSelectedChange}
        onAllocationCommit={handleAllocationCommit}
        onEqualSplit={handleEqualSplit}
      />

      <SiteFooter />

      {activeResult ? (
        <WhatIfResultBar result={activeResult} focusLabel={focusLabel} />
      ) : null}
    </div>
  );
}
