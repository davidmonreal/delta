import { describe, expect, it } from "vitest";

import { getMonthlyComparison } from "../getMonthlyComparison";
import { InMemoryReportingRepository } from "./testUtils";
import type { LinkedServiceRepository } from "@/modules/linkedServices/ports/linkedServiceRepository";

class InMemoryLinkedServiceRepository implements LinkedServiceRepository {
  constructor(
    private links: Array<{
      id: number;
      serviceId: number;
      linkedServiceId: number;
      offsetMonths: number;
    }>,
  ) {}

  async listServices() {
    return [];
  }

  async listLinks() {
    return this.links;
  }

  async findLink() {
    return null;
  }

  async createLink() {
    return {
      id: 0,
      serviceId: 0,
      linkedServiceId: 0,
      offsetMonths: 0,
    };
  }

  async deleteLink() {
    return;
  }
}

const baseMonth = 1;
const year = 2024;
const previousYear = 2023;

function buildRepo() {
  return new InMemoryReportingRepository({
    latestEntry: { year, month: baseMonth },
    monthlyLines: [
      {
        clientId: 1,
        serviceId: 10,
        year: previousYear,
        month: baseMonth,
        total: 100,
        units: 10,
        series: "A",
        albaran: null,
        numero: "1",
        managerUserId: null,
        managerName: null,
      },
      {
        clientId: 1,
        serviceId: 10,
        year,
        month: baseMonth,
        total: 90,
        units: 10,
        series: "B",
        albaran: null,
        numero: "2",
        managerUserId: null,
        managerName: null,
      },
    ],
    clients: [{ id: 1, nameRaw: "Client A" }],
    services: [{ id: 10, conceptRaw: "Service A" }],
  });
}

describe("getMonthlyComparison", () => {
  it("returns summaries regardless of show filter", async () => {
    const repo = buildRepo();
    const result = await getMonthlyComparison({
      repo,
      rawFilters: { show: "pos" },
    });

    expect(result.summaries).toHaveLength(1);
  });

  it("tracks show counts for positive filters", async () => {
    const repo = buildRepo();
    const result = await getMonthlyComparison({
      repo,
      rawFilters: { show: "pos" },
    });

    expect(result.showCounts.pos).toBe(0);
  });

  it("marks missing when current units are zero", async () => {
    const repo = new InMemoryReportingRepository({
      latestEntry: { year, month: baseMonth },
      monthlyLines: [
        {
          clientId: 2,
          serviceId: 20,
          year: previousYear,
          month: baseMonth,
          total: 120,
          units: 10,
          series: "A",
          albaran: null,
          numero: "1",
          managerUserId: null,
          managerName: null,
        },
        {
          clientId: 2,
          serviceId: 20,
          year,
          month: baseMonth,
          total: 0,
          units: 0,
          series: "B",
          albaran: null,
          numero: "2",
          managerUserId: null,
          managerName: null,
        },
      ],
      clients: [{ id: 2, nameRaw: "Client B" }],
      services: [{ id: 20, conceptRaw: "Service B" }],
    });

    const result = await getMonthlyComparison({
      repo,
      rawFilters: { show: "miss" },
    });
    expect(result.summaries).toHaveLength(1);
    expect(result.summaries[0].isMissing).toBe(true);
    expect(result.showCounts.miss).toBe(1);
  });

  it("flags missing when a linked service was present 3 months ago", async () => {
    const repo = new InMemoryReportingRepository({
      latestEntry: { year: 2025, month: 6 },
      monthlyLines: [
        {
          clientId: 1,
          serviceId: 10,
          year: 2025,
          month: 3,
          total: 100,
          units: 1,
          series: "A",
          albaran: null,
          numero: "1",
          managerUserId: null,
          managerName: null,
        },
      ],
      clients: [{ id: 1, nameRaw: "Client A" }],
      services: [
        { id: 10, conceptRaw: "Servei base" },
        { id: 20, conceptRaw: "Servei vinculat" },
      ],
    });
    const linkedServiceRepo = new InMemoryLinkedServiceRepository([
      { id: 1, serviceId: 10, linkedServiceId: 20, offsetMonths: 3 },
    ]);

    const result = await getMonthlyComparison({
      repo,
      linkedServiceRepo,
      viewerRole: "SUPERADMIN",
      rawFilters: { year: "2025", month: "6", show: "miss" },
    });

    const missing = result.summaries.find(
      (row) => row.clientId === 1 && row.serviceId === 20,
    );
    expect(missing?.isMissing).toBe(true);
    expect(missing?.missingReason).toContain("3 mesos");
  });
});
