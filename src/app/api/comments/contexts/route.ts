import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/require-auth";
import { PrismaCommentRepository } from "@/modules/comments/infrastructure/prismaCommentRepository";
import { getCommentedContexts } from "@/modules/comments/application/getCommentedContexts";

const payloadSchema = z.object({
  months: z.array(
    z.object({
      year: z.number().int(),
      month: z.number().int().min(1).max(12),
    }),
  ),
  clientIds: z.array(z.number().int()),
  serviceIds: z.array(z.number().int()),
});

export async function POST(request: Request) {
  const session = await requireSession();
  const payload = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { months, clientIds, serviceIds } = parsed.data;
  if (clientIds.length === 0 || serviceIds.length === 0 || months.length === 0) {
    return NextResponse.json({ keys: [] });
  }

  const repo = new PrismaCommentRepository();
  const { keys } = await getCommentedContexts({
    repo,
    sessionUser: session.user,
    months,
    clientIds,
    serviceIds,
  });
  await repo.disconnect?.();

  return NextResponse.json({ keys });
}
