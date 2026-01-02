import fs from "node:fs";
import path from "node:path";

import { importXlsxFile } from "@/modules/ingestion/application/importInvoiceLines";
import { PrismaIngestionRepository } from "@/modules/ingestion/infrastructure/prismaIngestionRepository";

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

  const repo = new PrismaIngestionRepository();
  let totalRows = 0;
  for (const filePath of targetPaths) {
    const imported = await importXlsxFile({ filePath, reset, repo });
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
    await prisma.$disconnect();
  });
