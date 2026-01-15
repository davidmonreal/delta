import { describe, expect, it } from "vitest";

import { canManageUsers, canSeeAdminNav, canSeeLinkedServices } from "../uiPolicies";

describe("uiPolicies", () => {
  it("allows admin-only navigation and user management", () => {
    expect(canSeeAdminNav("ADMIN")).toBe(true);
    expect(canSeeAdminNav("SUPERADMIN")).toBe(true);
    expect(canSeeAdminNav("USER")).toBe(false);
    expect(canManageUsers("ADMIN")).toBe(true);
    expect(canManageUsers("USER")).toBe(false);
    expect(canSeeLinkedServices("SUPERADMIN")).toBe(true);
    expect(canSeeLinkedServices("ADMIN")).toBe(false);
    expect(canSeeLinkedServices("USER")).toBe(false);
  });
});
