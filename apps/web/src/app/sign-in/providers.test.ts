import { describe, expect, it } from "vitest";
import { isSocialAuthProvider, socialAuthProviders } from "./providers";

describe("social sign-in providers", () => {
  it("offers Google, Microsoft, and Facebook only", () => {
    expect(socialAuthProviders).toEqual([
      { id: "google", name: "Google" },
      { id: "azure", name: "Microsoft" },
      { id: "facebook", name: "Facebook" },
    ]);
  });

  it("recognizes only configured provider identifiers", () => {
    expect(isSocialAuthProvider("google")).toBe(true);
    expect(isSocialAuthProvider("azure")).toBe(true);
    expect(isSocialAuthProvider("facebook")).toBe(true);
    expect(isSocialAuthProvider("email")).toBe(false);
    expect(isSocialAuthProvider("unknown")).toBe(false);
  });
});