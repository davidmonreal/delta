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

  it("keeps explicit missing flags even without previous units", () => {
    const result = applySummaryMetrics({
      previousTotal: 0,
      previousUnits: 0,
      currentTotal: 0,
      currentUnits: 0,
      isMissing: true,
    });

    expect(result.isMissing).toBe(true);
  });

  it("filters summaries by show flags", () => {
    const summaries = [
      { deltaPrice: -1.5, isMissing: false, isNew: false },
      { deltaPrice: 0, isMissing: false, isNew: false },
      { deltaPrice: 2, isMissing: false, isNew: false, percentDelta: 5 },
      { deltaPrice: 0, isMissing: true, isNew: false },
      { deltaPrice: 1, isMissing: false, isNew: true },
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
      showNew: false,
      showPercentUnder: true,
      showPercentEqual: false,
      showPercentOver: true,
    };

    expect(filterSummaries(summaries, baseFilters)).toHaveLength(1);

    expect(
      filterSummaries(summaries, { ...baseFilters, show: "eq", showNegative: false, showEqual: true }),
    ).toHaveLength(1);

    expect(
      filterSummaries(summaries, { ...baseFilters, show: "pos", showNegative: false, showPositive: true }),
    ).toHaveLength(1);

    expect(
      filterSummaries(summaries, { ...baseFilters, show: "miss", showNegative: false, showMissing: true }),
    ).toHaveLength(1);

    expect(
      filterSummaries(summaries, { ...baseFilters, show: "new", showNegative: false, showNew: true }),
    ).toHaveLength(1);
  });

  it("sorts missing first and orders by delta", () => {
    const filters: ResolvedFilters = {
      year: 2024,
      month: 1,
      previousYear: 2023,
      show: "neg",
      showNegative: true,
      showEqual: false,
      showPositive: false,
      showMissing: false,
      showNew: false,
      showPercentUnder: true,
      showPercentEqual: false,
      showPercentOver: true,
    };
    const sorted = sortSummaries(
      [
        { deltaPrice: -5, isMissing: false, isNew: false },
        { deltaPrice: 2, isMissing: false, isNew: false },
        { deltaPrice: 0, isMissing: true, isNew: false },
      ],
      filters,
    );

    expect(sorted[0].isMissing).toBe(true);
    expect(sorted[1].deltaPrice).toBe(-5);
  });

  it("sorts positives by percent delta", () => {
    const filters: ResolvedFilters = {
      year: 2024,
      month: 1,
      previousYear: 2023,
      show: "pos",
      showNegative: false,
      showEqual: false,
      showPositive: true,
      showMissing: false,
      showNew: false,
      showPercentUnder: true,
      showPercentEqual: false,
      showPercentOver: true,
    };
    const sorted = sortSummaries(
      [
        { deltaPrice: 2, isMissing: false, isNew: false, percentDelta: 10 },
        { deltaPrice: 1, isMissing: false, isNew: false, percentDelta: 25 },
        { deltaPrice: 3, isMissing: false, isNew: false, percentDelta: 5 },
      ],
      filters,
    );

    expect(sorted[0].percentDelta).toBe(25);
  });

  it("filters by percent buckets around 3%", () => {
    const summaries = [
      { deltaPrice: 1, isMissing: false, isNew: false, percentDelta: 2.5 },
      { deltaPrice: 1, isMissing: false, isNew: false, percentDelta: 3 },
      { deltaPrice: 1, isMissing: false, isNew: false, percentDelta: 4.2 },
    ];
    const filters: ResolvedFilters = {
      year: 2024,
      month: 1,
      previousYear: 2023,
      show: "pos",
      showNegative: false,
      showEqual: false,
      showPositive: true,
      showMissing: false,
      showNew: false,
      showPercentUnder: true,
      showPercentEqual: false,
      showPercentOver: false,
    };

    expect(filterSummaries(summaries, filters)).toHaveLength(1);
    expect(
      filterSummaries(summaries, { ...filters, showPercentUnder: false, showPercentEqual: true }),
    ).toHaveLength(1);
    expect(
      filterSummaries(summaries, { ...filters, showPercentUnder: false, showPercentOver: true }),
    ).toHaveLength(1);
  });
});
