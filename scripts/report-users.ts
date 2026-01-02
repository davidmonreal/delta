import { PrismaUserRepository } from "@/modules/users/infrastructure/prismaUserRepository";
import { normalizeName } from "@/lib/normalize";

async function main() {
  const repo = new PrismaUserRepository();
  const users = await repo.listAll();

  console.log(`Users: ${users.length}`);
  for (const user of users) {
    const name = user.name ?? "";
    const normalized = user.nameNormalized ?? (name ? normalizeName(name) : "");
    console.log(`${user.id} | ${name} | ${normalized}`);
  }

  await repo.disconnect?.();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
