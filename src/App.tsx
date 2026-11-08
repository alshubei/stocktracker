import { useCallback, useEffect, useMemo, useState } from "react";
import { PortfolioSummary } from "./components/PortfolioSummary.tsx";
import {
  PresetStrip,
  type PresetCardModel,
} from "./components/PresetStrip.tsx";
import { PositionsTable } from "./components/PositionsTable.tsx";
import { TopBar } from "./components/TopBar.tsx";
import {
  PRESET_SCENARIOS,
  UNIVERSE,
  equalWeights,
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

export default function App() {
  const initial = useMemo(() => loadConfig(), []);
  const [capitalEur, setCapitalEur] = useState(initial.capitalEur);
  const [weights, setWeights] = useState(initial.weights);
  const [entryDate, setEntryDate] = useState(initial.entryDate);
  const [market, setMarket] = useState<MarketBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState(todayIso());

  useEffect(() => {
    saveConfig({ capitalEur, weights, entryDate });
  }, [capitalEur, weights, entryDate]);

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

  const buildResult = useCallback(
    (forEntryDate: string): PortfolioResult | null => {
      if (!market || !weightsAreValid(weights)) return null;
      const available = UNIVERSE.filter(
        (t) => market.priceSeriesBySymbol[t.symbol]?.length,
      );
      if (available.length === 0) return null;

      const positions = available.map((t) => ({
        symbol: t.symbol,
        weightPercent: weights[t.symbol] ?? 0,
      }));
      if (positions.every((p) => p.weightPercent <= 0)) return null;

      // Missing symbols keep their weight as EUR cash (see portfolio engine).
      return computePortfolio({
        capitalEur,
        entryDate: forEntryDate,
        asOfDate,
        positions,
        priceSeriesBySymbol: market.priceSeriesBySymbol,
        fxSeries: market.fxSeries,
      });
    },
    [market, weights, capitalEur, asOfDate],
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
  const valid = weightsAreValid(weights);

  return (
    <div className="app">
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

      {!valid ? (
        <div className="banner warn">
          Weights must sum to 100% (currently {sum.toFixed(2)}%) before P&amp;L
          is computed.
        </div>
      ) : null}

      {error ? <div className="banner error">{error}</div> : null}

      <PresetStrip
        presets={presets}
        activeEntryDate={entryDate}
        onSelect={setEntryDate}
      />

      <PortfolioSummary result={activeResult} />

      <PositionsTable
        universe={UNIVERSE}
        weights={weights}
        positions={activeResult?.positions ?? null}
        weightSum={sum}
        weightsValid={valid}
        errors={market?.errors ?? {}}
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
