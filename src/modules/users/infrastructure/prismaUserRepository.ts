import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import { normalizeName } from "@/lib/normalize";

import type { UserEntity } from "../domain/user";
import type {
  UserRepository,
  CreateUserData,
  ListUsersParams,
  UpdateUserData,
} from "../ports/userRepository";

const userSelect = {
  id: true,
  email: true,
  name: true,
  nameNormalized: true,
  role: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true,
  managerAliases: {
    select: {
      alias: true,
    },
  },
} satisfies Prisma.UserSelect;

function toEntity(row: Prisma.UserGetPayload<{ select: typeof userSelect }>): UserEntity {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    nameNormalized: row.nameNormalized,
    role: row.role,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    managerAliases: row.managerAliases,
  };
}

export class PrismaUserRepository implements UserRepository {
  async listAll(): Promise<UserEntity[]> {
    const users = await prisma.user.findMany({
      orderBy: [{ role: "desc" }, { email: "asc" }],
      select: userSelect,
    });
    return users.map(toEntity);
  }

  async list({ roles, query }: ListUsersParams): Promise<UserEntity[]> {
    return prisma.user.findMany({
      where: {
        role: { in: roles },
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ role: "desc" }, { email: "asc" }],
      select: userSelect,
    }).then((rows) => rows.map(toEntity));
  }

  async findById(id: number): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) return null;
    return toEntity(user);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: userSelect,
    });

    if (!user) return null;
    return toEntity(user);
  }

  async create(userData: CreateUserData): Promise<UserEntity> {
    const user = await prisma.user.create({
      data: {
        ...userData,
        nameNormalized: normalizeName(userData.name ?? ""),
      },
      select: userSelect,
    });
    return toEntity(user);
  }

  async update(id: number, input: UpdateUserData): Promise<UserEntity> {
    const { managerAliases, ...userData } = input;
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...userData,
        ...(managerAliases
          ? {
            managerAliases: {
              deleteMany: {}, // Clear existing aliases for this user
              create: managerAliases.map((alias) => ({ alias })),
            },
          }
          : {}),
      },
      select: userSelect,
    });
    return toEntity(user);
  }

  async listManagerAliasOwners(
    aliases: string[],
  ): Promise<{ alias: string; userId: number }[]> {
    if (aliases.length === 0) return [];
    return prisma.managerAlias.findMany({
      where: { alias: { in: aliases } },
      select: { alias: true, userId: true },
    });
  }

  async delete(id: number): Promise<UserEntity> {
    return toEntity(await prisma.user.delete({ where: { id }, select: userSelect }));
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}
