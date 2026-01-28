import { describe, expect, it } from "vitest";

import { pairPeriodLines } from "../pairPeriodLines";

describe("pairPeriodLines", () => {
  it("pairs month-by-month and then falls back across the period", () => {
    const periodMonthsA = [
      { year: 2024, month: 1 },
      { year: 2024, month: 2 },
    ];
    const periodMonthsB = [
      { year: 2024, month: 3 },
      { year: 2024, month: 4 },
    ];
    const previous = [
      { year: 2024, month: 1, total: 10, units: 1 },
      { year: 2024, month: 2, total: 20, units: 1 },
    ];
    const current = [{ year: 2024, month: 3, total: 20, units: 1 }];

    const result = pairPeriodLines({
      previous,
      current,
      periodMonthsA,
      periodMonthsB,
      metric: "unit",
      tolerance: 0.01,
    });

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].previous.month).toBe(2);
    expect(result.matches[0].current.month).toBe(3);
    expect(result.unmatchedPrevious).toHaveLength(1);
  });
});
