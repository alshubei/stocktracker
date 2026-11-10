type TopBarProps = {
  capitalEur: number;
  entryDate: string;
  loading: boolean;
  onCapitalChange: (value: number) => void;
  onEntryDateChange: (value: string) => void;
  onRefresh: () => void;
};

export function TopBar({
  capitalEur,
  entryDate,
  loading,
  onCapitalChange,
  onEntryDateChange,
  onRefresh,
}: TopBarProps) {
  return (
    <header className="flex w-full min-w-0 flex-col gap-4 animate-[rise_0.55s_ease_both] sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0 max-w-[36rem]">
        <h1 className="mt-0 mb-2 font-serif text-[clamp(1.8rem,3vw,2.4rem)] font-semibold leading-none">
          Stocktracker
        </h1>
        <p className="m-0 font-serif text-[clamp(1.05rem,2.2vw,1.35rem)] leading-snug text-ink/90 [overflow-wrap:anywhere]">
          What would this portfolio be worth if you’d bought on that day?
        </p>
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
