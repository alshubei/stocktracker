import type { PortfolioResult } from "../lib/portfolio.ts";
import { formatEur, formatPct, pnlClass } from "../lib/format.ts";

export type PresetCardModel = {
  id: string;
  label: string;
  entryDate: string;
  result: PortfolioResult | null;
  error: string | null;
};

type PresetStripProps = {
  presets: PresetCardModel[];
  activeEntryDate: string;
  onSelect: (entryDate: string) => void;
};

export function PresetStrip({
  presets,
  activeEntryDate,
  onSelect,
}: PresetStripProps) {
  return (
    <section className="presets" aria-label="Preset entry scenarios">
      {presets.map((preset) => {
        const active = preset.entryDate === activeEntryDate;
        return (
          <button
            key={preset.id}
            type="button"
            className={`preset-card${active ? " active" : ""}`}
            onClick={() => onSelect(preset.entryDate)}
          >
            <span className="preset-label">{preset.label}</span>
            <span className="preset-date">{preset.entryDate}</span>
            {preset.error ? (
              <span className="preset-error">{preset.error}</span>
            ) : preset.result ? (
              <>
                <span className="preset-value">
                  {formatEur(preset.result.totalValueEur)}
                </span>
                <span className={`preset-pnl ${pnlClass(preset.result.totalPnlEur)}`}>
                  {formatPct(preset.result.totalPnlPercent)}
                </span>
              </>
            ) : (
              <span className="preset-value muted">—</span>
            )}
          </button>
        );
      })}
    </section>
  );
}
