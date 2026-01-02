import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/db";

const args = process.argv.slice(2);

function getArg(name: string) {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return args[index + 1];
}

async function main() {
  const email = getArg("email")?.trim().toLowerCase();
  const password = getArg("password");
  const name = getArg("name");
  const roleRaw = getArg("role")?.toUpperCase() ?? "USER";

  if (!email || !password) {
    throw new Error("Cal passar --email i --password.");
  }

  const role =
    roleRaw === "SUPERADMIN" || roleRaw === "ADMIN" || roleRaw === "USER"
      ? roleRaw
      : null;
  if (!role) {
    throw new Error("Rol invalid. Usa SUPERADMIN, ADMIN o USER.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Ja existeix un usuari amb aquest email.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      name: name ?? null,
      role,
      passwordHash,
    },
  });

  console.log(`Usuari creat: ${email} (${role})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
