import { pathToFileURL } from "node:url";

import { PrismaInvoiceRepository } from "@/modules/invoices/infrastructure/prismaInvoiceRepository";
import { PrismaUserRepository } from "@/modules/users/infrastructure/prismaUserRepository";
import { normalizeName } from "@/lib/normalize";

type ReportDependencies = {
  invoiceRepo?: PrismaInvoiceRepository;
  userRepo?: PrismaUserRepository;
  normalizer?: typeof normalizeName;
  logger?: Pick<typeof console, "log">;
};

export async function main({
  invoiceRepo,
  userRepo,
  normalizer = normalizeName,
  logger = console,
}: ReportDependencies = {}) {
  const repo = invoiceRepo ?? new PrismaInvoiceRepository();
  const usersRepo = userRepo ?? new PrismaUserRepository();
  try {
    const lines = await repo.listUnmatched();
    const users = await usersRepo.listAll();
    const userLookup = new Map(
      users
        .filter((user) => user.name)
        .map((user) => [
          user.nameNormalized ?? normalizer(user.name ?? ""),
          user.id,
        ]),
    );

    const counts = new Map<string, { manager: string; count: number }>();
    for (const line of lines) {
      const key = line.managerNormalized ?? line.manager;
      const entry = counts.get(key);
      if (entry) {
        entry.count += 1;
      } else {
        counts.set(key, { manager: line.manager, count: 1 });
      }
    }

    const sorted = Array.from(counts.values()).sort((a, b) => b.count - a.count);
    logger.log(`Unmatched lines: ${lines.length}`);
    logger.log("Top unmatched managers:");
    for (const item of sorted.slice(0, 20)) {
      const normalized = normalizer(item.manager);
      const hasExact = userLookup.has(normalized);
      logger.log(
        `${item.manager} -> ${item.count} ${hasExact ? "(user exists)" : ""}`,
      );
    }
  } finally {
    await repo.disconnect?.();
    await usersRepo.disconnect?.();
  }
}

async function runCli() {
  try {
    await main();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

const isDirectRun =
  process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isDirectRun) {
  void runCli();
}
