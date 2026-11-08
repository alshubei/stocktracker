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
    <header className="topbar">
      <div className="brand">
        <p className="brand-kicker">Virtual entry tracker</p>
        <h1>Stocktracker</h1>
      </div>
      <div className="topbar-controls">
        <label>
          Capital (€)
          <input
            type="number"
            min={1}
            step={100}
            value={capitalEur}
            onChange={(e) => onCapitalChange(Number(e.target.value))}
          />
        </label>
        <label>
          Entry date
          <input
            type="date"
            value={entryDate}
            onChange={(e) => onEntryDateChange(e.target.value)}
          />
        </label>
        <button type="button" onClick={onRefresh} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>
    </header>
  );
}
