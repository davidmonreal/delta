import { describe, expect, it } from "vitest";

import { pairLines } from "../pairLines";

describe("pairLines", () => {
  it("pairs lines by unit price within tolerance", () => {
    const previous = [{ units: 10, total: 100 }, { units: 2, total: 40 }];
    const current = [{ units: 5, total: 50 }, { units: 2, total: 40.2 }];

    const result = pairLines({
      previous,
      current,
      metric: "unit",
      tolerance: 0.2,
    });

    expect(result.matches).toHaveLength(2);
    expect(result.unmatchedPrevious).toHaveLength(0);
    expect(result.unmatchedCurrent).toHaveLength(0);
  });

  it("keeps rows with invalid metrics as unmatched", () => {
    const previous = [{ units: 0, total: 100 }];
    const current = [{ units: 10, total: 100 }];

    const result = pairLines({
      previous,
      current,
      metric: "unit",
      tolerance: 0.01,
    });

    expect(result.matches).toHaveLength(0);
    expect(result.unmatchedPrevious).toHaveLength(1);
    expect(result.unmatchedCurrent).toHaveLength(1);
  });
});
