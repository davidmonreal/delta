import { prisma } from "@/lib/db";

import type { UserEntity } from "../domain/user";
import type { UserRepository, CreateUserData, ListUsersParams, UpdateUserData } from "../ports/userRepository";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  passwordHash: true,
  createdAt: true,
} as const;

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<UserEntity | null> {
    return prisma.user.findUnique({ where: { email }, select: userSelect });
  }

  async findById(id: number): Promise<UserEntity | null> {
    return prisma.user.findUnique({ where: { id }, select: userSelect });
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    return prisma.user.create({ data, select: userSelect });
  }

  async update(id: number, data: UpdateUserData): Promise<UserEntity> {
    return prisma.user.update({ where: { id }, data, select: userSelect });
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
    });
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}
