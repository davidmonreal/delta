import fs from "node:fs";
import path from "node:path";

import { importXlsxFile } from "@/modules/ingestion/application/importInvoiceLines";
import { PrismaIngestionRepository } from "@/modules/ingestion/infrastructure/prismaIngestionRepository";
import { PrismaUserRepository } from "@/modules/users/infrastructure/prismaUserRepository";
import { normalizeName } from "@/lib/normalize";

let repo: PrismaIngestionRepository | null = null;
let userRepo: PrismaUserRepository | null = null;

async function main() {
  const args = process.argv.slice(2);
  const reset = args.includes("--reset");
  const paths = args.filter((arg) => !arg.startsWith("--"));

  const targetPaths =
    paths.length > 0
      ? paths
      : fs
          .readdirSync(path.join(process.cwd(), "data"))
          .filter((file) => file.endsWith(".xlsx"))
          .map((file) => path.join(process.cwd(), "data", file));

  if (targetPaths.length === 0) {
    throw new Error("No s'han trobat fitxers .xlsx per importar.");
  }

  repo = new PrismaIngestionRepository();
  userRepo = new PrismaUserRepository();
  const users = await userRepo.listAll();
  const userCandidates = users
    .filter((user) => user.name)
    .map((user) => ({
      id: user.id,
      nameNormalized: user.nameNormalized ?? normalizeName(user.name ?? ""),
    }));
  let totalRows = 0;
  for (const filePath of targetPaths) {
    const imported = await importXlsxFile({
      filePath,
      reset,
      repo,
      userCandidates,
    });
    totalRows += imported;
    console.log(`Importat ${imported} files de ${path.basename(filePath)}.`);
  }

  console.log(`Importacio finalitzada. Files importades: ${totalRows}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await repo?.disconnect?.();
    await userRepo?.disconnect?.();
  });
