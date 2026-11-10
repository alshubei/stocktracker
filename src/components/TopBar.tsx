import { useId, useState } from "react";

type TopBarProps = {
  capitalEur: number;
  entryDate: string;
  loading: boolean;
  onCapitalChange: (value: number) => void;
  onEntryDateChange: (value: string) => void;
  onRefresh: () => void;
};

const COLOR_NOTE =
  "No red or green scoreboard here — blue and amber only, so you always leave with knowledge, not a gut punch.";

export function TopBar({
  capitalEur,
  entryDate,
  loading,
  onCapitalChange,
  onEntryDateChange,
  onRefresh,
}: TopBarProps) {
  const [noteOpen, setNoteOpen] = useState(false);
  const noteId = useId();

  return (
    <header className="flex w-full min-w-0 flex-col gap-4 animate-[rise_0.55s_ease_both] sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0 max-w-[40rem]">
        <h1 className="mt-0 mb-2 font-serif text-[clamp(1.8rem,3vw,2.4rem)] font-semibold leading-none">
          Stocktracker
        </h1>
        <p className="m-0 font-serif text-[clamp(1.05rem,2.2vw,1.35rem)] leading-snug text-ink/90 [overflow-wrap:anywhere]">
          What would this portfolio be worth if you’d bought on that day?
        </p>
        <div className="mt-2.5">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg0 px-2 py-1 text-left transition hover:border-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-expanded={noteOpen}
            aria-controls={noteId}
            onClick={() => setNoteOpen((open) => !open)}
          >
            <span className="text-xs font-medium tracking-wide text-muted">
              Chart in
            </span>
            <span
              className="size-2.5 shrink-0 rounded-full bg-pos"
              title="Blue"
              aria-hidden
            />
            <span
              className="size-2.5 shrink-0 rounded-full bg-neg"
              title="Amber"
              aria-hidden
            />
            <svg
              className="size-3.5 text-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
            <span className="sr-only">
              {noteOpen
                ? "Hide why the chart uses blue and amber"
                : "Why the chart uses blue and amber"}
            </span>
          </button>
          <p className="sr-only">{COLOR_NOTE}</p>
          <div
            id={noteId}
            aria-hidden={!noteOpen}
            className={`grid transition-[grid-template-rows] duration-200 ease-out ${
              noteOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <p className="mt-2 mb-0 max-w-[34rem] text-sm leading-snug text-muted [overflow-wrap:anywhere]">
                {COLOR_NOTE}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-wrap sm:items-end">
        <label className="field min-w-0">
          Capital (€)
          <input
            className="field-input"
            type="number"
            min={1}
            step={100}
            value={capitalEur}
            onChange={(e) => onCapitalChange(Number(e.target.value))}
          />
        </label>
        <label className="field min-w-0">
          Entry date
          <input
            className="field-input"
            type="date"
            value={entryDate}
            onChange={(e) => onEntryDateChange(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn-primary col-span-2 w-full sm:col-span-1 sm:w-auto"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>
    </header>
  );
}
