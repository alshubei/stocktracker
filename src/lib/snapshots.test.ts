import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MAX_SNAPSHOTS,
  addSnapshot,
  canSaveSnapshot,
  mergeSeries,
  removeSnapshot,
  snapshotPortfolioReady,
} from "./snapshots.ts";

const baseDraft = {
  name: "April dip",
  capitalEur: 10_000,
  entryDate: "2025-04-07",
  weights: { NVDA: 100 },
  selectedSymbols: ["NVDA"],
};

describe("snapshots", () => {
  it("requires name, capital, date, tickers, and valid weights flag", () => {
    const portfolio = {
      capitalEur: 1000,
      entryDate: "2026-11-05",
      selectedSymbols: ["NVDA"],
      weightsValid: true,
    };
    assert.equal(snapshotPortfolioReady(portfolio), true);
    assert.equal(canSaveSnapshot({ name: "x", ...portfolio }), true);
    assert.equal(canSaveSnapshot({ name: "  ", ...portfolio }), false);
    assert.equal(
      snapshotPortfolioReady({ ...portfolio, selectedSymbols: [] }),
      false,
    );
    assert.equal(
      canSaveSnapshot({ name: "x", ...portfolio, weightsValid: false }),
      false,
    );
  });

  it("adds up to MAX_SNAPSHOTS then refuses", () => {
    let list: NonNullable<ReturnType<typeof addSnapshot>> = [];
    for (let i = 0; i < MAX_SNAPSHOTS; i++) {
      const next = addSnapshot(list, {
        ...baseDraft,
        name: `Snap ${i}`,
      });
      assert.ok(next);
      list = next;
    }
    assert.equal(list.length, MAX_SNAPSHOTS);
    assert.equal(addSnapshot(list, { ...baseDraft, name: "extra" }), null);
  });

  it("removes by id", () => {
    const list = addSnapshot([], baseDraft);
    assert.ok(list);
    const id = list[0]!.id;
    assert.equal(removeSnapshot(list, id).length, 0);
  });

  it("merges series by date with gaps", () => {
    assert.deepEqual(
      mergeSeries([
        {
          id: "what-if",
          points: [
            { date: "2026-01-01", valueEur: 100 },
            { date: "2026-01-03", valueEur: 110 },
          ],
        },
        {
          id: "snap",
          points: [
            { date: "2026-01-02", valueEur: 200 },
            { date: "2026-01-03", valueEur: 210 },
          ],
        },
      ]),
      [
        { date: "2026-01-01", "what-if": 100 },
        { date: "2026-01-02", snap: 200 },
        { date: "2026-01-03", "what-if": 110, snap: 210 },
      ],
    );
  });
});
