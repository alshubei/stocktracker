export type InstrumentKind = "stock" | "etf";

export type Ticker = {
  symbol: string;
  name: string;
  kind: InstrumentKind;
};

export type PresetScenario = {
  id: string;
  label: string;
  /** YYYY-MM-DD; use "today" for dynamic latest market day */
  entryDate: string;
};

export const UNIVERSE: Ticker[] = [
  { symbol: "NVDA", name: "NVIDIA", kind: "stock" },
  {
    symbol: "DTCR",
    name: "Global X Data Center & Digital Infrastructure ETF",
    kind: "etf",
  },
  { symbol: "SPUS", name: "SP Funds S&P 500 Sharia ETF", kind: "etf" },
  {
    symbol: "CIBR",
    name: "First Trust NASDAQ Cybersecurity ETF",
    kind: "etf",
  },
  { symbol: "AVGO", name: "Broadcom", kind: "stock" },
  { symbol: "NOW", name: "ServiceNow", kind: "stock" },
  { symbol: "SNDK", name: "SanDisk", kind: "stock" },
  // Nasdaq listing; Yahoo history starts mid-2026 — earlier entries use first available close.
  { symbol: "SKHY", name: "SK Hynix", kind: "stock" },
];

export const DEFAULT_CAPITAL_EUR = 10_000;

/** Equal weights summing to 100. */
export function equalWeights(
  symbols: string[] = UNIVERSE.map((t) => t.symbol),
): Record<string, number> {
  const n = symbols.length;
  const base = Math.floor((100 / n) * 100) / 100;
  const weights: Record<string, number> = {};
  let assigned = 0;
  symbols.forEach((symbol, index) => {
    if (index === n - 1) {
      weights[symbol] = Math.round((100 - assigned) * 100) / 100;
    } else {
      weights[symbol] = base;
      assigned += base;
    }
  });
  return weights;
}

/**
 * Named entry scenarios for side-by-side comparison.
 * Dates approximate recent US tariff / collection-driven drawdowns;
 * edit freely in this file.
 */
export const PRESET_SCENARIOS: PresetScenario[] = [
  { id: "pre-crash", label: "Pre-crash", entryDate: "2025-02-14" },
  { id: "dip", label: "Dip", entryDate: "2025-04-07" },
  { id: "rebound", label: "Rebound", entryDate: "2025-05-01" },
  { id: "today", label: "Today", entryDate: "today" },
];

export function resolvePresetDate(
  entryDate: string,
  todayIso: string = new Date().toISOString().slice(0, 10),
): string {
  return entryDate === "today" ? todayIso : entryDate;
}

export function findTicker(symbol: string): Ticker | undefined {
  return UNIVERSE.find((t) => t.symbol === symbol);
}

export function matchesTickerQuery(ticker: Ticker, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    ticker.symbol.toLowerCase().includes(q) ||
    ticker.name.toLowerCase().includes(q) ||
    ticker.kind.includes(q)
  );
}
