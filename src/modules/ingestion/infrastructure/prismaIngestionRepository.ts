import { prisma } from "@/lib/db";

import type { IngestionRepository, InvoiceLineInput } from "../ports/ingestionRepository";

export class PrismaIngestionRepository implements IngestionRepository {
  async upsertClient(nameRaw: string, nameNormalized: string) {
    const client = await prisma.client.upsert({
      where: { nameNormalized },
      update: {},
      create: {
        nameRaw,
        nameNormalized,
      },
    });
    return client.id;
  }

  async upsertService(conceptRaw: string, conceptNormalized: string) {
    const service = await prisma.service.upsert({
      where: { conceptNormalized },
      update: {},
      create: {
        conceptRaw,
        conceptNormalized,
      },
    });
    return service.id;
  }

  async deleteInvoiceLinesBySourceFile(sourceFile: string) {
    await prisma.invoiceLine.deleteMany({ where: { sourceFile } });
  }

  async createInvoiceLines(lines: InvoiceLineInput[]) {
    if (lines.length === 0) return 0;
    const result = await prisma.invoiceLine.createMany({ data: lines });
    return result.count;
  }

  async getImportSummary(sourceFile: string) {
    const [total, assigned] = await prisma.$transaction([
      prisma.invoiceLine.count({ where: { sourceFile } }),
      prisma.invoiceLine.count({
        where: { sourceFile, managerUserId: { not: null } },
      }),
    ]);

    return {
      total,
      assigned,
      unmatched: total - assigned,
    };
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}
