import { useId, useState } from "react";
import {
  MAX_SNAPSHOTS,
  snapshotColor,
  type PortfolioSnapshot,
} from "../lib/snapshots.ts";
import { formatEur, formatPct, pnlClass } from "../lib/format.ts";
import { InfoIcon } from "./InfoIcon.tsx";

type SnapshotRow = {
  snapshot: PortfolioSnapshot;
  index: number;
  valueEur: number | null;
  pnlPercent: number | null;
};

type SnapshotsPanelProps = {
  name: string;
  onNameChange: (name: string) => void;
  /** Portfolio inputs are valid (name validated in the panel). */
  portfolioReady: boolean;
  onSave: () => void;
  rows: SnapshotRow[];
  onRemove: (id: string) => void;
  onLoad: (id: string) => void;
};

const SNAPSHOT_HINT =
  "Save a named portfolio (capital, entry date, tickers, weights). It stays fixed; the form above stays a live what-if. With at least one snapshot, the chart compares those locked curves to today against your current what-if.";

export function SnapshotsPanel({
  name,
  onNameChange,
  portfolioReady,
  onSave,
  rows,
  onRemove,
  onLoad,
}: SnapshotsPanelProps) {
  const atMax = rows.length >= MAX_SNAPSHOTS;
  const [hintOpen, setHintOpen] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const hintId = useId();
  const nameErrorId = useId();

  function handleNameChange(value: string) {
    onNameChange(value);
    if (nameError && value.trim()) setNameError(null);
  }

  function handleSaveClick() {
    if (!name.trim()) {
      setNameError("Write a name for this snapshot.");
      return;
    }
    setNameError(null);
    onSave();
  }

  return (
    <section
      className="panel grid gap-3 animate-[rise_0.6s_ease_both]"
      aria-label="Snapshots"
    >
      <div>
        <div className="flex items-center gap-1.5">
          <h2 className="m-0 font-serif text-xl font-semibold">Snapshots</h2>
          <button
            type="button"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-bg0 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-expanded={hintOpen}
            aria-controls={hintId}
            onClick={() => setHintOpen((open) => !open)}
          >
            <InfoIcon className="size-4" />
            <span className="sr-only">
              {hintOpen ? "Hide snapshot help" : "Show snapshot help"}
            </span>
          </button>
        </div>
        <p className="sr-only">{SNAPSHOT_HINT}</p>
        <div
          id={hintId}
          aria-hidden
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${
            hintOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <p className="mt-2 mb-0 max-w-2xl text-sm text-muted">
              {SNAPSHOT_HINT}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="field min-w-[14rem] flex-1">
          Snapshot name
          <input
            className={`field-input w-full ${nameError ? "border-neg" : ""}`}
            type="text"
            value={name}
            maxLength={48}
            placeholder="e.g. April dip, NVDA-heavy"
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? nameErrorId : undefined}
            onChange={(e) => handleNameChange(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn-primary"
          onClick={handleSaveClick}
          disabled={!portfolioReady || atMax}
          title={
            atMax
              ? `Maximum ${MAX_SNAPSHOTS} snapshots`
              : portfolioReady
                ? "Freeze current portfolio as a snapshot"
                : "Need tickers and valid weights"
          }
        >
          Save snapshot ({rows.length}/{MAX_SNAPSHOTS})
        </button>
      </div>
      {nameError ? (
        <p id={nameErrorId} className="m-0 text-sm text-neg" role="alert">
          {nameError}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="m-0 text-sm text-muted">
          No snapshots yet — save one to unlock comparison curves.
        </p>
      ) : (
        <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
          {rows.map(({ snapshot, index, valueEur, pnlPercent }) => {
            const color = snapshotColor(index);
            return (
              <li
                key={snapshot.id}
                className="flex items-stretch gap-2 rounded-lg border border-border p-2"
              >
                <div className="grid min-w-0 flex-1 grid-cols-[auto_1fr] gap-x-2.5 gap-y-0.5 px-2 py-1.5">
                  <span
                    className="mt-1 size-2.5 self-start rounded-full"
                    style={{ background: color }}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{snapshot.name}</div>
                    <div className="text-sm text-muted">
                      {snapshot.entryDate} · {formatEur(snapshot.capitalEur)} ·{" "}
                      {snapshot.selectedSymbols.length} tickers
                    </div>
                    <div className="mt-0.5 text-sm">
                      {valueEur != null && pnlPercent != null ? (
                        <>
                          <span className="tabular-nums">
                            {formatEur(valueEur)}
                          </span>
                          <span
                            className={`ml-2 tabular-nums ${pnlClass(pnlPercent)}`}
                          >
                            {formatPct(pnlPercent)}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted">No curve yet</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center gap-1">
                  <button
                    type="button"
                    className="btn-ghost px-2.5 py-1.5 text-sm"
                    onClick={() => onLoad(snapshot.id)}
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-2.5 py-1.5 text-sm"
                    onClick={() => onRemove(snapshot.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
