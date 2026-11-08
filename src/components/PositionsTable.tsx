import type { Ticker } from "../config/universe.ts";
import type { PositionResult } from "../lib/portfolio.ts";
import {
  formatEur,
  formatPct,
  formatShares,
  formatUsd,
  pnlClass,
} from "../lib/format.ts";

type PositionsTableProps = {
  universe: Ticker[];
  weights: Record<string, number>;
  positions: PositionResult[] | null;
  weightSum: number;
  weightsValid: boolean;
  errors: Record<string, string>;
  onWeightChange: (symbol: string, weight: number) => void;
  onEqualSplit: () => void;
};

export function PositionsTable({
  universe,
  weights,
  positions,
  weightSum,
  weightsValid,
  errors,
  onWeightChange,
  onEqualSplit,
}: PositionsTableProps) {
  const bySymbol = new Map(positions?.map((p) => [p.symbol, p]) ?? []);

  return (
    <section className="positions">
      <div className="positions-head">
        <h2>Positions</h2>
        <div className="positions-actions">
          <span className={weightsValid ? "muted" : "warn"}>
            Weights sum: {weightSum.toFixed(2)}%
          </span>
          <button type="button" className="ghost" onClick={onEqualSplit}>
            Equal split
          </button>
        </div>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Weight %</th>
              <th>€ allocated</th>
              <th>Entry $</th>
              <th>Shares</th>
              <th>Now €</th>
              <th>P&amp;L</th>
              <th>Now $</th>
            </tr>
          </thead>
          <tbody>
            {universe.map((ticker) => {
              const row = bySymbol.get(ticker.symbol);
              const err = errors[ticker.symbol];
              return (
                <tr key={ticker.symbol}>
                  <td>
                    <div className="ticker-cell">
                      <strong>{ticker.symbol}</strong>
                      <span className="muted">{ticker.name}</span>
                      {err ? <span className="warn">{err}</span> : null}
                    </div>
                  </td>
                  <td>
                    <input
                      className="weight-input"
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={weights[ticker.symbol] ?? 0}
                      onChange={(e) =>
                        onWeightChange(ticker.symbol, Number(e.target.value))
                      }
                    />
                  </td>
                  <td>{row ? formatEur(row.eurAllocated) : "—"}</td>
                  <td>
                    {row
                      ? `${formatUsd(row.entryPriceUsd)} (${row.entryDateUsed})`
                      : "—"}
                  </td>
                  <td>{row ? formatShares(row.shares) : "—"}</td>
                  <td>{row ? formatEur(row.valueEur) : "—"}</td>
                  <td className={row ? pnlClass(row.pnlEur) : undefined}>
                    {row
                      ? `${formatEur(row.pnlEur)} (${formatPct(row.pnlPercent)})`
                      : "—"}
                  </td>
                  <td>{row ? formatUsd(row.valueUsd) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
