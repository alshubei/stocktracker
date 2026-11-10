import {
  DEFAULT_CAPITAL_EUR,
  UNIVERSE,
  equalWeights,
} from "../config/universe.ts";
import {
  MAX_SNAPSHOTS,
  type PortfolioSnapshot,
} from "./snapshots.ts";

const STORAGE_KEY = "stocktracker:v1";
const STORAGE_VERSION = 3;

export type StoredConfig = {
  capitalEur: number;
  weights: Record<string, number>;
  entryDate: string;
  /** Selected symbols for concentration; empty means none selected. */
  selectedSymbols: string[];
  /** Frozen portfolios for chart comparison (local until accounts exist). */
  snapshots: PortfolioSnapshot[];
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
    snapshots: [],
    version: STORAGE_VERSION,
  };
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function sanitizeSnapshots(raw: unknown): PortfolioSnapshot[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set(allSymbols());
  const out: PortfolioSnapshot[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<PortfolioSnapshot>;
    const id = typeof row.id === "string" && row.id ? row.id : null;
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const capitalEur =
      typeof row.capitalEur === "number" && row.capitalEur > 0
        ? row.capitalEur
        : null;
    const entryDate = isIsoDate(row.entryDate) ? row.entryDate : null;
    const savedAt =
      typeof row.savedAt === "string" && row.savedAt
        ? row.savedAt
        : new Date().toISOString();
    if (!id || !name || capitalEur == null || !entryDate) continue;

    const selectedSymbols = Array.isArray(row.selectedSymbols)
      ? [...new Set(row.selectedSymbols.filter(
          (s): s is string => typeof s === "string" && allowed.has(s),
        ))]
      : [];
    if (selectedSymbols.length === 0) continue;

    const weights: Record<string, number> = {};
    if (row.weights && typeof row.weights === "object") {
      for (const [symbol, weight] of Object.entries(row.weights)) {
        if (allowed.has(symbol) && typeof weight === "number") {
          weights[symbol] = weight;
        }
      }
    }
    for (const symbol of selectedSymbols) {
      if (weights[symbol] == null) weights[symbol] = 0;
    }

    out.push({
      id,
      name,
      savedAt,
      capitalEur,
      entryDate,
      weights,
      selectedSymbols,
    });
    if (out.length >= MAX_SNAPSHOTS) break;
  }

  return out;
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
    // One-time migration from pre-v2 hardcoded default entry dates.
    const shouldRefreshEntryDate = storedVersion < 2;

    const entryDate = shouldRefreshEntryDate
      ? defaults.entryDate
      : isIsoDate(parsed.entryDate)
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
      snapshots: sanitizeSnapshots(parsed.snapshots),
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
