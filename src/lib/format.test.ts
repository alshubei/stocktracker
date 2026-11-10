import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pnlChartColor } from "./format.ts";

describe("pnlChartColor", () => {
  it("returns blue for positive P&L", () => {
    assert.equal(pnlChartColor(12.5), "#6b9fd4");
  });

  it("returns amber for negative P&L", () => {
    assert.equal(pnlChartColor(-3.2), "#d4a05a");
  });

  it("returns muted gray for flat P&L", () => {
    assert.equal(pnlChartColor(0), "#93a59b");
  });
});
