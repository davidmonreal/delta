import { describe, expect, it } from "vitest";

import { formatRef } from "../formatRef";

describe("formatRef", () => {
  it("returns combined series and number when different", () => {
    expect(formatRef("A", null, "1")).toBe("A-1");
  });

  it("returns single part when only one exists", () => {
    expect(formatRef(null, null, "2")).toBe("2");
    expect(formatRef("B", null, null)).toBe("B");
  });

  it("returns null when there is no data", () => {
    expect(formatRef(null, null, null)).toBeNull();
  });
});
