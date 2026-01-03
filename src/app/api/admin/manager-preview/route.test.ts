import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn().mockResolvedValue({
    user: { id: "1", role: "ADMIN" },
  }),
  previewAssignManagers: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock("@/lib/require-auth", () => ({ requireAdminSession: mocks.requireAdminSession }));
vi.mock("@/modules/invoices/application/previewAssignManagers", () => ({
  previewAssignManagers: mocks.previewAssignManagers,
}));
vi.mock("@/modules/invoices/infrastructure/prismaInvoiceRepository", () => ({
  PrismaInvoiceRepository: class {
    disconnect = mocks.disconnect;
  },
}));

import { POST } from "./route";

describe("manager preview route", () => {
  beforeEach(() => {
    mocks.previewAssignManagers.mockReset();
  });

  it("returns zero for invalid payload", async () => {
    const request = new Request("http://localhost/api/admin/manager-preview", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(body).toEqual({ count: 0 });
    expect(mocks.previewAssignManagers).not.toHaveBeenCalled();
  });

  it("returns count for valid payload", async () => {
    mocks.previewAssignManagers.mockResolvedValue(5);

    const request = new Request("http://localhost/api/admin/manager-preview", {
      method: "POST",
      body: JSON.stringify({ name: "Toni" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(body).toEqual({ count: 5 });
    expect(mocks.previewAssignManagers).toHaveBeenCalled();
  });
});
