import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-auth";
import { processUploadJob } from "@/modules/ingestion/application/processUploadJob";

const CompleteSchema = z.object({
  jobId: z.string().min(1),
  blobUrl: z.string().url(),
});

export async function POST(request: Request) {
  await requireAdminSession();
  const payload = CompleteSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Dades de carrega invalides." }, { status: 400 });
  }

  const { jobId, blobUrl } = payload.data;
  const job = await prisma.uploadJob.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json({ error: "No s'ha trobat la carrega." }, { status: 404 });
  }

  if (job.status === "processing" || job.status === "done") {
    return NextResponse.json({ ok: true });
  }

  await prisma.uploadJob.update({
    where: { id: jobId },
    data: { blobUrl, status: "processing" },
  });

  void processUploadJob(jobId).catch(() => {});

  return NextResponse.json({ ok: true });
}
