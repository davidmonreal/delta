import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/require-auth";
import { PrismaCommentRepository } from "@/modules/comments/infrastructure/prismaCommentRepository";
import { getLatestComparisonComment } from "@/modules/comments/application/getLatestComparisonComment";

const PayloadSchema = z.object({
  clientId: z.number().int().positive(),
  serviceId: z.number().int().positive(),
  year: z.number().int().positive(),
  month: z.number().int().min(1).max(12),
});

export async function POST(request: Request) {
  const session = await requireSession();
  const body = await request.json().catch(() => null);
  const parsed = PayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ comment: null });
  }

  const repo = new PrismaCommentRepository();
  const result = await getLatestComparisonComment({
    repo,
    sessionUser: { id: session.user.id, role: session.user.role },
    ...parsed.data,
  });
  await repo.disconnect?.();

  if (result.error) {
    return NextResponse.json({ comment: null });
  }

  return NextResponse.json({
    comment: result.comment
      ? {
          kind: result.comment.kind,
          message: result.comment.message,
          createdAt: result.comment.createdAt.toISOString(),
        }
      : null,
  });
}
