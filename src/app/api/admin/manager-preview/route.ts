import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminSession } from "@/lib/require-auth";
import { normalizeName } from "@/lib/normalize";
import { PrismaInvoiceRepository } from "@/modules/invoices/infrastructure/prismaInvoiceRepository";
import { previewAssignManagers } from "@/modules/invoices/application/previewAssignManagers";

const PreviewSchema = z.object({
  name: z.string().trim().min(1),
});

export async function POST(request: Request) {
  await requireAdminSession();
  const body = await request.json().catch(() => null);
  const parsed = PreviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ count: 0 });
  }

  const repo = new PrismaInvoiceRepository();
  const count = await previewAssignManagers({
    repo,
    nameNormalized: normalizeName(parsed.data.name),
  });
  await repo.disconnect?.();

  return NextResponse.json({ count });
}
