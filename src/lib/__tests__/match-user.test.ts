import { describe, expect, it } from "vitest";

import { matchUserId } from "../match-user";

const candidates = [
  { id: 1, nameNormalized: "TONI NAVARRETE" },
  { id: 2, nameNormalized: "ANNA GARCIA" },
];

describe("matchUserId", () => {
  it("returns exact match when normalized names align", () => {
    const result = matchUserId("Toni Navarrete", candidates);
    expect(result).toEqual({ userId: 1, matchedBy: "exact" });
  });

  it("returns fuzzy match when similarity is high", () => {
    const result = matchUserId("Toni Navarreta", candidates);
    expect(result.userId).toBe(1);
    expect(result.matchedBy).toBe("fuzzy");
  });

  it("returns none when match is ambiguous", () => {
    const ambiguous = [
      { id: 1, nameNormalized: "MARIA LOPEZ" },
      { id: 2, nameNormalized: "MARIA LOPES" },
    ];
    const result = matchUserId("Maria Lopex", ambiguous);
    expect(result).toEqual({ userId: null, matchedBy: "none" });
  });

  it("returns none when similarity is too low", () => {
    const result = matchUserId("X Y", candidates);
    expect(result).toEqual({ userId: null, matchedBy: "none" });
  });
});
