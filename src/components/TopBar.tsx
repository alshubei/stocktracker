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
      <div className="max-w-[28rem]">
        <h1 className="mt-0 mb-1 font-serif text-[clamp(1.8rem,3vw,2.4rem)] font-semibold">
          Stocktracker
        </h1>
        <p className="m-0 text-sm leading-snug text-muted">
          Set capital and an entry date to see what a virtual buy would be worth
          now.
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
