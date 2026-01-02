import { prisma } from "@/lib/db";

import type { CommentRepository, CreateComparisonCommentData } from "../ports/commentRepository";

export class PrismaCommentRepository implements CommentRepository {
  async createComparisonComment(data: CreateComparisonCommentData) {
    await prisma.comparisonComment.create({
      data,
    });
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}
