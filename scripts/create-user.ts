import { CreateUserSchema } from "@/modules/users/dto/userSchemas";
import { upsertUser } from "@/modules/users/application/upsertUser";
import { PrismaUserRepository } from "@/modules/users/infrastructure/prismaUserRepository";
import { BcryptPasswordHasher } from "@/modules/users/infrastructure/bcryptPasswordHasher";

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

  const parsed = CreateUserSchema.safeParse({
    email,
    name: name ?? undefined,
    password,
    role,
  });

  if (!parsed.success) {
    throw new Error("Dades invalides per crear usuari.");
  }

  const repo = new PrismaUserRepository();
  const hasher = new BcryptPasswordHasher();
  const result = await upsertUser({
    input: parsed.data,
    repo,
    passwordHasher: hasher,
  });

  if (result.created) {
    console.log(`Usuari creat: ${parsed.data.email} (${parsed.data.role})`);
  } else {
    console.log(`Usuari actualitzat: ${parsed.data.email} (${parsed.data.role})`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
