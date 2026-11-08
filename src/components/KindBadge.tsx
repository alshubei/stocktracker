import type { InstrumentKind } from "../config/universe.ts";

type KindBadgeProps = {
  kind: InstrumentKind;
};

/** Compact stock vs ETF marker. */
export function KindBadge({ kind }: KindBadgeProps) {
  if (kind === "etf") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-gold/45 bg-gold/20 px-1.5 py-0.5 text-[0.7rem] font-semibold tracking-wide text-[#efe3b8] uppercase"
        title="ETF"
      >
        <span aria-hidden>▤</span>
        ETF
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-stock/45 bg-stock/20 px-1.5 py-0.5 text-[0.7rem] font-semibold tracking-wide text-[#d8ecff] uppercase"
      title="Stock"
    >
      <span aria-hidden>◆</span>
      Stock
    </span>
  );
}
