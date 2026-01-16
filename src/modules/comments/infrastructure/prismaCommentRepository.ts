import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import {
  resolveCommentVisibilityRule,
  type CommentViewer,
} from "../domain/commentVisibilityPolicy";

import type {
  CommentRepository,
  ComparisonCommentSummary,
  CommentContextKey,
  CreateComparisonCommentData,
} from "../ports/commentRepository";

export class PrismaCommentRepository implements CommentRepository {
  private buildVisibilityFilter(
    viewer: CommentViewer,
  ): Prisma.ComparisonCommentWhereInput {
    const rule = resolveCommentVisibilityRule(viewer);
    if (rule.type === "all") {
      return {};
    }
    return {
      OR: [{ userId: rule.userId }, { user: { role: { in: rule.roles } } }],
    };
  }

  async createComparisonComment(data: CreateComparisonCommentData) {
    await prisma.comparisonComment.create({
      data,
    });
  }

  async findLatestByContext({
    viewer,
    clientId,
    serviceId,
    year,
    month,
  }: {
    viewer: CommentViewer;
    clientId: number;
    serviceId: number;
    year: number;
    month: number;
  }): Promise<ComparisonCommentSummary | null> {
    const visibilityFilter = this.buildVisibilityFilter(viewer);
    const comment = await prisma.comparisonComment.findFirst({
      where: { clientId, serviceId, year, month, ...visibilityFilter },
      orderBy: { createdAt: "desc" },
      select: { kind: true, message: true, createdAt: true },
    });
    return comment ?? null;
  }

  async findCommentedContexts({
    viewer,
    year,
    month,
    clientIds,
    serviceIds,
  }: {
    viewer: CommentViewer;
    year: number;
    month: number;
    clientIds: number[];
    serviceIds: number[];
  }): Promise<CommentContextKey[]> {
    if (clientIds.length === 0 || serviceIds.length === 0) return [];
    const visibilityFilter = this.buildVisibilityFilter(viewer);
    const rows = await prisma.comparisonComment.findMany({
      where: {
        year,
        month,
        clientId: { in: clientIds },
        serviceId: { in: serviceIds },
        ...visibilityFilter,
      },
      distinct: ["clientId", "serviceId"],
      select: { clientId: true, serviceId: true },
    });
    return rows;
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}
