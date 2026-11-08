import {
  DEFAULT_CAPITAL_EUR,
  UNIVERSE,
  equalWeights,
} from "../config/universe.ts";

const STORAGE_KEY = "stocktracker:v1";

export type StoredConfig = {
  capitalEur: number;
  weights: Record<string, number>;
  entryDate: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function defaultConfig(): StoredConfig {
  return {
    capitalEur: DEFAULT_CAPITAL_EUR,
    weights: equalWeights(),
    entryDate: "2025-04-07",
  };
}

export function loadConfig(): StoredConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultConfig();
    const parsed = JSON.parse(raw) as Partial<StoredConfig>;
    const defaults = defaultConfig();
    const weights = { ...defaults.weights, ...(parsed.weights ?? {}) };
    for (const ticker of UNIVERSE) {
      if (weights[ticker.symbol] == null) {
        weights[ticker.symbol] = defaults.weights[ticker.symbol]!;
      }
    }
    return {
      capitalEur:
        typeof parsed.capitalEur === "number" && parsed.capitalEur > 0
          ? parsed.capitalEur
          : defaults.capitalEur,
      weights,
      entryDate:
        typeof parsed.entryDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.entryDate)
          ? parsed.entryDate
          : defaults.entryDate,
    };
  } catch {
    return defaultConfig();
  }
}

export function saveConfig(config: StoredConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export { todayIso };
