import { describe, expect, it } from "vitest";

import { buildUserCandidates } from "../buildUserCandidates";
import type { UserEntity } from "../../domain/user";

describe("buildUserCandidates", () => {
  it("uses normalized name when available", () => {
    const users: UserEntity[] = [
      {
        id: 1,
        email: "a@example.com",
        name: "Oriol Moya",
        nameNormalized: "ORIOL MOYA",
        role: "ADMIN",
        createdAt: new Date(),
        passwordHash: "hashed",
      },
    ];

    const result = buildUserCandidates(users);
    expect(result).toEqual([{ id: 1, nameNormalized: "ORIOL MOYA" }]);
  });

  it("skips users without a name", () => {
    const users: UserEntity[] = [
      {
        id: 2,
        email: "b@example.com",
        name: null,
        nameNormalized: null,
        role: "USER",
        createdAt: new Date(),
        passwordHash: "hashed",
      },
    ];

    const result = buildUserCandidates(users);
    expect(result).toEqual([]);
  });
});
