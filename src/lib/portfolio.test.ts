import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  closeForEntry,
  closeOnOrBefore,
  computePortfolio,
  effectiveWeightsAmong,
  weightSum,
  weightsAreValid,
} from "./portfolio.ts";

describe("portfolio helpers", () => {
  it("sums weights and validates near 100", () => {
    assert.equal(weightSum({ A: 50, B: 50 }), 100);
    assert.equal(weightsAreValid({ A: 50, B: 50 }), true);
    assert.equal(weightsAreValid({ A: 40, B: 40 }), false);
  });

  it("rescales Focus selection weights to 100% (single ticker → 100)", () => {
    assert.deepEqual(
      effectiveWeightsAmong(["NVDA"], {
        NVDA: 12.5,
        AVGO: 12.5,
        NOW: 12.5,
      }),
      { NVDA: 100 },
    );
    assert.deepEqual(
      effectiveWeightsAmong(["NVDA", "AVGO"], {
        NVDA: 12.5,
        AVGO: 12.5,
        NOW: 12.5,
      }),
      { NVDA: 50, AVGO: 50 },
    );
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

  it("embeds entry, hover, and latest USD prices on valueSeries points", () => {
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
          { date: "2025-04-05", close: 105 },
          { date: "2025-04-10", close: 110 },
        ],
        BBB: [
          { date: "2025-04-01", close: 50 },
          { date: "2025-04-05", close: 45 },
          { date: "2025-04-10", close: 40 },
        ],
      },
      fxSeries: [
        { date: "2025-04-01", close: 1.1 },
        { date: "2025-04-05", close: 1.05 },
        { date: "2025-04-10", close: 1.0 },
      ],
    });

    const mid = result.valueSeries.find((p) => p.date === "2025-04-05");
    assert.ok(mid);
    assert.deepEqual(mid.tickers, [
      { symbol: "AAA", entryUsd: 100, hoverUsd: 105, latestUsd: 110 },
      { symbol: "BBB", entryUsd: 50, hoverUsd: 45, latestUsd: 40 },
    ]);

    const last = result.valueSeries[result.valueSeries.length - 1]!;
    assert.equal(last.date, "2025-04-10");
    assert.deepEqual(last.tickers, [
      { symbol: "AAA", entryUsd: 100, hoverUsd: 110, latestUsd: 110 },
      { symbol: "BBB", entryUsd: 50, hoverUsd: 40, latestUsd: 40 },
    ]);
  });
});
