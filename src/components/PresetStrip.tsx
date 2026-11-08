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
    <section
      className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 animate-[rise_0.65s_ease_both]"
      aria-label="Preset entry scenarios"
    >
      {presets.map((preset) => {
        const active = preset.entryDate === activeEntryDate;
        return (
          <button
            key={preset.id}
            type="button"
            className={`grid gap-0.5 rounded-[14px] border bg-panel/92 p-4 text-left text-ink shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition hover:-translate-y-px ${
              active
                ? "border-accent shadow-[0_0_0_1px_var(--color-accent),0_18px_40px_rgba(0,0,0,0.28)]"
                : "border-border"
            }`}
            onClick={() => onSelect(preset.entryDate)}
          >
            <span className="font-semibold">{preset.label}</span>
            <span className="text-sm text-muted">{preset.entryDate}</span>
            {preset.error ? (
              <span className="text-sm text-muted">{preset.error}</span>
            ) : preset.result ? (
              <>
                <span className="mt-1 text-[1.05rem]">
                  {formatEur(preset.result.totalValueEur)}
                </span>
                <span
                  className={`text-sm ${pnlClass(preset.result.totalPnlEur)}`}
                >
                  {formatPct(preset.result.totalPnlPercent)}
                </span>
              </>
            ) : (
              <span className="mt-1 text-[1.05rem] text-muted">—</span>
            )}
          </button>
        );
      })}
    </section>
  );
}
