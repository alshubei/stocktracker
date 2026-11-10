import {
  DEFAULT_CAPITAL_EUR,
  UNIVERSE,
  equalWeights,
} from "../config/universe.ts";

const STORAGE_KEY = "stocktracker:v1";
const STORAGE_VERSION = 2;

export type StoredConfig = {
  capitalEur: number;
  weights: Record<string, number>;
  entryDate: string;
  /** Selected symbols for concentration; empty means none selected. */
  selectedSymbols: string[];
  /** Bumps when defaults that should migrate change. */
  version?: number;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Calendar days before `from` (UTC date), formatted YYYY-MM-DD. */
export function daysAgoIso(
  days: number,
  from: Date = new Date(),
): string {
  const d = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function defaultEntryDate(from: Date = new Date()): string {
  return daysAgoIso(5, from);
}

export function allSymbols(): string[] {
  return UNIVERSE.map((t) => t.symbol);
}

export function defaultConfig(): StoredConfig {
  return {
    capitalEur: DEFAULT_CAPITAL_EUR,
    weights: equalWeights(),
    entryDate: defaultEntryDate(),
    selectedSymbols: allSymbols(),
    version: STORAGE_VERSION,
  };
}

function sanitizeSelected(symbols: unknown): string[] {
  const allowed = new Set(allSymbols());
  if (!Array.isArray(symbols)) return allSymbols();
  const cleaned = symbols.filter(
    (s): s is string => typeof s === "string" && allowed.has(s),
  );
  return [...new Set(cleaned)];
}

export function loadConfig(): StoredConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultConfig();
    const parsed = JSON.parse(raw) as Partial<StoredConfig> & {
      focusSymbol?: string | null;
    };
    const defaults = defaultConfig();
    const weights = { ...defaults.weights, ...(parsed.weights ?? {}) };
    for (const ticker of UNIVERSE) {
      if (weights[ticker.symbol] == null) {
        weights[ticker.symbol] = defaults.weights[ticker.symbol]!;
      }
    }

    let selectedSymbols = sanitizeSelected(parsed.selectedSymbols);
    // Migrate legacy single-focus field.
    if (
      (!parsed.selectedSymbols || !Array.isArray(parsed.selectedSymbols)) &&
      typeof parsed.focusSymbol === "string" &&
      UNIVERSE.some((t) => t.symbol === parsed.focusSymbol)
    ) {
      selectedSymbols = [parsed.focusSymbol];
    }

    const storedVersion =
      typeof parsed.version === "number" ? parsed.version : 0;
    const shouldRefreshEntryDate = storedVersion < STORAGE_VERSION;

    const entryDate = shouldRefreshEntryDate
      ? defaults.entryDate
      : typeof parsed.entryDate === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(parsed.entryDate)
        ? parsed.entryDate
        : defaults.entryDate;

    return {
      capitalEur:
        typeof parsed.capitalEur === "number" && parsed.capitalEur > 0
          ? parsed.capitalEur
          : defaults.capitalEur,
      weights,
      entryDate,
      selectedSymbols,
      version: STORAGE_VERSION,
    };
  } catch {
    return defaultConfig();
  }
}

export function saveConfig(config: StoredConfig): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...config, version: STORAGE_VERSION }),
  );
}

export { todayIso };
