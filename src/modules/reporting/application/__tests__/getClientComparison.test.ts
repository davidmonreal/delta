import { describe, expect, it } from "vitest";

import { getClientComparison } from "../getClientComparison";
import { InMemoryReportingRepository } from "./testUtils";

const baseMonth = 1;
const year = 2024;
const previousYear = 2023;

function buildRepo() {
  return new InMemoryReportingRepository({
    latestEntryByClient: new Map([[1, { year, month: baseMonth }]]),
    clients: [{ id: 1, nameRaw: "Client A" }],
    services: [{ id: 10, conceptRaw: "Service A" }],
    clientLinesByClientIdForComparison: new Map([
      [
        1,
        [
          {
            serviceId: 10,
            year: previousYear,
            month: baseMonth,
            total: 50,
            units: 5,
            series: "A",
            albaran: null,
            numero: "1",
            managerUserId: null,
            managerName: null,
          },
          {
            serviceId: 10,
            year,
            month: baseMonth,
            total: 60,
            units: 5,
            series: "B",
            albaran: null,
            numero: "2",
            managerUserId: null,
            managerName: null,
          },
        ],
      ],
    ]),
  });
}

describe("getClientComparison", () => {
  it("returns notFound for invalid client id", async () => {
    const repo = buildRepo();
    const result = await getClientComparison({
      repo,
      rawFilters: {},
      rawClientId: "bad",
    });

    expect(result.notFound).toBe(true);
  });

  it("returns summaries for client", async () => {
    const repo = buildRepo();
    const result = await getClientComparison({
      repo,
      rawFilters: { show: "pos" },
      rawClientId: "1",
    });

    expect(result.notFound).toBe(false);
    if (result.notFound) return;
    expect(result.summaries).toHaveLength(1);
    expect(result.summaries[0].serviceName).toBe("Service A");
    expect(result.showCounts.pos).toBe(1);
  });

  it("keeps summaries even when show is negative", async () => {
    const repo = buildRepo();
    const result = await getClientComparison({
      repo,
      rawFilters: { show: "neg" },
      rawClientId: "1",
    });

    expect(result.notFound).toBe(false);
    if (result.notFound) return;
    expect(result.summaries).toHaveLength(1);
    expect(result.showCounts.neg).toBe(0);
  });
});
