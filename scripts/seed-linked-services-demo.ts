import { pathToFileURL } from "node:url";

import { PrismaIngestionRepository } from "@/modules/ingestion/infrastructure/prismaIngestionRepository";
import { PrismaLinkedServiceRepository } from "@/modules/linkedServices/infrastructure/prismaLinkedServiceRepository";
import type { IngestionRepository, InvoiceLineInput } from "@/modules/ingestion/ports/ingestionRepository";
import type { LinkedServiceRepository } from "@/modules/linkedServices/ports/linkedServiceRepository";
import { normalizeName } from "@/lib/normalize";

const SOURCE_FILE = "seed-linked-services-demo";
const DEMO_CLIENT = "DEMO CADENES";
const DEMO_MANAGER = "Demo Manager";
const TARGET_YEAR = 2025;
const TARGET_MONTH = 12;

const DEMO_SERVICES = {
  trigger: "DEMO SERVEI TRIGGER",
  link12: "DEMO SERVEI LINK 12M",
  link3: "DEMO SERVEI LINK 3M",
  link1: "DEMO SERVEI LINK 1M",
};

type SeedDependencies = {
  ingestRepo?: IngestionRepository;
  linkedRepo?: LinkedServiceRepository;
  logger?: Pick<typeof console, "log">;
};

function shiftMonth(year: number, month: number, offset: number) {
  const shifted = new Date(year, month - 1 - offset, 1);
  return {
    year: shifted.getFullYear(),
    month: shifted.getMonth() + 1,
  };
}

function buildInvoiceLine(params: {
  clientId: number;
  serviceId: number;
  year: number;
  month: number;
  sourceFile: string;
}): InvoiceLineInput {
  const date = new Date(params.year, params.month - 1, 1);
  return {
    date,
    year: params.year,
    month: params.month,
    units: 1,
    price: 100,
    total: 100,
    manager: DEMO_MANAGER,
    managerNormalized: normalizeName(DEMO_MANAGER),
    sourceFile: params.sourceFile,
    series: "DEMO",
    albaran: null,
    numero: `${params.month}-${params.serviceId}`,
    clientId: params.clientId,
    serviceId: params.serviceId,
    managerUserId: null,
  };
}

export async function main({
  ingestRepo,
  linkedRepo,
  logger = console,
}: SeedDependencies = {}) {
  const repo = ingestRepo ?? new PrismaIngestionRepository();
  const linksRepo = linkedRepo ?? new PrismaLinkedServiceRepository();
  const reset = process.argv.includes("--reset");

  try {
    const clientId = await repo.upsertClient(DEMO_CLIENT, normalizeName(DEMO_CLIENT));
    const serviceIds = {
      trigger: await repo.upsertService(
        DEMO_SERVICES.trigger,
        normalizeName(DEMO_SERVICES.trigger),
      ),
      link12: await repo.upsertService(
        DEMO_SERVICES.link12,
        normalizeName(DEMO_SERVICES.link12),
      ),
      link3: await repo.upsertService(
        DEMO_SERVICES.link3,
        normalizeName(DEMO_SERVICES.link3),
      ),
      link1: await repo.upsertService(
        DEMO_SERVICES.link1,
        normalizeName(DEMO_SERVICES.link1),
      ),
    };

    if (reset) {
      await repo.deleteInvoiceLinesBySourceFile(SOURCE_FILE);
      const linkList = await linksRepo.listLinks();
      const demoIds = new Set(Object.values(serviceIds));
      const deletions = linkList.filter(
        (link) =>
          demoIds.has(link.serviceId) || demoIds.has(link.linkedServiceId),
      );
      for (const link of deletions) {
        await linksRepo.deleteLink(link.id);
      }
      logger.log("Seed demo eliminat.");
      return;
    }

    await repo.deleteInvoiceLinesBySourceFile(SOURCE_FILE);

    const offsets = [12, 3, 1];
    const lines: InvoiceLineInput[] = offsets.map((offset) => {
      const { year, month } = shiftMonth(TARGET_YEAR, TARGET_MONTH, offset);
      return buildInvoiceLine({
        clientId,
        serviceId: serviceIds.trigger,
        year,
        month,
        sourceFile: SOURCE_FILE,
      });
    });

    lines.push(
      buildInvoiceLine({
        clientId,
        serviceId: serviceIds.trigger,
        year: TARGET_YEAR,
        month: TARGET_MONTH,
        sourceFile: SOURCE_FILE,
      }),
    );

    await repo.createInvoiceLines(lines);

    const links = [
      { serviceId: serviceIds.trigger, linkedServiceId: serviceIds.link12, offsetMonths: 12 },
      { serviceId: serviceIds.trigger, linkedServiceId: serviceIds.link3, offsetMonths: 3 },
      { serviceId: serviceIds.trigger, linkedServiceId: serviceIds.link1, offsetMonths: 1 },
    ];

    for (const link of links) {
      const existing = await linksRepo.findLink(link);
      if (!existing) {
        await linksRepo.createLink(link);
      }
    }

    logger.log(
      `Seed demo creat per ${TARGET_MONTH}/${TARGET_YEAR}. Usa --reset per netejar.`,
    );
  } finally {
    await repo.disconnect?.();
    await linksRepo.disconnect?.();
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
