import * as XLSX from "xlsx";

import { prisma } from "@/lib/db";
import { normalizeName } from "@/lib/normalize";
import { backfillManagers } from "@/modules/invoices/application/backfillManagers";
import { PrismaInvoiceRepository } from "@/modules/invoices/infrastructure/prismaInvoiceRepository";
import { importRowsWithSummary, type ImportRowError } from "@/modules/ingestion/application/importInvoiceLines";
import { buildHeaderMap, validateHeaders } from "@/modules/ingestion/domain/headerUtils";
import { PrismaIngestionRepository } from "@/modules/ingestion/infrastructure/prismaIngestionRepository";
import { PrismaUserRepository } from "@/modules/users/infrastructure/prismaUserRepository";

const BATCH_SIZE = 200;
const MAX_ERRORS = 50;

type UploadJobSummary = {
  fileName: string;
  imported: number;
  assigned: number;
  unmatched: number;
  skipped: number;
  backfilled: number;
  rowErrors?: ImportRowError[];
  headerErrors?: { missing: string[]; extra: string[] };
};

function buildUploadSourceFile(jobId: string, fileName: string) {
  const safeName = fileName.replace(/\s+/g, "_");
  return `upload-${jobId}__${safeName}`;
}

export async function processUploadJob(jobId: string) {
  const job = await prisma.uploadJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  if (!job.blobUrl) {
    await prisma.uploadJob.update({
      where: { id: jobId },
      data: { status: "error", errorMessage: "No s'ha trobat el fitxer pujat." },
    });
    return;
  }

  await prisma.uploadJob.update({
    where: { id: jobId },
    data: {
      status: "processing",
      progress: 0,
      processedRows: 0,
      totalRows: 0,
      errorMessage: null,
      summary: undefined,
    },
  });

  const ingestRepo = new PrismaIngestionRepository();
  const userRepo = new PrismaUserRepository();
  const invoiceRepo = new PrismaInvoiceRepository();

  try {
    const response = await fetch(job.blobUrl);
    if (!response.ok) {
      throw new Error("No s'ha pogut descarregar el fitxer.");
    }

    const buffer = await response.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error("No hem trobat cap full de calcul.");
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
    });
    if (rows.length === 0) {
      throw new Error("El fitxer no te dades.");
    }

    const headerMap = buildHeaderMap(rows[0]);
    const headerErrors = validateHeaders(headerMap);
    if (headerErrors.missing.length || headerErrors.extra.length) {
      await prisma.uploadJob.update({
        where: { id: jobId },
        data: {
          status: "error",
          errorMessage: "La capcalera del fitxer no coincideix amb el format esperat.",
          summary: {
            fileName: job.fileName,
            imported: 0,
            assigned: 0,
            unmatched: 0,
            skipped: 0,
            backfilled: 0,
            headerErrors,
          } satisfies UploadJobSummary,
        },
      });
      return;
    }

    const users = await userRepo.listAll();
    const userCandidates = users
      .filter((user) => user.name)
      .map((user) => ({
        id: user.id,
        nameNormalized: user.nameNormalized ?? normalizeName(user.name ?? ""),
      }));

    const totalRows = rows.length;
    await prisma.uploadJob.update({
      where: { id: jobId },
      data: { totalRows },
    });

    const sourceFile = buildUploadSourceFile(jobId, job.fileName);
    let summary: UploadJobSummary = {
      fileName: job.fileName,
      imported: 0,
      assigned: 0,
      unmatched: 0,
      skipped: 0,
      backfilled: 0,
    };
    let rowErrors: ImportRowError[] = [];

    const startOffset = Math.min(job.processedRows ?? 0, totalRows);
    if (startOffset >= totalRows) {
      await prisma.uploadJob.update({
        where: { id: jobId },
        data: {
          status: "done",
          progress: 100,
          processedRows: totalRows,
          summary,
        },
      });
      return;
    }

    for (let offset = startOffset; offset < rows.length; offset += BATCH_SIZE) {
      const jobCheck = await prisma.uploadJob.findUnique({
        where: { id: jobId },
        select: { status: true },
      });
      if (jobCheck?.status === "error") {
        return;
      }

      const batch = rows.slice(offset, offset + BATCH_SIZE);
      const result = await importRowsWithSummary({
        rows: batch,
        sourceFile,
        reset: false,
        repo: ingestRepo,
        userCandidates,
        strict: true,
      });

      summary = {
        ...summary,
        imported: summary.imported + result.imported,
        assigned: summary.assigned + result.assigned,
        unmatched: summary.unmatched + result.unmatched,
        skipped: summary.skipped + result.skipped,
      };

      const adjustedErrors =
        result.errors?.map((error) => ({
          ...error,
          row: error.row + offset,
        })) ?? [];
      rowErrors = [...rowErrors, ...adjustedErrors].slice(0, MAX_ERRORS);

      const processedRows = Math.min(totalRows, offset + batch.length);
      const progress = totalRows
        ? Math.min(100, Math.round((processedRows / totalRows) * 100))
        : 0;

      await prisma.uploadJob.update({
        where: { id: jobId },
        data: {
          processedRows,
          progress,
        },
      });
    }

    await prisma.uploadJob.update({
      where: { id: jobId },
      data: { status: "finalizing" },
    });

    const assignedByName = await backfillManagers({
      repo: invoiceRepo,
      userCandidates,
    });
    summary.assigned += assignedByName;
    summary.unmatched = Math.max(0, summary.imported - summary.assigned);
    summary.backfilled = assignedByName;
    summary.rowErrors = rowErrors;

    await prisma.uploadJob.update({
      where: { id: jobId },
      data: {
        status: "done",
        progress: 100,
        processedRows: totalRows,
        summary,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No s'ha pogut processar el fitxer.";
    await prisma.uploadJob.update({
      where: { id: jobId },
      data: { status: "error", errorMessage: message },
    });
  } finally {
    await ingestRepo.disconnect?.();
    await userRepo.disconnect?.();
    await invoiceRepo.disconnect?.();
  }
}
