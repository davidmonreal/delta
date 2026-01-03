import { pathToFileURL } from "node:url";

import { PrismaInvoiceRepository } from "@/modules/invoices/infrastructure/prismaInvoiceRepository";
import { PrismaUserRepository } from "@/modules/users/infrastructure/prismaUserRepository";
import { normalizeName } from "@/lib/normalize";
import { backfillManagers } from "@/modules/invoices/application/backfillManagers";

type ReconcileDependencies = {
  invoiceRepo?: PrismaInvoiceRepository;
  userRepo?: PrismaUserRepository;
  backfill?: typeof backfillManagers;
  normalizer?: typeof normalizeName;
  logger?: Pick<typeof console, "log">;
};

export async function main({
  invoiceRepo,
  userRepo,
  backfill = backfillManagers,
  normalizer = normalizeName,
  logger = console,
}: ReconcileDependencies = {}) {
  const repo = invoiceRepo ?? new PrismaInvoiceRepository();
  const usersRepo = userRepo ?? new PrismaUserRepository();

  try {
    const users = await usersRepo.listAll();
    for (const user of users) {
      if (!user.name || user.nameNormalized) continue;
      const normalized = normalizer(user.name);
      await usersRepo.update(user.id, {
        email: user.email,
        name: user.name,
        nameNormalized: normalized,
        role: user.role,
        passwordHash: user.passwordHash,
      });
      user.nameNormalized = normalized;
    }
    const userCandidates = users
      .filter((user) => user.name)
      .map((user) => ({
        id: user.id,
        nameNormalized: user.nameNormalized ?? normalizer(user.name ?? ""),
      }));

    const updated = await backfill({
      repo,
      userCandidates,
    });
    logger.log(`Linies actualitzades: ${updated}`);
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
