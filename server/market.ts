import {
  closeOnOrBefore,
  fetchYahooDailyCloses,
  type DailyClose,
} from "./yahoo";

export const FX_SYMBOL = "EURUSD=X";

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function buildPoints(
  series: DailyClose[],
  from: string,
  to: string,
): DailyClose[] {
  const filtered = series.filter((p) => p.date >= from && p.date <= to);
  const entry = closeOnOrBefore(series, from);
  if (entry && (filtered.length === 0 || filtered[0]!.date !== entry.date)) {
    return [entry, ...filtered.filter((p) => p.date > entry.date)];
  }
  if (filtered.length > 0) return filtered;
  return entry ? [entry] : [];
}

export async function historyPayload(
  symbol: string,
  from: string,
  to: string,
): Promise<{ symbol: string; from: string; to: string; points: DailyClose[] }> {
  const series = await fetchYahooDailyCloses(symbol, from, to);
  return {
    symbol,
    from,
    to,
    points: buildPoints(series, from, to),
  };
}
