import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pnlChartColor } from "./format.ts";

describe("pnlChartColor", () => {
  it("returns green for positive P&L", () => {
    assert.equal(pnlChartColor(12.5), "#3dba8a");
  });

  it("returns red for negative P&L", () => {
    assert.equal(pnlChartColor(-3.2), "#e07a6a");
  });

  it("returns muted green-gray for flat P&L", () => {
    assert.equal(pnlChartColor(0), "#93a59b");
  });
});
