import { PrismaInvoiceRepository } from "@/modules/invoices/infrastructure/prismaInvoiceRepository";
import { PrismaUserRepository } from "@/modules/users/infrastructure/prismaUserRepository";
import { normalizeName } from "@/lib/normalize";
import { backfillManagers } from "@/modules/invoices/application/backfillManagers";

let invoiceRepo: PrismaInvoiceRepository | null = null;
let userRepo: PrismaUserRepository | null = null;

async function main() {
  invoiceRepo = new PrismaInvoiceRepository();
  userRepo = new PrismaUserRepository();

  const users = await userRepo.listAll();
  for (const user of users) {
    if (!user.name || user.nameNormalized) continue;
    const normalized = normalizeName(user.name);
    await userRepo.update(user.id, {
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
      nameNormalized: user.nameNormalized ?? normalizeName(user.name ?? ""),
    }));

  const updated = await backfillManagers({
    repo: invoiceRepo,
    userCandidates,
  });
  console.log(`Linies actualitzades: ${updated}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await invoiceRepo?.disconnect?.();
    await userRepo?.disconnect?.();
  });
