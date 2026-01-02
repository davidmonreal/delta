import { PrismaInvoiceRepository } from "@/modules/invoices/infrastructure/prismaInvoiceRepository";
import { PrismaUserRepository } from "@/modules/users/infrastructure/prismaUserRepository";
import { normalizeName } from "@/lib/normalize";

async function main() {
  const repo = new PrismaInvoiceRepository();
  const lines = await repo.listUnmatched();
  const userRepo = new PrismaUserRepository();
  const users = await userRepo.listAll();
  const userLookup = new Map(
    users
      .filter((user) => user.name)
      .map((user) => [
        user.nameNormalized ?? normalizeName(user.name ?? ""),
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
  console.log(`Unmatched lines: ${lines.length}`);
  console.log("Top unmatched managers:");
  for (const item of sorted.slice(0, 20)) {
    const normalized = normalizeName(item.manager);
    const hasExact = userLookup.has(normalized);
    console.log(`${item.manager} -> ${item.count} ${hasExact ? "(user exists)" : ""}`);
  }

  await repo.disconnect?.();
  await userRepo.disconnect?.();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
