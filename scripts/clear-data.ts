import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.comparisonComment.deleteMany(),
    prisma.invoiceLine.deleteMany(),
    prisma.uploadJob.deleteMany(),
    prisma.client.deleteMany(),
    prisma.service.deleteMany(),
  ]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("DB cleaned");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
