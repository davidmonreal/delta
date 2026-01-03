import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  requireSession: vi.fn().mockResolvedValue({
    user: { id: "1", role: "USER" },
  }),
  getLatestComparisonComment: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock("@/lib/require-auth", () => ({ requireSession: mocks.requireSession }));
vi.mock("@/modules/comments/application/getLatestComparisonComment", () => ({
  getLatestComparisonComment: mocks.getLatestComparisonComment,
}));
vi.mock("@/modules/comments/infrastructure/prismaCommentRepository", () => ({
  PrismaCommentRepository: class {
    disconnect = mocks.disconnect;
  },
}));

import { POST } from "./route";

describe("comments latest route", () => {
  beforeEach(() => {
    mocks.getLatestComparisonComment.mockReset();
  });

  it("returns null comment for invalid payload", async () => {
    const request = new Request("http://localhost/api/comments/latest", {
      method: "POST",
      body: JSON.stringify({ clientId: "bad" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(body).toEqual({ comment: null });
    expect(mocks.getLatestComparisonComment).not.toHaveBeenCalled();
  });

  it("returns comment when available", async () => {
    const createdAt = new Date("2025-01-01T00:00:00.000Z");
    mocks.getLatestComparisonComment.mockResolvedValue({
      comment: {
        kind: "REPORT_ERROR",
        message: "Test",
        createdAt,
      },
    });

    const request = new Request("http://localhost/api/comments/latest", {
      method: "POST",
      body: JSON.stringify({
        clientId: 1,
        serviceId: 2,
        year: 2025,
        month: 1,
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(body).toEqual({
      comment: {
        kind: "REPORT_ERROR",
        message: "Test",
        createdAt: createdAt.toISOString(),
      },
    });
  });

  it("returns null when use case fails", async () => {
    mocks.getLatestComparisonComment.mockResolvedValue({ error: "no" });

    const request = new Request("http://localhost/api/comments/latest", {
      method: "POST",
      body: JSON.stringify({
        clientId: 1,
        serviceId: 2,
        year: 2025,
        month: 1,
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(body).toEqual({ comment: null });
  });
});
