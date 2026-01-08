"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdminSession } from "@/lib/require-auth";
import { normalizeName } from "@/lib/normalize";
import { assignManager } from "@/modules/invoices/application/assignManager";
import { backfillManagers } from "@/modules/invoices/application/backfillManagers";
import { importRowsWithSummary, type ImportRowError } from "@/modules/ingestion/application/importInvoiceLines";
import { buildHeaderMap, validateHeaders } from "@/modules/ingestion/domain/headerUtils";
import { PrismaIngestionRepository } from "@/modules/ingestion/infrastructure/prismaIngestionRepository";
import { PrismaInvoiceRepository } from "@/modules/invoices/infrastructure/prismaInvoiceRepository";
import { PrismaUserRepository } from "@/modules/users/infrastructure/prismaUserRepository";

const AssignSchema = z.object({
  lineId: z.coerce.number().int().positive(),
  userId: z.coerce.number().int().positive(),
});

export type UploadActionState = {
  error?: string;
  headerErrors?: { missing: string[]; extra: string[] };
  rowErrors?: ImportRowError[];
  summary?: {
    fileName: string;
    imported: number;
    assigned: number;
    unmatched: number;
    skipped: number;
    backfilled: number;
  };
};

export type UploadBatchResult = {
  error?: string;
  headerErrors?: { missing: string[]; extra: string[] };
  rowErrors?: ImportRowError[];
  summary?: {
    imported: number;
    assigned: number;
    unmatched: number;
    skipped: number;
  };
};

function buildUploadSourceFile(fileName: string) {
  const timestamp = String(Date.now());
  const safeName = fileName.replace(/\s+/g, "_");
  return `upload-${timestamp}__${safeName}`;
}

export async function assignManagerAction(formData: FormData): Promise<void> {
  await requireAdminSession();
  const parsed = AssignSchema.safeParse({
    lineId: formData.get("lineId"),
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return;
  }

  const repo = new PrismaInvoiceRepository();
  await assignManager({
    repo,
    lineId: parsed.data.lineId,
    userId: parsed.data.userId,
  });

  revalidatePath("/admin/upload");
}

export async function startUploadAction(fileName: string): Promise<{ sourceFile: string }> {
  await requireAdminSession();
  return { sourceFile: buildUploadSourceFile(fileName) };
}

export async function uploadBatchAction(params: {
  rows: Record<string, unknown>[];
  sourceFile: string;
  validateHeader?: boolean;
}): Promise<UploadBatchResult> {
  await requireAdminSession();
  const { rows, sourceFile, validateHeader = false } = params;

  if (rows.length === 0) {
    return {
      summary: { imported: 0, assigned: 0, unmatched: 0, skipped: 0 },
      rowErrors: [],
    };
  }

  if (validateHeader) {
    const headerMap = buildHeaderMap(rows[0]);
    const headerErrors = validateHeaders(headerMap);
    if (headerErrors.missing.length || headerErrors.extra.length) {
      return {
        error: "La capcalera del fitxer no coincideix amb el format esperat.",
        headerErrors,
      };
    }
  }

  const ingestRepo = new PrismaIngestionRepository();
  const userRepo = new PrismaUserRepository();

  try {
    const users = await userRepo.listAll();
    const userCandidates = users
      .filter((user) => user.name)
      .map((user) => ({
        id: user.id,
        nameNormalized: user.nameNormalized ?? normalizeName(user.name ?? ""),
      }));

    const summary = await importRowsWithSummary({
      rows,
      sourceFile,
      reset: false,
      repo: ingestRepo,
      userCandidates,
      strict: true,
    });
    revalidatePath("/admin/upload");
    return {
      summary: {
        imported: summary.imported,
        assigned: summary.assigned,
        unmatched: summary.unmatched,
        skipped: summary.skipped,
      },
      rowErrors: summary.errors,
    };
  } catch (error) {
    console.error(error);
    return { error: "No s'ha pogut processar el fitxer." };
  } finally {
    await ingestRepo.disconnect?.();
    await userRepo.disconnect?.();
  }
}

export async function finalizeUploadAction(): Promise<{ backfilled: number }> {
  await requireAdminSession();
  const invoiceRepo = new PrismaInvoiceRepository();
  const userRepo = new PrismaUserRepository();

  try {
    const users = await userRepo.listAll();
    const userCandidates = users
      .filter((user) => user.name)
      .map((user) => ({
        id: user.id,
        nameNormalized: user.nameNormalized ?? normalizeName(user.name ?? ""),
      }));

    const backfilled = await backfillManagers({
      repo: invoiceRepo,
      userCandidates,
    });

    revalidatePath("/admin/upload");

    return { backfilled };
  } finally {
    await invoiceRepo.disconnect?.();
    await userRepo.disconnect?.();
  }
}

export async function suggestManagersAction(): Promise<void> {
  await requireAdminSession();
  const invoiceRepo = new PrismaInvoiceRepository();
  const userRepo = new PrismaUserRepository();

  try {
    const users = await userRepo.listAll();
    const userCandidates = users
      .filter((user) => user.name)
      .map((user) => ({
        id: user.id,
        nameNormalized: user.nameNormalized ?? normalizeName(user.name ?? ""),
      }));

    await backfillManagers({
      repo: invoiceRepo,
      userCandidates,
    });

    revalidatePath("/admin/upload");
  } finally {
    await invoiceRepo.disconnect?.();
    await userRepo.disconnect?.();
  }

  redirect("/admin/upload?suggest=1");
}
