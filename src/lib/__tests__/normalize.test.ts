import { describe, expect, it } from "vitest";

import { normalizeName } from "../normalize";

describe("normalizeName", () => {
  it("strips accents, punctuation, and extra spaces", () => {
    const value = "  José-Luís 123!! ";
    expect(normalizeName(value)).toBe("JOSE LUIS 123");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(normalizeName("   ")).toBe("");
  });
});
