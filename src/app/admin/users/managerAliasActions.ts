"use server";

import { PrismaInvoiceRepository } from "@/modules/invoices/infrastructure/prismaInvoiceRepository";

export async function searchManagerAliasesAction(query: string) {
  if (!query || query.trim().length < 2) return [];

  const invoiceRepo = new PrismaInvoiceRepository();
  try {
    const aliases = await invoiceRepo.listUnmatchedManagers(query);
    return aliases.map((alias) => ({
      label: alias,
      value: alias,
    }));
  } catch (error) {
    console.error("Error searching manager aliases:", error);
    return [];
  }
}
