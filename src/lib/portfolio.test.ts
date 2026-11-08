import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  closeForEntry,
  closeOnOrBefore,
  computePortfolio,
  weightSum,
  weightsAreValid,
} from "./portfolio.ts";

describe("portfolio helpers", () => {
  it("sums weights and validates near 100", () => {
    assert.equal(weightSum({ A: 50, B: 50 }), 100);
    assert.equal(weightsAreValid({ A: 50, B: 50 }), true);
    assert.equal(weightsAreValid({ A: 40, B: 40 }), false);
  });

  it("picks previous close on non-trading day", () => {
    const series = [
      { date: "2025-04-04", close: 10 },
      { date: "2025-04-07", close: 9 },
    ];
    assert.deepEqual(closeOnOrBefore(series, "2025-04-05"), {
      date: "2025-04-04",
      close: 10,
    });
  });

  it("falls forward to first close for new listings", () => {
    const series = [{ date: "2025-06-01", close: 12 }];
    assert.deepEqual(closeForEntry(series, "2025-04-01"), {
      date: "2025-06-01",
      close: 12,
    });
  });
});

describe("computePortfolio", () => {
  it("computes shares, FX conversion, and P&L", () => {
    const result = computePortfolio({
      capitalEur: 1000,
      entryDate: "2025-04-01",
      asOfDate: "2025-04-10",
      positions: [
        { symbol: "AAA", weightPercent: 60 },
        { symbol: "BBB", weightPercent: 40 },
      ],
      priceSeriesBySymbol: {
        AAA: [
          { date: "2025-04-01", close: 100 },
          { date: "2025-04-10", close: 110 },
        ],
        BBB: [
          { date: "2025-04-01", close: 50 },
          { date: "2025-04-10", close: 40 },
        ],
      },
      fxSeries: [
        { date: "2025-04-01", close: 1.1 },
        { date: "2025-04-10", close: 1.0 },
      ],
    });

    // AAA: 600 EUR * 1.1 = 660 USD / 100 = 6.6 shares → 6.6 * 110 = 726 USD → 726 EUR
    assert.equal(result.positions[0]!.shares, 6.6);
    assert.equal(result.positions[0]!.valueEur, 726);

    // BBB: 400 EUR * 1.1 = 440 USD / 50 = 8.8 shares → 8.8 * 40 = 352 USD → 352 EUR
    assert.equal(result.positions[1]!.shares, 8.8);
    assert.equal(result.positions[1]!.valueEur, 352);

    assert.equal(result.totalValueEur, 1078);
    assert.equal(result.totalPnlEur, 78);
    assert.ok(Math.abs(result.totalPnlPercent - 7.8) < 1e-9);
    assert.equal(result.valueSeries.length, 2);
  });
});
