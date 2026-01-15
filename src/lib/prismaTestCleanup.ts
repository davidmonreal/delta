import { prisma } from "@/lib/db";

export async function cleanupPrismaTestData() {
  await prisma.comparisonComment.deleteMany({
    where: { user: { email: { startsWith: "test-" } } },
  });
  await prisma.invoiceLine.deleteMany({
    where: { sourceFile: { startsWith: "__test__" } },
  });
  await prisma.user.deleteMany({ where: { email: { startsWith: "test-" } } });
  await prisma.client.deleteMany({ where: { nameRaw: { startsWith: "Client " } } });
  await prisma.service.deleteMany({ where: { conceptRaw: { startsWith: "Service " } } });
}
