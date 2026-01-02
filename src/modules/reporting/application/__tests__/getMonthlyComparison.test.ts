import { describe, expect, it } from "vitest";

import { getMonthlyComparison } from "../getMonthlyComparison";
import { InMemoryReportingRepository } from "./testUtils";

const baseMonth = 1;
const year = 2024;
const previousYear = 2023;

function buildRepo() {
  return new InMemoryReportingRepository({
    latestEntry: { year, month: baseMonth },
    monthlyGroups: [
      {
        clientId: 1,
        serviceId: 10,
        year: previousYear,
        month: baseMonth,
        total: 100,
        units: 10,
      },
      {
        clientId: 1,
        serviceId: 10,
        year,
        month: baseMonth,
        total: 90,
        units: 10,
      },
    ],
    monthlyRefs: [
      {
        clientId: 1,
        serviceId: 10,
        year: previousYear,
        month: baseMonth,
        series: "A",
        albaran: null,
        numero: "1",
      },
    ],
    clients: [{ id: 1, nameRaw: "Client A" }],
    services: [{ id: 10, conceptRaw: "Service A" }],
  });
}

describe("getMonthlyComparison", () => {
  it("filters by negative deltas by default", async () => {
    const repo = buildRepo();
    const result = await getMonthlyComparison({ repo, rawFilters: {} });

    expect(result.summaries).toHaveLength(1);
    expect(result.visibleRows).toHaveLength(1);
    expect(result.filters.showNegative).toBe(true);
  });

  it("returns empty for positive filter when delta is negative", async () => {
    const repo = buildRepo();
    const result = await getMonthlyComparison({
      repo,
      rawFilters: { show: "pos" },
    });

    expect(result.summaries).toHaveLength(0);
  });

  it("marks missing when current units are zero", async () => {
    const repo = new InMemoryReportingRepository({
      latestEntry: { year, month: baseMonth },
      monthlyGroups: [
        {
          clientId: 2,
          serviceId: 20,
          year: previousYear,
          month: baseMonth,
          total: 120,
          units: 10,
        },
        {
          clientId: 2,
          serviceId: 20,
          year,
          month: baseMonth,
          total: 0,
          units: 0,
        },
      ],
      clients: [{ id: 2, nameRaw: "Client B" }],
      services: [{ id: 20, conceptRaw: "Service B" }],
    });

    const result = await getMonthlyComparison({ repo, rawFilters: {} });
    expect(result.negativeMissing).toHaveLength(1);
    expect(result.negativeMissing[0].isMissing).toBe(true);
  });
});
