import { describe, expect, it } from "vitest";

import { resolveFilters } from "../filters";

describe("resolveFilters", () => {
  it("uses defaults when inputs are invalid", () => {
    const result = resolveFilters({
      raw: { year: "nope", month: "13" },
      defaults: { year: 2024, month: 2 },
    });

    expect(result.periodB.startYear).toBe(2024);
    expect(result.periodB.startMonth).toBe(2);
    expect(result.periodA.startYear).toBe(2023);
    expect(result.periodA.startMonth).toBe(2);
    expect(result.showNegative).toBe(true);
    expect(result.showPercentUnder).toBe(true);
    expect(result.showPercentEqual).toBe(false);
    expect(result.showPercentOver).toBe(true);
  });

  it("sets flags for each show filter", () => {
    const positive = resolveFilters({
      raw: { show: "pos", year: "2025", month: "3" },
      defaults: { year: 2024, month: 1 },
    });

    expect(positive.showPositive).toBe(true);
    expect(positive.showMissing).toBe(false);

    const missing = resolveFilters({
      raw: { show: "miss" },
      defaults: { year: 2024, month: 1 },
    });

    expect(missing.showMissing).toBe(true);
    expect(missing.showEqual).toBe(false);
  });
});
