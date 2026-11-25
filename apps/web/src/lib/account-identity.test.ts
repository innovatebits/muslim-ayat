import { describe, expect, it } from "vitest";
import { getAccountIdentityLabel } from "./account-identity";

describe("account identity label", () => {
  it("uses a non-empty provider email when available", () => {
    expect(getAccountIdentityLabel(" reader@example.com ")).toBe("reader@example.com");
  });

  it("provides a clear fallback when the provider omits an email", () => {
    expect(getAccountIdentityLabel(null)).toBe("a provider account (email not shared)");
    expect(getAccountIdentityLabel(undefined)).toBe("a provider account (email not shared)");
    expect(getAccountIdentityLabel("  ")).toBe("a provider account (email not shared)");
  });
});