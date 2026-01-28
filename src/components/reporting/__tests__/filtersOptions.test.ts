import { describe, expect, it } from "vitest";

import {
  buildMonthOptions,
  buildQuarterOptions,
  filterOptionsByValue,
  sortMonthsDesc,
} from "@/components/reporting/filtersOptions";

describe("filtersOptions", () => {
  it("sorts months in descending order", () => {
    const months = [
      { year: 2024, month: 1 },
      { year: 2025, month: 3 },
      { year: 2025, month: 1 },
      { year: 2024, month: 12 },
    ];

    expect(sortMonthsDesc(months)).toEqual([
      { year: 2025, month: 3 },
      { year: 2025, month: 1 },
      { year: 2024, month: 12 },
      { year: 2024, month: 1 },
    ]);
  });

  it("builds formatted month options", () => {
    const options = buildMonthOptions([{ year: 2024, month: 2 }]);

    expect(options).toEqual([
      { value: "2024-02", label: "02/2024", year: 2024, month: 2 },
    ]);
  });

  it("builds unique quarters with boundaries", () => {
    const months = sortMonthsDesc([
      { year: 2024, month: 5 },
      { year: 2024, month: 4 },
      { year: 2024, month: 2 },
      { year: 2023, month: 12 },
    ]);

    const quarters = buildQuarterOptions(months);

    expect(quarters).toEqual([
      {
        value: "2024-Q2",
        label: "Q2 2024",
        year: 2024,
        quarter: 2,
        startMonth: 4,
        endMonth: 6,
      },
      {
        value: "2024-Q1",
        label: "Q1 2024",
        year: 2024,
        quarter: 1,
        startMonth: 1,
        endMonth: 3,
      },
      {
        value: "2023-Q4",
        label: "Q4 2023",
        year: 2023,
        quarter: 4,
        startMonth: 10,
        endMonth: 12,
      },
    ]);
  });

  it("filters out the selected option for the comparison dropdown", () => {
    const options = [
      { value: "2024-01", label: "01/2024" },
      { value: "2024-02", label: "02/2024" },
      { value: "2024-03", label: "03/2024" },
    ];

    expect(filterOptionsByValue(options, "2024-02")).toEqual([
      { value: "2024-01", label: "01/2024" },
      { value: "2024-03", label: "03/2024" },
    ]);
  });
});
