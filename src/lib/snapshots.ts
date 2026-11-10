export const MAX_SNAPSHOTS = 5;

/** Current what-if series key on merged chart data. */
export const WHAT_IF_SERIES_ID = "what-if";

export const SNAPSHOT_COLORS = [
  "#5b8def",
  "#e0b35a",
  "#e07a6a",
  "#b07cc6",
  "#6ec1b0",
] as const;

export const WHAT_IF_COLOR = "#3dba8a";

export type PortfolioSnapshot = {
  id: string;
  name: string;
  /** When the snapshot was frozen (ISO datetime). */
  savedAt: string;
  capitalEur: number;
  entryDate: string;
  weights: Record<string, number>;
  selectedSymbols: string[];
};

export type SnapshotDraft = {
  name: string;
  capitalEur: number;
  entryDate: string;
  weights: Record<string, number>;
  selectedSymbols: string[];
};

export function snapshotColor(index: number): string {
  return SNAPSHOT_COLORS[index % SNAPSHOT_COLORS.length]!;
}

export function createSnapshotId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function canSaveSnapshot(input: {
  name: string;
  capitalEur: number;
  entryDate: string;
  selectedSymbols: string[];
  weightsValid: boolean;
}): boolean {
  const nameOk = input.name.trim().length > 0;
  const capitalOk = Number.isFinite(input.capitalEur) && input.capitalEur > 0;
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(input.entryDate);
  const tickersOk = input.selectedSymbols.length > 0;
  return nameOk && capitalOk && dateOk && tickersOk && input.weightsValid;
}

export function createSnapshot(draft: SnapshotDraft): PortfolioSnapshot {
  return {
    id: createSnapshotId(),
    name: draft.name.trim(),
    savedAt: new Date().toISOString(),
    capitalEur: draft.capitalEur,
    entryDate: draft.entryDate,
    weights: { ...draft.weights },
    selectedSymbols: [...draft.selectedSymbols],
  };
}

export function addSnapshot(
  snapshots: PortfolioSnapshot[],
  draft: SnapshotDraft,
): PortfolioSnapshot[] | null {
  if (snapshots.length >= MAX_SNAPSHOTS) return null;
  if (
    !canSaveSnapshot({
      name: draft.name,
      capitalEur: draft.capitalEur,
      entryDate: draft.entryDate,
      selectedSymbols: draft.selectedSymbols,
      weightsValid: true,
    })
  ) {
    return null;
  }
  return [...snapshots, createSnapshot(draft)];
}

export function removeSnapshot(
  snapshots: PortfolioSnapshot[],
  id: string,
): PortfolioSnapshot[] {
  return snapshots.filter((s) => s.id !== id);
}

export type SeriesInput = {
  id: string;
  points: Array<{ date: string; valueEur: number }>;
};

/** Union dates; missing days stay undefined for that series. */
export function mergeSeries(
  series: SeriesInput[],
): Array<Record<string, string | number>> {
  const dates = new Set<string>();
  const byId = new Map<string, Map<string, number>>();

  for (const s of series) {
    const map = new Map<string, number>();
    for (const p of s.points) {
      dates.add(p.date);
      map.set(p.date, p.valueEur);
    }
    byId.set(s.id, map);
  }

  return [...dates].sort().map((date) => {
    const row: Record<string, string | number> = { date };
    for (const s of series) {
      const value = byId.get(s.id)?.get(date);
      if (value != null) row[s.id] = value;
    }
    return row;
  });
}
