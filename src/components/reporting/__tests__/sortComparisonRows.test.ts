import { describe, expect, it } from "vitest";

import type { ComparisonRowViewModel } from "@/modules/reporting/dto/reportingViewModel";
import { sortComparisonRows, toggleSort } from "@/components/reporting/sortComparisonRows";

const baseRows: ComparisonRowViewModel[] = [
  {
    id: "1",
    clientId: 1,
    serviceId: 10,
    title: "Beta",
    subtitle: "S1",
    href: "/",
    previousUnits: 1,
    currentUnits: 1,
    previousUnitPrice: 10,
    currentUnitPrice: 10,
    previousRef: null,
    currentRef: null,
    deltaPrice: -1,
    isMissing: false,
    percentDelta: 5,
  },
  {
    id: "2",
    clientId: 2,
    serviceId: 20,
    title: "Alpha",
    subtitle: "S2",
    href: "/",
    previousUnits: 1,
    currentUnits: 1,
    previousUnitPrice: 10,
    currentUnitPrice: 10,
    previousRef: null,
    currentRef: null,
    deltaPrice: Number.NaN,
    isMissing: false,
    percentDelta: undefined,
  },
  {
    id: "3",
    clientId: 3,
    serviceId: 30,
    title: "Alpha",
    subtitle: "S3",
    href: "/",
    previousUnits: 1,
    currentUnits: 1,
    previousUnitPrice: 10,
    currentUnitPrice: 10,
    previousRef: null,
    currentRef: null,
    deltaPrice: 2,
    isMissing: false,
    percentDelta: 12,
  },
];

describe("sortComparisonRows", () => {
  it("sorts by client name and keeps stable ordering for ties", () => {
    const result = sortComparisonRows(baseRows, { key: "client", direction: "asc" });
    expect(result.map((row) => row.id)).toEqual(["2", "3", "1"]);
  });

  it("sorts by delta price and keeps NaN values last", () => {
    const result = sortComparisonRows(baseRows, { key: "delta", direction: "desc" });
    expect(result.map((row) => row.id)).toEqual(["3", "1", "2"]);
  });

  it("sorts by percent delta and keeps missing values last", () => {
    const result = sortComparisonRows(baseRows, { key: "percent", direction: "desc" });
    expect(result.map((row) => row.id)).toEqual(["3", "1", "2"]);
  });
});

describe("toggleSort", () => {
  it("uses ascending by default for client and descending for metrics", () => {
    expect(toggleSort(null, "client")).toEqual({ key: "client", direction: "asc" });
    expect(toggleSort(null, "delta")).toEqual({ key: "delta", direction: "desc" });
    expect(toggleSort(null, "percent")).toEqual({ key: "percent", direction: "desc" });
  });

  it("toggles direction when clicking same key", () => {
    expect(toggleSort({ key: "client", direction: "asc" }, "client")).toEqual({
      key: "client",
      direction: "desc",
    });
  });
});
