import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { importXlsxFile } from "@/modules/ingestion/application/importInvoiceLines";
import { PrismaIngestionRepository } from "@/modules/ingestion/infrastructure/prismaIngestionRepository";
import type { IngestionRepository } from "@/modules/ingestion/ports/ingestionRepository";
import { PrismaUserRepository } from "@/modules/users/infrastructure/prismaUserRepository";
import type { UserRepository } from "@/modules/users/ports/userRepository";
import { normalizeName } from "@/lib/normalize";

type ImportDependencies = {
  args?: string[];
  ingestRepo?: IngestionRepository;
  userRepo?: UserRepository;
  importFile?: typeof importXlsxFile;
  readDir?: (dir: string) => string[];
  logger?: Pick<typeof console, "log">;
};

export async function main({
  args = process.argv.slice(2),
  ingestRepo,
  userRepo,
  importFile = importXlsxFile,
  readDir = (dir) => fs.readdirSync(dir),
  logger = console,
}: ImportDependencies = {}) {
  const reset = args.includes("--reset");
  const paths = args.filter((arg) => !arg.startsWith("--"));

  if (paths.length === 0) {
    throw new Error("Cal indicar fitxers .xlsx per importar.");
  }

  const targetPaths = paths;

  const repo = ingestRepo ?? new PrismaIngestionRepository();
  const usersRepo = userRepo ?? new PrismaUserRepository();
  try {
    const users = await usersRepo.listAll();
    const userCandidates = users
      .filter((user) => user.name)
      .map((user) => ({
        id: user.id,
        nameNormalized: user.nameNormalized ?? normalizeName(user.name ?? ""),
      }));
    let totalRows = 0;
    for (const filePath of targetPaths) {
      const imported = await importFile({
        filePath,
        reset,
        repo,
        userCandidates,
      });
      totalRows += imported;
      logger.log(`Importat ${imported} files de ${path.basename(filePath)}.`);
    }

    logger.log(`Importacio finalitzada. Files importades: ${totalRows}.`);
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
