import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";

import { prisma } from "@/lib/db";
import { processUploadJob } from "@/modules/ingestion/application/processUploadJob";

type ClientPayload = {
  jobId?: string;
};

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Falta la variable BLOB_READ_WRITE_TOKEN a l'entorn." },
      { status: 500 },
    );
  }

  const body = await request.json();

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const payload = clientPayload ? (JSON.parse(clientPayload) as ClientPayload) : {};
        const jobId = payload.jobId;
        if (!jobId) {
          throw new Error("Falta l'identificador de la carrega.");
        }

        const job = await prisma.uploadJob.findUnique({ where: { id: jobId } });
        if (!job) {
          throw new Error("No s'ha trobat la carrega.");
        }

        await prisma.uploadJob.update({
          where: { id: jobId },
          data: { status: "uploading" },
        });

        return {
          tokenPayload: jobId,
          addRandomSuffix: false,
          allowOverwrite: false,
          maximumSizeInBytes: 200 * 1024 * 1024,
          allowedContentTypes: [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            "text/csv",
          ],
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const jobId = tokenPayload ?? null;
        if (!jobId) return;

        await prisma.uploadJob.update({
          where: { id: jobId },
          data: {
            blobUrl: blob.url,
            status: "processing",
          },
        });

        void processUploadJob(jobId).catch(() => {});
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No s'ha pogut iniciar la carrega.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
