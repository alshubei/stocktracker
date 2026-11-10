import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  eurToWeight,
  redistributeEurAllocation,
  selectedWeightSum,
  weightToEur,
} from "./allocation-input.ts";

describe("allocation input conversion", () => {
  it("converts percent to EUR and back", () => {
    assert.equal(weightToEur(25, 10_000), 2500);
    assert.equal(eurToWeight(2500, 10_000), 25);
    assert.equal(weightToEur(100, 10_000), 10_000);
    assert.equal(eurToWeight(10_000, 10_000), 100);
  });

  it("handles zero capital safely", () => {
    assert.equal(eurToWeight(100, 0), 0);
  });
});

describe("redistributeEurAllocation", () => {
  it("gives the edited ticker its amount and splits the rest equally", () => {
    const next = redistributeEurAllocation(
      { NVDA: 25, AVGO: 25, NOW: 25, CIBR: 25 },
      ["NVDA", "AVGO", "NOW", "CIBR"],
      "NVDA",
      4000,
      10_000,
    );
    assert.equal(next.NVDA, 40);
    assert.equal(next.AVGO, 20);
    assert.equal(next.NOW, 20);
    assert.equal(next.CIBR, 20);
    assert.equal(selectedWeightSum(["NVDA", "AVGO", "NOW", "CIBR"], next), 100);
  });

  it("sets a sole selection to 100%", () => {
    const next = redistributeEurAllocation(
      { NVDA: 12.5, AVGO: 12.5 },
      ["NVDA"],
      "NVDA",
      2500,
      10_000,
    );
    assert.equal(next.NVDA, 100);
  });
});
