export type PricePoint = {
  date: string;
  close: number;
};

export type PositionInput = {
  symbol: string;
  weightPercent: number;
};

export type PositionResult = {
  symbol: string;
  weightPercent: number;
  eurAllocated: number;
  usdAllocated: number;
  entryDateUsed: string;
  entryPriceUsd: number;
  shares: number;
  latestDateUsed: string;
  latestPriceUsd: number;
  valueUsd: number;
  valueEur: number;
  pnlEur: number;
  pnlPercent: number;
};

export type ValueSeriesTicker = {
  symbol: string;
  entryUsd: number;
  hoverUsd: number;
  latestUsd: number;
};

export type ValueSeriesPoint = {
  date: string;
  valueEur: number;
  tickers: ValueSeriesTicker[];
};

export type PortfolioResult = {
  entryDate: string;
  asOfDate: string;
  capitalEur: number;
  entryFx: number;
  latestFx: number;
  totalValueEur: number;
  totalValueUsd: number;
  totalPnlEur: number;
  totalPnlPercent: number;
  positions: PositionResult[];
  /** Daily portfolio EUR value from entry → as-of (inclusive when data exists). */
  valueSeries: ValueSeriesPoint[];
};

export function weightSum(weights: Record<string, number>): number {
  return Object.values(weights).reduce((sum, w) => sum + w, 0);
}

export function weightsAreValid(
  weights: Record<string, number>,
  tolerance = 0.05,
): boolean {
  return Math.abs(weightSum(weights) - 100) <= tolerance;
}

export function closeOnOrBefore(
  series: PricePoint[],
  date: string,
): PricePoint | null {
  let best: PricePoint | null = null;
  for (const point of series) {
    if (point.date <= date) best = point;
    else break;
  }
  return best;
}

/** Close on/before date, else first available close after (new listings). */
export function closeForEntry(
  series: PricePoint[],
  date: string,
): PricePoint | null {
  return closeOnOrBefore(series, date) ?? series[0] ?? null;
}

function requireSorted(series: PricePoint[]): PricePoint[] {
  return [...series].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Buy fractional shares on entry using EUR capital × weight, converted at entry FX.
 * Mark to market with latest prices and latest FX.
 */
export function computePortfolio(args: {
  capitalEur: number;
  entryDate: string;
  asOfDate: string;
  positions: PositionInput[];
  priceSeriesBySymbol: Record<string, PricePoint[]>;
  fxSeries: PricePoint[];
}): PortfolioResult {
  const {
    capitalEur,
    entryDate,
    asOfDate,
    positions,
    priceSeriesBySymbol,
    fxSeries,
  } = args;

  const fxSorted = requireSorted(fxSeries);
  const entryFxPoint = closeOnOrBefore(fxSorted, entryDate);
  const latestFxPoint = closeOnOrBefore(fxSorted, asOfDate);

  if (!entryFxPoint || !latestFxPoint) {
    throw new Error("Missing EURUSD rate for entry or as-of date");
  }

  const entryFx = entryFxPoint.close;
  const latestFx = latestFxPoint.close;

  const positionResults: PositionResult[] = [];
  const holdings: Array<{
    symbol: string;
    shares: number;
    series: PricePoint[];
    entryUsd: number;
    latestUsd: number;
  }> = [];

  for (const position of positions) {
    const series = requireSorted(priceSeriesBySymbol[position.symbol] ?? []);
    const entryPrice = closeForEntry(series, entryDate);
    const latestPrice = closeOnOrBefore(series, asOfDate);

    if (!entryPrice || !latestPrice) {
      throw new Error(`Missing price history for ${position.symbol}`);
    }

    const eurAllocated = (capitalEur * position.weightPercent) / 100;
    const usdAllocated = eurAllocated * entryFx;
    const shares = entryPrice.close > 0 ? usdAllocated / entryPrice.close : 0;
    const valueUsd = shares * latestPrice.close;
    const valueEur = latestFx > 0 ? valueUsd / latestFx : 0;
    const pnlEur = valueEur - eurAllocated;
    const pnlPercent = eurAllocated > 0 ? (pnlEur / eurAllocated) * 100 : 0;

    positionResults.push({
      symbol: position.symbol,
      weightPercent: position.weightPercent,
      eurAllocated,
      usdAllocated,
      entryDateUsed: entryPrice.date,
      entryPriceUsd: entryPrice.close,
      shares,
      latestDateUsed: latestPrice.date,
      latestPriceUsd: latestPrice.close,
      valueUsd,
      valueEur,
      pnlEur,
      pnlPercent,
    });

    holdings.push({
      symbol: position.symbol,
      shares,
      series,
      entryUsd: entryPrice.close,
      latestUsd: latestPrice.close,
    });
  }

  const investedWeight = positionResults.reduce(
    (s, p) => s + p.weightPercent,
    0,
  );
  const cashEur = capitalEur * Math.max(0, 100 - investedWeight) / 100;
  const cashUsd = cashEur * latestFx;

  const positionsValueEur = positionResults.reduce((s, p) => s + p.valueEur, 0);
  const positionsValueUsd = positionResults.reduce((s, p) => s + p.valueUsd, 0);
  const totalValueEur = positionsValueEur + cashEur;
  const totalValueUsd = positionsValueUsd + cashUsd;
  const totalPnlEur = totalValueEur - capitalEur;
  const totalPnlPercent =
    capitalEur > 0 ? (totalPnlEur / capitalEur) * 100 : 0;

  const dateSet = new Set<string>();
  for (const { series } of holdings) {
    for (const point of series) {
      if (point.date >= entryDate && point.date <= asOfDate) {
        dateSet.add(point.date);
      }
    }
  }
  for (const point of fxSorted) {
    if (point.date >= entryDate && point.date <= asOfDate) {
      dateSet.add(point.date);
    }
  }

  const dates = [...dateSet].sort();
  const valueSeries: ValueSeriesPoint[] = [];

  for (const date of dates) {
    const fx = closeOnOrBefore(fxSorted, date);
    if (!fx || fx.close <= 0) continue;

    let usd = 0;
    let ok = true;
    const tickers: ValueSeriesTicker[] = [];
    for (const holding of holdings) {
      const px = closeForEntry(holding.series, date);
      if (!px) {
        ok = false;
        break;
      }
      // Before a name's first trade, treat its sleeve as EUR cash.
      if (px.date > date) {
        const sleeve = positionResults.find((p) => p.symbol === holding.symbol);
        usd += (sleeve?.eurAllocated ?? 0) * fx.close;
        tickers.push({
          symbol: holding.symbol,
          entryUsd: holding.entryUsd,
          hoverUsd: holding.entryUsd,
          latestUsd: holding.latestUsd,
        });
        continue;
      }
      usd += holding.shares * px.close;
      tickers.push({
        symbol: holding.symbol,
        entryUsd: holding.entryUsd,
        hoverUsd: px.close,
        latestUsd: holding.latestUsd,
      });
    }
    if (!ok) continue;
    valueSeries.push({ date, valueEur: usd / fx.close + cashEur, tickers });
  }

  return {
    entryDate,
    asOfDate,
    capitalEur,
    entryFx,
    latestFx,
    totalValueEur,
    totalValueUsd,
    totalPnlEur,
    totalPnlPercent,
    positions: positionResults,
    valueSeries,
  };
}
