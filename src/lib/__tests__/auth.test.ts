import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserEntity } from "@/modules/users/domain/user";

const mocks = vi.hoisted(() => ({
  findById: vi.fn(),
}));

vi.mock("@/modules/users/infrastructure/prismaUserRepository", () => ({
  PrismaUserRepository: vi.fn().mockImplementation(() => ({
    findById: (...args: unknown[]) => mocks.findById(...args),
  })),
}));

import { authOptions } from "@/lib/auth";

const baseUser: UserEntity = {
  id: 1,
  email: "admin@example.com",
  name: "Admin User",
  nameNormalized: "ADMIN USER",
  role: "ADMIN",
  passwordHash: "hashed",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("authOptions callbacks", () => {
  beforeEach(() => {
    mocks.findById.mockReset();
  });

  it("allows admin to impersonate a user", async () => {
    mocks.findById.mockResolvedValueOnce({
      ...baseUser,
      id: 5,
      email: "user@example.com",
      name: "User A",
      role: "USER",
    });

    const token = {
      userId: "1",
      role: "ADMIN",
      name: "Admin User",
      email: "admin@example.com",
    };

    const updated = await authOptions.callbacks!.jwt({
      token,
      trigger: "update",
      session: { impersonateUserId: 5 },
    } as any);

    expect(updated.userId).toBe("5");
    expect(updated.role).toBe("USER");
    expect(updated.impersonatorId).toBe("1");
    expect(updated.impersonatorRole).toBe("ADMIN");
    expect(updated.impersonatorName).toBe("Admin User");
    expect(updated.impersonatorEmail).toBe("admin@example.com");
  });

  it("prevents admin from impersonating another admin", async () => {
    mocks.findById.mockResolvedValueOnce({
      ...baseUser,
      id: 6,
      email: "admin2@example.com",
      role: "ADMIN",
    });

    const token = {
      userId: "1",
      role: "ADMIN",
      name: "Admin User",
      email: "admin@example.com",
    };

    const updated = await authOptions.callbacks!.jwt({
      token,
      trigger: "update",
      session: { impersonateUserId: 6 },
    } as any);

    expect(updated.userId).toBe("1");
    expect(updated.role).toBe("ADMIN");
    expect(updated.impersonatorId).toBeUndefined();
  });

  it("allows superadmin to impersonate admin", async () => {
    mocks.findById.mockResolvedValueOnce({
      ...baseUser,
      id: 7,
      email: "admin3@example.com",
      role: "ADMIN",
    });

    const token = {
      userId: "99",
      role: "SUPERADMIN",
      name: "Root",
      email: "root@example.com",
    };

    const updated = await authOptions.callbacks!.jwt({
      token,
      trigger: "update",
      session: { impersonateUserId: 7 },
    } as any);

    expect(updated.userId).toBe("7");
    expect(updated.role).toBe("ADMIN");
    expect(updated.impersonatorId).toBe("99");
    expect(updated.impersonatorRole).toBe("SUPERADMIN");
  });

  it("restores the original user when impersonation ends", async () => {
    const token = {
      userId: "5",
      role: "USER",
      name: "User A",
      email: "user@example.com",
      impersonatorId: "1",
      impersonatorRole: "ADMIN",
      impersonatorName: "Admin User",
      impersonatorEmail: "admin@example.com",
    };

    const updated = await authOptions.callbacks!.jwt({
      token,
      trigger: "update",
      session: { clearImpersonation: true },
    } as any);

    expect(updated.userId).toBe("1");
    expect(updated.role).toBe("ADMIN");
    expect(updated.impersonatorId).toBeUndefined();
  });

  it("adds impersonator to the session when present", async () => {
    const session = { user: { id: "5", role: "USER" } };
    const token = {
      userId: "5",
      role: "USER",
      name: "User A",
      email: "user@example.com",
      impersonatorId: "1",
      impersonatorRole: "ADMIN",
      impersonatorName: "Admin User",
      impersonatorEmail: "admin@example.com",
    };

    const updated = await authOptions.callbacks!.session({
      session: session as any,
      token: token as any,
    });

    expect(updated.impersonator?.id).toBe("1");
    expect(updated.impersonator?.role).toBe("ADMIN");
    expect(updated.user.name).toBe("User A");
  });
});
