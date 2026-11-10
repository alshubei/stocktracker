import { useEffect, useState } from "react";
import {
  weightToEur,
  type WeightInputMode,
} from "../lib/allocation-input.ts";

type AllocationInputProps = {
  symbol: string;
  weightPercent: number;
  capitalEur: number;
  mode: WeightInputMode;
  /** Commit parsed field value (% or € depending on mode). */
  onCommit: (symbol: string, value: number) => void;
  id?: string;
  className?: string;
};

function formatCommitted(
  weightPercent: number,
  capitalEur: number,
  mode: WeightInputMode,
): string {
  if (mode === "eur") {
    return String(weightToEur(weightPercent, capitalEur));
  }
  return String(weightPercent);
}

export function AllocationInput({
  symbol,
  weightPercent,
  capitalEur,
  mode,
  onCommit,
  id,
  className = "field-input w-[4.75rem] min-w-[4.75rem] px-1.5 py-1 text-sm text-ink",
}: AllocationInputProps) {
  const isEur = mode === "eur";
  const committed = formatCommitted(weightPercent, capitalEur, mode);
  const [draft, setDraft] = useState<string | null>(null);
  const editing = draft !== null;

  useEffect(() => {
    if (!editing) return;
    // Drop draft when mode/capital context changes mid-edit.
    setDraft(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset on mode/capital
  }, [mode, capitalEur]);

  function commitDraft(raw: string) {
    const parsed = Number(raw);
    const value = Number.isFinite(parsed) ? parsed : 0;
    onCommit(symbol, value);
    setDraft(null);
  }

  return (
    <label
      htmlFor={id}
      className="flex shrink-0 items-center gap-1 text-xs text-muted"
    >
      <span className="sr-only">
        {isEur
          ? `Euro allocation for ${symbol}`
          : `Weight percent for ${symbol}`}
      </span>
      {isEur ? <span aria-hidden>€</span> : null}
      <input
        id={id}
        className={className}
        type="text"
        inputMode="decimal"
        value={editing ? draft : committed}
        onFocus={() => setDraft(committed)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== null) commitDraft(draft);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
          if (e.key === "Escape") {
            setDraft(null);
            e.currentTarget.blur();
          }
        }}
        onClick={(e) => e.stopPropagation()}
      />
      {!isEur ? <span aria-hidden>%</span> : null}
    </label>
  );
}
