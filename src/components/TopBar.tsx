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
    <header className="flex flex-wrap items-end justify-between gap-4 animate-[rise_0.55s_ease_both]">
      <div className="max-w-[36rem]">
        <h1 className="mt-0 mb-2 font-serif text-[clamp(1.8rem,3vw,2.4rem)] font-semibold leading-none">
          Stocktracker
        </h1>
        <p className="m-0 font-serif text-[clamp(1.05rem,2.2vw,1.35rem)] leading-snug text-ink/90">
          What would this portfolio be worth if you’d bought on that day?
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="field">
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
        <label className="field">
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
          className="btn-primary"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>
    </header>
  );
}
