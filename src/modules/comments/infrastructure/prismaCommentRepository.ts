import { prisma } from "@/lib/db";
import { isAdminRole } from "@/modules/users/domain/rolePolicies";
import { Prisma, type UserRole } from "@/generated/prisma";

import type {
  CommentRepository,
  ComparisonCommentSummary,
  CommentContextKey,
  CreateComparisonCommentData,
} from "../ports/commentRepository";

export class PrismaCommentRepository implements CommentRepository {
  private buildVisibilityFilter(
    viewer: { userId: number; role: UserRole },
  ): Prisma.ComparisonCommentWhereInput {
    if (isAdminRole(viewer.role)) {
      return {};
    }
    return {
      OR: [{ userId: viewer.userId }, { user: { role: "SUPERADMIN" } }],
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
    viewer: { userId: number; role: UserRole };
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
    viewer: { userId: number; role: UserRole };
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
