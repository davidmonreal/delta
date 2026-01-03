import { describe, expect, it } from "vitest";

import { canManageUsers, canSeeAdminNav } from "../uiPolicies";

describe("uiPolicies", () => {
  it("allows admin-only navigation and user management", () => {
    expect(canSeeAdminNav("ADMIN")).toBe(true);
    expect(canSeeAdminNav("SUPERADMIN")).toBe(true);
    expect(canSeeAdminNav("USER")).toBe(false);
    expect(canManageUsers("ADMIN")).toBe(true);
    expect(canManageUsers("USER")).toBe(false);
  });
});
