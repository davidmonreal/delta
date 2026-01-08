import { describe, expect, it } from "vitest";

import { resolveApiErrorMessage } from "@/components/admin/uploadGateway";

describe("uploadGateway", () => {
  it("prefers server error message when available", () => {
    expect(resolveApiErrorMessage({ error: "boom" }, "fallback")).toBe("boom");
  });

  it("falls back when no usable error message exists", () => {
    expect(resolveApiErrorMessage({ error: 42 }, "fallback")).toBe("fallback");
    expect(resolveApiErrorMessage(null, "fallback")).toBe("fallback");
  });
});
