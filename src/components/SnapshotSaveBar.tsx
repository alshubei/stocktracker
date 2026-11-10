import { useId, useState } from "react";
import { MAX_SNAPSHOTS } from "../lib/snapshots.ts";

type SnapshotSaveBarProps = {
  name: string;
  onNameChange: (name: string) => void;
  portfolioReady: boolean;
  editingId: string | null;
  snapshotCount: number;
  onSave: () => void;
  onCancelEdit: () => void;
};

export function SnapshotSaveBar({
  name,
  onNameChange,
  portfolioReady,
  editingId,
  snapshotCount,
  onSave,
  onCancelEdit,
}: SnapshotSaveBarProps) {
  const editing = editingId != null;
  const atMax = snapshotCount >= MAX_SNAPSHOTS;
  const [nameError, setNameError] = useState<string | null>(null);
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
      id="snapshot-save"
      className="panel grid min-w-0 gap-2.5 animate-[rise_0.6s_ease_both]"
      aria-label={editing ? "Update snapshot" : "Save snapshot"}
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="field min-w-0 flex-1 basis-[12rem]">
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
        <div className="flex flex-wrap items-center gap-2">
          {editing ? (
            <button
              type="button"
              className="text-xs font-medium text-muted underline-offset-2 hover:text-ink hover:underline"
              onClick={onCancelEdit}
            >
              Cancel edit
            </button>
          ) : null}
          <button
            type="button"
            className="btn-primary"
            onClick={handleSaveClick}
            disabled={!portfolioReady || (!editing && atMax)}
            title={
              editing
                ? portfolioReady
                  ? "Update this snapshot from the current form"
                  : "Need tickers and valid weights"
                : atMax
                  ? `Maximum ${MAX_SNAPSHOTS} snapshots`
                  : portfolioReady
                    ? "Freeze current portfolio as a snapshot"
                    : "Need tickers and valid weights"
            }
          >
            {editing
              ? "Update snapshot"
              : `Save snapshot (${snapshotCount}/${MAX_SNAPSHOTS})`}
          </button>
        </div>
      </div>
      {editing ? (
        <p className="m-0 text-sm text-muted">
          Editing a saved snapshot — adjust capital, entry, tickers, or weights
          above, then update.
        </p>
      ) : (
        <p className="m-0 text-sm text-muted">
          Freeze this what-if to compare it on the chart below.
        </p>
      )}
      {nameError ? (
        <p id={nameErrorId} className="m-0 text-sm text-neg" role="alert">
          {nameError}
        </p>
      ) : null}
    </section>
  );
}
