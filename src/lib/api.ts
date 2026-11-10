import type { PricePoint } from "./portfolio.ts";

type SeriesResponse = {
  symbol: string;
  from: string;
  to: string;
  points: PricePoint[];
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? `Request failed: ${response.status}`);
  }
  return body;
}

export async function fetchHistory(
  symbol: string,
  from: string,
  to: string,
): Promise<PricePoint[]> {
  const data = await getJson<SeriesResponse>(
    `/api/history?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}`,
  );
  return data.points;
}

export async function fetchEurUsd(
  from: string,
  to: string,
): Promise<PricePoint[]> {
  const data = await getJson<SeriesResponse>(
    `/api/fx/eurusd?from=${from}&to=${to}`,
  );
  return data.points;
}

export async function fetchUniverseSeries(
  symbols: string[],
  from: string,
  to: string,
): Promise<{
  priceSeriesBySymbol: Record<string, PricePoint[]>;
  fxSeries: PricePoint[];
  errors: Record<string, string>;
}> {
  const errors: Record<string, string> = {};
  const priceSeriesBySymbol: Record<string, PricePoint[]> = {};

  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const points = await fetchHistory(symbol, from, to);
        return { symbol, points, error: null as string | null };
      } catch (error) {
        return {
          symbol,
          points: [] as PricePoint[],
          error: error instanceof Error ? error.message : "Failed",
        };
      }
    }),
  );

  for (const result of results) {
    if (result.error) errors[result.symbol] = result.error;
    else priceSeriesBySymbol[result.symbol] = result.points;
  }

  const fxSeries = await fetchEurUsd(from, to);
  return { priceSeriesBySymbol, fxSeries, errors };
}
