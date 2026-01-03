import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  requireAdminSession: vi.fn().mockResolvedValue({
    user: { id: "1", role: "ADMIN" },
  }),
  assignManager: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/require-auth", () => ({ requireAdminSession: mocks.requireAdminSession }));
vi.mock("@/modules/invoices/application/assignManager", () => ({
  assignManager: mocks.assignManager,
}));
vi.mock("@/modules/invoices/infrastructure/prismaInvoiceRepository", () => ({
  PrismaInvoiceRepository: class {},
}));

import { assignManagerAction } from "./actions";

function buildFormData(entries: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }
  return formData;
}

describe("admin unmatched actions", () => {
  beforeEach(() => {
    mocks.revalidatePath.mockReset();
    mocks.assignManager.mockReset();
  });

  it("skips invalid form data", async () => {
    await assignManagerAction(buildFormData({ lineId: "", userId: "" }));

    expect(mocks.assignManager).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("assigns manager and revalidates", async () => {
    await assignManagerAction(buildFormData({ lineId: "10", userId: "20" }));

    expect(mocks.assignManager).toHaveBeenCalledWith(
      expect.objectContaining({ lineId: 10, userId: 20 }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/unmatched");
  });
});
