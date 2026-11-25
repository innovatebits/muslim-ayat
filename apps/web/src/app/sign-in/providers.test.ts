import { describe, expect, it } from "vitest";
import { getEnabledSocialAuthProviders, isSocialAuthProvider, socialAuthProviders } from "./providers";

describe("social sign-in providers", () => {
  it("defines Google, Microsoft and Facebook with independent feature flags", () => {
    expect(socialAuthProviders).toEqual([
      { id: "google", name: "Google", feature: "authGoogle" },
      { id: "azure", name: "Microsoft", feature: "authMicrosoft" },
      { id: "facebook", name: "Facebook", feature: "authFacebook" },
    ]);
  });

  it("enables configured providers by default and rejects unknown identifiers", () => {
    expect(getEnabledSocialAuthProviders().map(({ id }) => id)).toEqual(["google", "azure", "facebook"]);
    expect(isSocialAuthProvider("google")).toBe(true);
    expect(isSocialAuthProvider("azure")).toBe(true);
    expect(isSocialAuthProvider("facebook")).toBe(true);
    expect(isSocialAuthProvider("email")).toBe(false);
    expect(isSocialAuthProvider("unknown")).toBe(false);
  });
});
