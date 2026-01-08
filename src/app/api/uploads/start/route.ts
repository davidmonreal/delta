import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireAdminSessionApi } from "@/lib/require-auth";

const StartSchema = z.object({
  fileName: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await requireAdminSessionApi();
  if (!session) {
    return NextResponse.json({ error: "No autoritzat." }, { status: 401 });
  }
  const payload = StartSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Nom del fitxer invalid." }, { status: 400 });
  }
  const userId = Number.parseInt(session.user.id, 10);

  const job = await prisma.uploadJob.create({
    data: {
      fileName: payload.data.fileName,
      userId: Number.isNaN(userId) ? undefined : userId,
      status: "pending",
      progress: 0,
      processedRows: 0,
      totalRows: 0,
    },
  });

  return NextResponse.json({ jobId: job.id });
}
