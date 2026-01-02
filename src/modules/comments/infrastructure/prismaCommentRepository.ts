import { prisma } from "@/lib/db";

import type {
  CommentRepository,
  ComparisonCommentSummary,
  CreateComparisonCommentData,
} from "../ports/commentRepository";

export class PrismaCommentRepository implements CommentRepository {
  async createComparisonComment(data: CreateComparisonCommentData) {
    await prisma.comparisonComment.create({
      data,
    });
  }

  async findLatestByContext({
    userId,
    clientId,
    serviceId,
    year,
    month,
  }: {
    userId: number;
    clientId: number;
    serviceId: number;
    year: number;
    month: number;
  }): Promise<ComparisonCommentSummary | null> {
    const comment = await prisma.comparisonComment.findFirst({
      where: { userId, clientId, serviceId, year, month },
      orderBy: { createdAt: "desc" },
      select: { kind: true, message: true, createdAt: true },
    });
    return comment ?? null;
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}
