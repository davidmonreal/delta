import { describe, expect, it } from "vitest";

import { isAdminRole, isSuperadminRole } from "../rolePolicies";

describe("rolePolicies", () => {
  it("identifies admin and superadmin roles", () => {
    expect(isAdminRole("ADMIN")).toBe(true);
    expect(isAdminRole("SUPERADMIN")).toBe(true);
    expect(isAdminRole("USER")).toBe(false);
    expect(isSuperadminRole("SUPERADMIN")).toBe(true);
    expect(isSuperadminRole("ADMIN")).toBe(false);
  });
});
