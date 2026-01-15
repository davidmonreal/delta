import { describe, expect, it } from "vitest";

import { createComparisonComment } from "../createComparisonComment";
import type { CommentRepository } from "../../ports/commentRepository";

class InMemoryCommentRepository implements CommentRepository {
  created: unknown[] = [];

  async createComparisonComment(input: unknown) {
    this.created.push(input);
  }

  async findLatestByContext() {
    return null;
  }

  async findCommentedContexts() {
    return [];
  }
}

describe("createComparisonComment", () => {
  it("returns error for invalid session user id", async () => {
    const repo = new InMemoryCommentRepository();
    const result = await createComparisonComment({
      input: {
        clientId: 1,
        serviceId: 2,
        year: 2025,
        month: 1,
        kind: "REPORT_ERROR",
        message: "Error",
      },
      sessionUser: { id: "abc", role: "USER" },
      repo,
    });

    expect(result.error).toBe("Usuari invàlid.");
    expect(repo.created).toHaveLength(0);
  });

  it("creates a comparison comment", async () => {
    const repo = new InMemoryCommentRepository();
    const result = await createComparisonComment({
      input: {
        clientId: 1,
        serviceId: 2,
        year: 2025,
        month: 1,
        kind: "REPORT_ERROR",
        message: "Error",
      },
      sessionUser: { id: "10", role: "USER" },
      repo,
    });

    expect(result.success).toBe("Comentari registrat.");
    expect(repo.created).toHaveLength(1);
  });
});
