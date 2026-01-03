import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  requireAdminSession: vi.fn().mockResolvedValue({
    user: { id: "1", role: "ADMIN" },
  }),
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/require-auth", () => ({ requireAdminSession: mocks.requireAdminSession }));
vi.mock("@/modules/users/application/createUser", () => ({ createUser: mocks.createUser }));
vi.mock("@/modules/users/application/deleteUser", () => ({ deleteUser: mocks.deleteUser }));
vi.mock("@/modules/users/application/updateUser", () => ({ updateUser: mocks.updateUser }));
vi.mock("@/modules/users/infrastructure/bcryptPasswordHasher", () => ({
  BcryptPasswordHasher: class {},
}));
vi.mock("@/modules/users/infrastructure/prismaUserRepository", () => ({
  PrismaUserRepository: class {},
}));
vi.mock("@/modules/invoices/infrastructure/prismaInvoiceRepository", () => ({
  PrismaInvoiceRepository: class {},
}));

import { createUserAction, deleteUserAction, updateUserAction } from "./actions";

function buildFormData(entries: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }
  return formData;
}

describe("admin users actions", () => {
  beforeEach(() => {
    mocks.revalidatePath.mockReset();
    mocks.createUser.mockReset();
    mocks.deleteUser.mockReset();
    mocks.updateUser.mockReset();
  });

  it("returns validation error for createUserAction", async () => {
    const result = await createUserAction(
      {},
      buildFormData({ email: "", password: "" }),
    );

    expect(result).toEqual({ error: "Falten camps obligatoris." });
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("creates user and revalidates", async () => {
    mocks.createUser.mockResolvedValue({ success: "ok" });
    const result = await createUserAction(
      {},
      buildFormData({
        email: "user@example.com",
        name: "User",
        password: "secret",
        role: "USER",
      }),
    );

    expect(result).toEqual({ success: "ok" });
    expect(mocks.createUser).toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/users");
  });

  it("returns validation error for updateUserAction", async () => {
    const result = await updateUserAction(
      {},
      buildFormData({ userId: "", email: "" }),
    );

    expect(result).toEqual({ error: "Falten camps obligatoris." });
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("updates user and revalidates", async () => {
    mocks.updateUser.mockResolvedValue({ success: "ok" });
    const result = await updateUserAction(
      {},
      buildFormData({
        userId: "10",
        email: "user@example.com",
        name: "User",
        password: "",
        role: "ADMIN",
      }),
    );

    expect(result).toEqual({ success: "ok" });
    expect(mocks.updateUser).toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/users");
  });

  it("returns validation error for deleteUserAction", async () => {
    const result = await deleteUserAction(
      {},
      buildFormData({ userId: "" }),
    );

    expect(result).toEqual({ error: "Falten camps obligatoris." });
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("deletes user and revalidates", async () => {
    mocks.deleteUser.mockResolvedValue({ success: "ok" });
    const result = await deleteUserAction(
      {},
      buildFormData({ userId: "10" }),
    );

    expect(result).toEqual({ success: "ok" });
    expect(mocks.deleteUser).toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/users");
  });
});
