import type { PricePoint } from "./portfolio.ts";

type SeriesResponse = {
  symbol: string;
  from: string;
  to: string;
  points: PricePoint[];
};

/** Parse JSON when possible; missing/HTML API pages return null (offline-friendly). */
async function getJsonOrNull<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    const text = await response.text();
    if (!response.ok) return null;
    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

export async function fetchHistory(
  symbol: string,
  from: string,
  to: string,
): Promise<PricePoint[]> {
  const data = await getJsonOrNull<SeriesResponse>(
    `/api/history?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}`,
  );
  return data?.points ?? [];
}

export async function fetchEurUsd(
  from: string,
  to: string,
): Promise<PricePoint[]> {
  const data = await getJsonOrNull<SeriesResponse>(
    `/api/fx/eurusd?from=${from}&to=${to}`,
  );
  return data?.points ?? [];
}

export async function fetchUniverseSeries(
  symbols: string[],
  from: string,
  to: string,
): Promise<{
  priceSeriesBySymbol: Record<string, PricePoint[]>;
  fxSeries: PricePoint[];
  errors: Record<string, string>;
  /** True when the market proxy answered with usable data for at least one series. */
  online: boolean;
}> {
  const errors: Record<string, string> = {};
  const priceSeriesBySymbol: Record<string, PricePoint[]> = {};

  const results = await Promise.all(
    symbols.map(async (symbol) => {
      const points = await fetchHistory(symbol, from, to);
      return { symbol, points };
    }),
  );

  for (const result of results) {
    if (result.points.length === 0) {
      errors[result.symbol] = "Unavailable offline";
    } else {
      priceSeriesBySymbol[result.symbol] = result.points;
    }
  }

  const fxSeries = await fetchEurUsd(from, to);
  const online =
    Object.keys(priceSeriesBySymbol).length > 0 || fxSeries.length > 0;

  return { priceSeriesBySymbol, fxSeries, errors, online };
}
