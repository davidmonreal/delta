"use server";

import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminSession } from "@/lib/require-auth";
import { normalizeName } from "@/lib/normalize";
import { assignManager } from "@/modules/invoices/application/assignManager";
import { backfillManagers } from "@/modules/invoices/application/backfillManagers";
import { deleteDuplicates } from "@/modules/invoices/application/deleteDuplicates";
import {
  buildHeaderMap,
  importRowsWithSummary,
  validateHeaders,
  type ImportRowError,
} from "@/modules/ingestion/application/importInvoiceLines";
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

export async function deleteDuplicatesAction(): Promise<void> {
  await requireAdminSession();
  const repo = new PrismaInvoiceRepository();
  await deleteDuplicates({ repo });
  revalidatePath("/admin/upload");
}

export async function uploadDataAction(
  _state: UploadActionState,
  formData: FormData,
): Promise<UploadActionState> {
  await requireAdminSession();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Selecciona un fitxer per pujar." };
  }
  if (!file.name || file.size === 0) {
    return { error: "El fitxer esta buit." };
  }

  const lowerName = file.name.toLowerCase();
  if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".csv")) {
    return { error: "El fitxer ha de ser Excel o CSV." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { error: "No hem trobat cap full de calcul." };
  }
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  });

  if (rows.length === 0) {
    return { error: "El fitxer no te dades." };
  }

  const headerMap = buildHeaderMap(rows[0]);
  const headerErrors = validateHeaders(headerMap);
  if (headerErrors.missing.length || headerErrors.extra.length) {
    return {
      error: "La capcalera del fitxer no coincideix amb el format esperat.",
      headerErrors,
    };
  }

  const sourceFile = buildUploadSourceFile(file.name);
  const ingestRepo = new PrismaIngestionRepository();
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

    const summary = await importRowsWithSummary({
      rows,
      sourceFile,
      reset: false,
      repo: ingestRepo,
      userCandidates,
      strict: true,
    });

    const backfilled = await backfillManagers({
      repo: invoiceRepo,
      userCandidates,
    });

    revalidatePath("/admin/upload");

    return {
      summary: {
        fileName: file.name,
        imported: summary.imported,
        assigned: summary.assigned,
        unmatched: summary.unmatched,
        skipped: summary.skipped,
        backfilled,
      },
      rowErrors: summary.errors,
    };
  } catch (error) {
    console.error(error);
    return { error: "No s'ha pogut processar el fitxer." };
  } finally {
    await ingestRepo.disconnect?.();
    await invoiceRepo.disconnect?.();
    await userRepo.disconnect?.();
  }
}
