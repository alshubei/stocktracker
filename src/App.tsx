import { useCallback, useEffect, useMemo, useState } from "react";
import { PortfolioSummary } from "./components/PortfolioSummary.tsx";
import { PositionsTable } from "./components/PositionsTable.tsx";
import { SnapshotsPanel } from "./components/SnapshotsPanel.tsx";
import { TickerFocus } from "./components/TickerFocus.tsx";
import { SiteFooter } from "./components/SiteFooter.tsx";
import { TopBar } from "./components/TopBar.tsx";
import { UNIVERSE, equalWeights, findTicker } from "./config/universe.ts";
import { fetchUniverseSeries } from "./lib/api.ts";
import {
  computePortfolio,
  type PortfolioResult,
  type PricePoint,
  weightSum,
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

/** Keep relative weights among selected symbols; rescale to 100%. */
function positionsForSelection(
  selectedSymbols: string[],
  weights: Record<string, number>,
  priced: Set<string>,
): Array<{ symbol: string; weightPercent: number }> | null {
  const chosen = selectedSymbols.filter((s) => priced.has(s));
  if (chosen.length === 0) return null;

  const raw = chosen.map((symbol) => ({
    symbol,
    weightPercent: weights[symbol] ?? 0,
  }));
  const rawSum = raw.reduce((s, p) => s + p.weightPercent, 0);

  if (rawSum <= 0) {
    const equal = 100 / raw.length;
    return raw.map((p) => ({ symbol: p.symbol, weightPercent: equal }));
  }

  return raw.map((p) => ({
    symbol: p.symbol,
    weightPercent: (p.weightPercent / rawSum) * 100,
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
  if (selectionIsFull(input.selectedSymbols)) {
    return weightsAreValid(input.weights);
  }
  return true;
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

  const sum = weightSum(weights);
  const isFullSelection = selectionIsFull(selectedSymbols);
  const needsFullWeights = isFullSelection || selectedSymbols.length === 0;
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
    <div className="mx-auto grid max-w-[1180px] gap-5 px-5 py-6 pb-12 max-sm:px-3.5 max-sm:py-4">
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
        onSelectedChange={setSelectedSymbols}
      />

      {selectedSymbols.length === 0 ? (
        <div className="rounded-[10px] border border-warn/50 bg-warn/12 px-4 py-3">
          Select at least one ticker to compute the what-if portfolio.
        </div>
      ) : needsFullWeights && !weightsAreValid(weights) ? (
        <div className="rounded-[10px] border border-warn/50 bg-warn/12 px-4 py-3">
          Weights must sum to 100% (currently {sum.toFixed(2)}%) before P&amp;L
          is computed for the full portfolio.
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
        focusLabel={focusLabel}
        compareSeries={compareSeries}
        compareData={compareData}
      />

      <PositionsTable
        universe={UNIVERSE}
        weights={weights}
        positions={activeResult?.positions ?? null}
        weightSum={sum}
        weightsValid={valid}
        errors={market?.errors ?? {}}
        selectedSymbols={selectedSymbols}
        onSelectedChange={setSelectedSymbols}
        onWeightChange={(symbol, weight) => {
          setWeights((prev) => ({
            ...prev,
            [symbol]: Number.isFinite(weight) ? weight : 0,
          }));
        }}
        onEqualSplit={() => setWeights(equalWeights())}
      />

      <SiteFooter />
    </div>
  );
}
