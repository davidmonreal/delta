import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireAdminSessionApi } from "@/lib/require-auth";

export async function GET() {
  const session = await requireAdminSessionApi();
  if (!session) {
    return NextResponse.json({ error: "No autoritzat." }, { status: 401 });
  }
  const userId = Number.parseInt(session.user.id, 10);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ job: null });
  }

  const job = await prisma.uploadJob.findFirst({
    where: {
      userId,
      status: { in: ["pending", "uploading", "processing", "finalizing"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!job) {
    return NextResponse.json({ job: null });
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
