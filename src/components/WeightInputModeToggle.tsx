import type { WeightInputMode } from "../lib/allocation-input.ts";

type WeightInputModeToggleProps = {
  mode: WeightInputMode;
  onChange: (mode: WeightInputMode) => void;
};

export function WeightInputModeToggle({
  mode,
  onChange,
}: WeightInputModeToggleProps) {
  return (
    <div
      className="inline-flex rounded-md border border-border p-0.5 text-xs font-semibold"
      role="group"
      aria-label="Allocation input mode"
    >
      <button
        type="button"
        className={`rounded px-2.5 py-1 transition ${
          mode === "percent"
            ? "bg-accent text-[#062015]"
            : "text-muted hover:text-ink"
        }`}
        aria-pressed={mode === "percent"}
        onClick={() => onChange("percent")}
      >
        %
      </button>
      <button
        type="button"
        className={`rounded px-2.5 py-1 transition ${
          mode === "eur"
            ? "bg-accent text-[#062015]"
            : "text-muted hover:text-ink"
        }`}
        aria-pressed={mode === "eur"}
        onClick={() => onChange("eur")}
      >
        €
      </button>
    </div>
  );
}
