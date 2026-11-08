export type DailyClose = {
  date: string; // YYYY-MM-DD
  close: number;
};

type CacheEntry = {
  expiresAt: number;
  data: DailyClose[];
};

const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

function toUnixSeconds(isoDate: string): number {
  return Math.floor(new Date(`${isoDate}T00:00:00Z`).getTime() / 1000);
}

function formatDateUTC(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

function cacheKey(symbol: string, from: string, to: string): string {
  return `${symbol}|${from}|${to}`;
}

export function getCachedCloses(
  symbol: string,
  from: string,
  to: string,
): DailyClose[] | null {
  const entry = cache.get(cacheKey(symbol, from, to));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(cacheKey(symbol, from, to));
    return null;
  }
  return entry.data;
}

export function setCachedCloses(
  symbol: string,
  from: string,
  to: string,
  data: DailyClose[],
): void {
  cache.set(cacheKey(symbol, from, to), {
    expiresAt: Date.now() + CACHE_TTL_MS,
    data,
  });
}

type YahooChartJson = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{ close?: Array<number | null> }>;
        adjclose?: Array<{ adjclose?: Array<number | null> }>;
      };
    }>;
    error?: { description?: string } | null;
  };
};

async function requestYahooChart(url: URL): Promise<YahooChartJson> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Stocktracker/1.0)",
      Accept: "application/json",
    },
  });

  const json = (await response.json()) as YahooChartJson;
  if (!response.ok) {
    const description = json.chart?.error?.description;
    throw new Error(
      description ??
        `Yahoo request failed: ${response.status} ${response.statusText}`,
    );
  }
  return json;
}

function parseDailyCloses(json: YahooChartJson, symbol: string): DailyClose[] {
  const result = json.chart?.result?.[0];
  if (!result?.timestamp?.length) {
    const description = json.chart?.error?.description ?? "no chart data";
    throw new Error(`Yahoo returned no data for ${symbol}: ${description}`);
  }

  const closes =
    result.indicators?.adjclose?.[0]?.adjclose ??
    result.indicators?.quote?.[0]?.close ??
    [];

  const series: DailyClose[] = [];
  for (let i = 0; i < result.timestamp.length; i += 1) {
    const close = closes[i];
    if (close == null || !Number.isFinite(close)) continue;
    series.push({
      date: formatDateUTC(result.timestamp[i]!),
      close,
    });
  }

  if (series.length === 0) {
    throw new Error(`Yahoo returned empty closes for ${symbol}`);
  }
  return series;
}

export async function fetchYahooDailyCloses(
  symbol: string,
  from: string,
  to: string,
): Promise<DailyClose[]> {
  const cached = getCachedCloses(symbol, from, to);
  if (cached) return cached;

  // Pad start by a few days so previous-close fallback works near weekends
  const period1 = toUnixSeconds(from) - 7 * 24 * 60 * 60;
  const period2 = toUnixSeconds(to) + 24 * 60 * 60;

  const datedUrl = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
  );
  datedUrl.searchParams.set("period1", String(period1));
  datedUrl.searchParams.set("period2", String(period2));
  datedUrl.searchParams.set("interval", "1d");
  datedUrl.searchParams.set("events", "history");
  datedUrl.searchParams.set("includeAdjustedClose", "true");

  let series: DailyClose[];
  try {
    series = parseDailyCloses(await requestYahooChart(datedUrl), symbol);
  } catch (error) {
    // Newly listed symbols (e.g. SKHY) reject ranges before first trade date.
    const maxUrl = new URL(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
    );
    maxUrl.searchParams.set("range", "max");
    maxUrl.searchParams.set("interval", "1d");
    maxUrl.searchParams.set("events", "history");
    maxUrl.searchParams.set("includeAdjustedClose", "true");
    try {
      series = parseDailyCloses(await requestYahooChart(maxUrl), symbol);
    } catch {
      throw error instanceof Error
        ? error
        : new Error(`Yahoo request failed for ${symbol}`);
    }
  }

  setCachedCloses(symbol, from, to, series);
  return series;
}

/** Closest close on or before the requested date. */
export function closeOnOrBefore(
  series: DailyClose[],
  date: string,
): DailyClose | null {
  let best: DailyClose | null = null;
  for (const point of series) {
    if (point.date <= date) best = point;
    else break;
  }
  return best;
}
