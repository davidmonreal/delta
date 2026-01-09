import { NextResponse, type NextRequest } from "next/server";
import { waitUntil } from "@vercel/functions";

import { prisma } from "@/lib/db";
import { requireAdminSessionApi } from "@/lib/require-auth";
import { processUploadJob } from "@/modules/ingestion/application/processUploadJob";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await requireAdminSessionApi();
  if (!session) {
    return NextResponse.json({ error: "No autoritzat." }, { status: 401 });
  }
  const userId = Number.parseInt(session.user.id, 10);
  const { jobId } = await params;
  const job = await prisma.uploadJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    return NextResponse.json({ error: "No s'ha trobat la càrrega." }, { status: 404 });
  }
  if (job.userId && !Number.isNaN(userId) && job.userId !== userId) {
    return NextResponse.json({ error: "No s'ha trobat la càrrega." }, { status: 404 });
  }

  if (
    (job.status === "pending" || job.status === "uploading") &&
    !job.blobUrl &&
    Date.now() - job.updatedAt.getTime() > 10 * 60 * 1000
  ) {
    const updated = await prisma.uploadJob.update({
      where: { id: jobId },
      data: {
        status: "error",
        errorMessage: "La càrrega ha expirat. Torna-ho a intentar.",
      },
    });
    return NextResponse.json({
      job: {
        id: updated.id,
        fileName: updated.fileName,
        status: updated.status,
        progress: updated.progress,
        processedRows: updated.processedRows,
        totalRows: updated.totalRows,
        summary: updated.summary,
        errorMessage: updated.errorMessage,
        blobUrl: updated.blobUrl,
        updatedAt: updated.updatedAt,
        createdAt: updated.createdAt,
      },
    });
  }

  if (
    job.status === "processing" &&
    job.blobUrl &&
    Date.now() - job.updatedAt.getTime() > 2 * 60 * 1000
  ) {
    const updated = await prisma.uploadJob.update({
      where: { id: jobId },
      data: { status: "retrying", errorMessage: null },
    });
    waitUntil(processUploadJob(jobId));
    return NextResponse.json({
      job: {
        id: updated.id,
        fileName: updated.fileName,
        status: updated.status,
        progress: updated.progress,
        processedRows: updated.processedRows,
        totalRows: updated.totalRows,
        summary: updated.summary,
        errorMessage: updated.errorMessage,
        blobUrl: updated.blobUrl,
        updatedAt: updated.updatedAt,
        createdAt: updated.createdAt,
      },
    });
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
