import { useCallback, useEffect, useMemo, useState } from "react";
import { PortfolioSummary } from "./components/PortfolioSummary.tsx";
import {
  PresetStrip,
  type PresetCardModel,
} from "./components/PresetStrip.tsx";
import { PositionsTable } from "./components/PositionsTable.tsx";
import { TickerFocus } from "./components/TickerFocus.tsx";
import { TopBar } from "./components/TopBar.tsx";
import {
  PRESET_SCENARIOS,
  UNIVERSE,
  equalWeights,
  findTicker,
  resolvePresetDate,
} from "./config/universe.ts";
import { fetchUniverseSeries } from "./lib/api.ts";
import {
  computePortfolio,
  type PortfolioResult,
  type PricePoint,
  weightSum,
  weightsAreValid,
} from "./lib/portfolio.ts";
import { loadConfig, saveConfig, todayIso } from "./lib/storage.ts";

type MarketBundle = {
  priceSeriesBySymbol: Record<string, PricePoint[]>;
  fxSeries: PricePoint[];
  errors: Record<string, string>;
  fetchedFrom: string;
  fetchedTo: string;
};

function earliestNeededDate(activeEntry: string): string {
  const presetDates = PRESET_SCENARIOS.map((p) =>
    resolvePresetDate(p.entryDate),
  );
  return [activeEntry, ...presetDates].sort()[0]!;
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

export default function App() {
  const initial = useMemo(() => loadConfig(), []);
  const [capitalEur, setCapitalEur] = useState(initial.capitalEur);
  const [weights, setWeights] = useState(initial.weights);
  const [entryDate, setEntryDate] = useState(initial.entryDate);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(
    initial.selectedSymbols,
  );
  const [market, setMarket] = useState<MarketBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState(todayIso());

  useEffect(() => {
    saveConfig({ capitalEur, weights, entryDate, selectedSymbols });
  }, [capitalEur, weights, entryDate, selectedSymbols]);

  const loadMarket = useCallback(async (activeEntry: string) => {
    setLoading(true);
    setError(null);
    const to = todayIso();
    const from = earliestNeededDate(activeEntry);
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
    void loadMarket(entryDate);
  }, [loadMarket, entryDate]);

  const isFullSelection =
    selectedSymbols.length === UNIVERSE.length &&
    UNIVERSE.every((t) => selectedSymbols.includes(t.symbol));

  const buildResult = useCallback(
    (forEntryDate: string): PortfolioResult | null => {
      if (!market || selectedSymbols.length === 0) return null;

      const priced = new Set(
        Object.entries(market.priceSeriesBySymbol)
          .filter(([, points]) => points.length > 0)
          .map(([symbol]) => symbol),
      );

      if (isFullSelection) {
        if (!weightsAreValid(weights)) return null;
        const positions = positionsForSelection(
          selectedSymbols,
          weights,
          priced,
        );
        if (!positions) return null;
        return computePortfolio({
          capitalEur,
          entryDate: forEntryDate,
          asOfDate,
          positions,
          priceSeriesBySymbol: market.priceSeriesBySymbol,
          fxSeries: market.fxSeries,
        });
      }

      const positions = positionsForSelection(
        selectedSymbols,
        weights,
        priced,
      );
      if (!positions) return null;

      return computePortfolio({
        capitalEur,
        entryDate: forEntryDate,
        asOfDate,
        positions,
        priceSeriesBySymbol: market.priceSeriesBySymbol,
        fxSeries: market.fxSeries,
      });
    },
    [market, weights, capitalEur, asOfDate, selectedSymbols, isFullSelection],
  );

  const activeResult = useMemo(() => {
    try {
      return buildResult(entryDate);
    } catch {
      return null;
    }
  }, [buildResult, entryDate]);

  const presets: PresetCardModel[] = useMemo(() => {
    return PRESET_SCENARIOS.map((preset) => {
      const date = resolvePresetDate(preset.entryDate, asOfDate);
      try {
        return {
          id: preset.id,
          label: preset.label,
          entryDate: date,
          result: buildResult(date),
          error: null,
        };
      } catch (err) {
        return {
          id: preset.id,
          label: preset.label,
          entryDate: date,
          result: null,
          error: err instanceof Error ? err.message : "Unavailable",
        };
      }
    });
  }, [buildResult, asOfDate]);

  const sum = weightSum(weights);
  const needsFullWeights = isFullSelection || selectedSymbols.length === 0;
  const valid =
    selectedSymbols.length > 0 &&
    (!needsFullWeights || weightsAreValid(weights));

  const focusLabel = useMemo(() => {
    if (isFullSelection || selectedSymbols.length === 0) return null;
    if (selectedSymbols.length === 1) {
      const t = findTicker(selectedSymbols[0]!);
      return t ? `${t.symbol} · ${t.kind}` : selectedSymbols[0]!;
    }
    return `${selectedSymbols.length} tickers selected`;
  }, [isFullSelection, selectedSymbols]);

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
        onRefresh={() => void loadMarket(entryDate)}
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

      <PresetStrip
        presets={presets}
        activeEntryDate={entryDate}
        onSelect={setEntryDate}
      />

      <PortfolioSummary result={activeResult} focusLabel={focusLabel} />

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
    </div>
  );
}
