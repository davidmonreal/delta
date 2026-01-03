import { describe, expect, it } from "vitest";

import { applySummaryMetrics, filterSummaries, sortSummaries } from "../summaryUtils";
import type { ResolvedFilters } from "../filters";

describe("summaryUtils", () => {
  it("calculates unit prices and percent deltas", () => {
    const result = applySummaryMetrics({
      previousTotal: 100,
      previousUnits: 10,
      currentTotal: 120,
      currentUnits: 10,
    });

    expect(result.previousUnitPrice).toBe(10);
    expect(result.currentUnitPrice).toBe(12);
    expect(result.deltaPrice).toBe(2);
    expect(result.percentDelta).toBe(20);
    expect(result.isMissing).toBe(false);
  });

  it("marks missing when current units are zero", () => {
    const result = applySummaryMetrics({
      previousTotal: 100,
      previousUnits: 10,
      currentTotal: 0,
      currentUnits: 0,
    });

    expect(result.isMissing).toBe(true);
    expect(Number.isNaN(result.deltaPrice)).toBe(true);
    expect(result.percentDelta).toBeUndefined();
  });

  it("filters summaries by show flags", () => {
    const summaries = [
      { deltaPrice: -1.5, isMissing: false },
      { deltaPrice: 0, isMissing: false },
      { deltaPrice: 2, isMissing: false },
      { deltaPrice: 0, isMissing: true },
    ];

    const baseFilters: ResolvedFilters = {
      year: 2024,
      month: 1,
      previousYear: 2023,
      show: "neg",
      showNegative: true,
      showEqual: false,
      showPositive: false,
      showMissing: false,
    };

    expect(filterSummaries(summaries, baseFilters)).toHaveLength(1);

    expect(
      filterSummaries(summaries, { ...baseFilters, show: "eq", showNegative: false, showEqual: true }),
    ).toHaveLength(2);

    expect(
      filterSummaries(summaries, { ...baseFilters, show: "pos", showNegative: false, showPositive: true }),
    ).toHaveLength(1);

    expect(
      filterSummaries(summaries, { ...baseFilters, show: "miss", showNegative: false, showMissing: true }),
    ).toHaveLength(1);
  });

  it("sorts missing to the end and orders by delta", () => {
    const sorted = sortSummaries([
      { deltaPrice: -5, isMissing: false },
      { deltaPrice: 2, isMissing: false },
      { deltaPrice: 0, isMissing: true },
    ]);

    expect(sorted[0].isMissing).toBe(true);
    expect(sorted[1].deltaPrice).toBe(-5);
  });
});
