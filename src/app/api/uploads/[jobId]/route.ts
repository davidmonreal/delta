import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/require-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  await requireAdminSession();
  const { jobId } = await params;
  const job = await prisma.uploadJob.findUnique({
    where: { id: jobId },
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
