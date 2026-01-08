import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-auth";

type RouteContext = {
  params: { jobId: string };
};

export async function GET(_request: Request, context: RouteContext) {
  await requireAdminSession();
  const job = await prisma.uploadJob.findUnique({
    where: { id: context.params.jobId },
  });

  if (!job) {
    return NextResponse.json({ error: "No s'ha trobat la carrega." }, { status: 404 });
  }

  return NextResponse.json({
    job: {
      id: job.id,
      fileName: job.fileName,
      status: job.status,
      progress: job.progress,
      processedRows: job.processedRows,
      totalRows: job.totalRows,
      summary: job.summary,
      errorMessage: job.errorMessage,
      blobUrl: job.blobUrl,
      updatedAt: job.updatedAt,
      createdAt: job.createdAt,
    },
  });
}
