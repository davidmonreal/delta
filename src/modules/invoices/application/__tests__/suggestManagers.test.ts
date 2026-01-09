import { describe, expect, it } from "vitest";

import { suggestManagers } from "../suggestManagers";

describe("suggestManagers", () => {
  it("fills suggestedUserId when manager matches a user", () => {
    const result = suggestManagers({
      lines: [
        {
          id: 1,
          date: new Date("2025-01-01"),
          manager: "Oriol Moya",
          managerNormalized: null,
          clientId: 1,
          clientName: "Client A",
          serviceName: "Service A",
          total: 10,
          suggestedUserId: null,
          recentManagerName: null,
        },
      ],
      userCandidates: [{ id: 9, nameNormalized: "ORIOL MOYA" }],
    });

    expect(result[0].suggestedUserId).toBe(9);
  });

  it("keeps existing suggestions", () => {
    const result = suggestManagers({
      lines: [
        {
          id: 1,
          date: new Date("2025-01-01"),
          manager: "Oriol Moya",
          managerNormalized: null,
          clientId: 1,
          clientName: "Client A",
          serviceName: "Service A",
          total: 10,
          suggestedUserId: 3,
          recentManagerName: "Oriol Moya",
        },
      ],
      userCandidates: [{ id: 9, nameNormalized: "ORIOL MOYA" }],
    });

    expect(result[0].suggestedUserId).toBe(3);
  });

  it("uses recent manager name when available", () => {
    const result = suggestManagers({
      lines: [
        {
          id: 2,
          date: new Date("2025-01-01"),
          manager: "CLIENT NAME",
          managerNormalized: null,
          clientId: 2,
          clientName: "Client B",
          serviceName: "Service B",
          total: 20,
          suggestedUserId: null,
          recentManagerName: "Yolanda Fariñas",
        },
      ],
      userCandidates: [{ id: 7, nameNormalized: "YOLANDA FARINAS" }],
    });

    expect(result[0].suggestedUserId).toBe(7);
  });
});
