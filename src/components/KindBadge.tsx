import type { InstrumentKind } from "../config/universe.ts";

type KindBadgeProps = {
  kind: InstrumentKind;
};

/** Compact stock vs ETF marker. */
export function KindBadge({ kind }: KindBadgeProps) {
  if (kind === "etf") {
    return (
      <span className="kind-badge etf" title="ETF">
        <span className="kind-glyph" aria-hidden>
          ▤
        </span>
        ETF
      </span>
    );
  }

  return (
    <span className="kind-badge stock" title="Stock">
      <span className="kind-glyph" aria-hidden>
        ◆
      </span>
      Stock
    </span>
  );
}
