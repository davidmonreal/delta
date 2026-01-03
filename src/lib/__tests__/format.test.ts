import { describe, expect, it } from "vitest";

import { formatCurrency, formatPercent, formatUnits } from "../format";

describe("formatters", () => {
  it("formats numbers and handles invalid values", () => {
    expect(formatCurrency(12.5)).toBe("12,50\u00a0\u20ac");
    expect(formatUnits(1.234)).toBe("1,23");
    expect(formatPercent(12.5)).toBe("12,5\u00a0%");
    expect(formatCurrency(Number.NaN)).toBe("-");
    expect(formatUnits(Number.POSITIVE_INFINITY)).toBe("-");
    expect(formatPercent(Number.NaN)).toBe("-");
  });
});
