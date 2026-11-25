import { describe, expect, it, vi } from "vitest";
import { exchangeOAuthCode, getOAuthCallbackUrl } from "./auth-oauth";

describe("OAuth callback URL", () => {
  it("uses the app origin and a fixed callback path", () => {
    expect(getOAuthCallbackUrl("https://muslim-ayat.example/deep/path?ignored=1#fragment")).toBe(
      "https://muslim-ayat.example/auth/callback",
    );
  });

  it("defaults to the local app and rejects invalid or unsafe origins", () => {
    expect(getOAuthCallbackUrl(undefined)).toBe("http://localhost:3000/auth/callback");
    expect(getOAuthCallbackUrl("not a url")).toBeNull();
    expect(getOAuthCallbackUrl("javascript:alert(1)")).toBeNull();
    expect(getOAuthCallbackUrl("https://user:password@example.com")).toBeNull();
  });
});

describe("OAuth callback exchange", () => {
  it("establishes a session when the authorization code exchange succeeds", async () => {
    const exchange = vi.fn(async () => ({ error: null }));

    await expect(exchangeOAuthCode("valid-code", exchange)).resolves.toBe(true);
    expect(exchange).toHaveBeenCalledWith("valid-code");
  });

  it("reports failed, rejected, and missing-code exchanges safely", async () => {
    const failedExchange = vi.fn(async () => ({ error: new Error("provider error") }));
    const rejectedExchange = vi.fn(async () => {
      throw new Error("network error");
    });
    const unusedExchange = vi.fn(async () => ({ error: null }));

    await expect(exchangeOAuthCode("invalid-code", failedExchange)).resolves.toBe(false);
    await expect(exchangeOAuthCode("code", rejectedExchange)).resolves.toBe(false);
    await expect(exchangeOAuthCode(null, unusedExchange)).resolves.toBe(false);
    expect(unusedExchange).not.toHaveBeenCalled();
  });
});