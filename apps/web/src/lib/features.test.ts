import { describe, expect, it } from "vitest";
import { featureFlags, isFeatureEnabled } from "./features";

describe("feature flags", () => {
  it("enables optional capabilities by default", () => {
    expect(featureFlags.translations).toBe(true);
    expect(featureFlags.mushafLayout).toBe(true);
    expect(featureFlags.surahHeaders).toBe(true);
    expect(featureFlags.bookmarks).toBe(true);
    expect(featureFlags.authMicrosoft).toBe(true);
    expect(featureFlags.authPasswordReset).toBe(true);
  });

  it("exposes a typed lookup for application gates", () => {
    expect(isFeatureEnabled("search")).toBe(featureFlags.search);
    expect(isFeatureEnabled("authEmailOtp")).toBe(featureFlags.authEmailOtp);
  });
});
