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

  it("returns none when there is no exact match", () => {
    const result = matchUserId("X Y", candidates);
    expect(result).toEqual({ userId: null, matchedBy: "none" });
  });
});
