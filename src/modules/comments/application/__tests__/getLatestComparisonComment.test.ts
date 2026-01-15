import { describe, expect, it } from "vitest";

import { getLatestComparisonComment } from "../getLatestComparisonComment";
import type { CommentRepository, ComparisonCommentSummary } from "../../ports/commentRepository";

class InMemoryCommentRepository implements CommentRepository {
  async createComparisonComment() {
    return;
  }

  async findLatestByContext(): Promise<ComparisonCommentSummary | null> {
    return {
      kind: "REPORT_ERROR",
      message: "Exemple",
      createdAt: new Date(),
    };
  }

  async findCommentedContexts() {
    return [];
  }
}

describe("getLatestComparisonComment", () => {
  it("returns the latest comment for the user", async () => {
    const repo = new InMemoryCommentRepository();
    const result = await getLatestComparisonComment({
      repo,
      sessionUser: { id: "1", role: "USER" },
      clientId: 10,
      serviceId: 20,
      year: 2025,
      month: 1,
    });

    expect(result.comment?.message).toBe("Exemple");
  });
});
