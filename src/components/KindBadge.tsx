import type { InstrumentKind } from "../config/universe.ts";

type KindBadgeProps = {
  kind: InstrumentKind;
};

/** Compact stock vs ETF marker. */
export function KindBadge({ kind }: KindBadgeProps) {
  if (kind === "etf") {
    return (
      <span className="text-xs font-medium text-muted" title="ETF">
        ETF
      </span>
    );
  }

  return (
    <span className="text-xs font-medium text-muted" title="Stock">
      Stock
    </span>
  );
}
