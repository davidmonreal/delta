"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminSession } from "@/lib/require-auth";
import { PrismaInvoiceRepository } from "@/modules/invoices/infrastructure/prismaInvoiceRepository";
import { assignManager } from "@/modules/invoices/application/assignManager";

const AssignSchema = z.object({
  lineId: z.coerce.number().int().positive(),
  userId: z.coerce.number().int().positive(),
});

type ActionState = {
  error?: string;
  success?: string;
};

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

  revalidatePath("/admin/unmatched");
}
