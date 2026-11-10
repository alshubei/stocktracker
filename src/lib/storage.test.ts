import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { daysAgoIso, defaultEntryDate } from "./storage.ts";

describe("default entry date", () => {
  it("is five UTC calendar days before the given day", () => {
    const from = new Date(Date.UTC(2026, 10, 10)); // 2026-11-10
    assert.equal(daysAgoIso(5, from), "2026-11-05");
    assert.equal(defaultEntryDate(from), "2026-11-05");
  });
});
