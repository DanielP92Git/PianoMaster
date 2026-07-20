import { describe, it, expect } from "vitest";
import { authErrorKey } from "./authErrorKey";

describe("authErrorKey", () => {
  it.each([
    ["Invalid login credentials", "auth.errors.invalidCredentials"],
    ["Email not confirmed", "auth.errors.emailNotConfirmed"],
    ["Too many requests", "auth.errors.tooManyRequests"],
    [
      "An account with this email already exists. Please log in instead.",
      "auth.errors.accountExists",
    ],
    ["User already registered", "auth.errors.accountExists"],
    ["Failed to fetch", "auth.errors.network"],
    [
      "Connection timeout. Please check your internet connection.",
      "auth.errors.network",
    ],
  ])("maps %j to %s", (message, expected) => {
    expect(authErrorKey(new Error(message))).toBe(expected);
  });

  it("matches regardless of the casing Supabase happens to use", () => {
    expect(authErrorKey(new Error("INVALID LOGIN CREDENTIALS"))).toBe(
      "auth.errors.invalidCredentials"
    );
  });

  it("falls back to the generic key for an unrecognised message", () => {
    expect(authErrorKey(new Error("some unmapped failure"))).toBe(
      "auth.errors.generic"
    );
  });

  it("honours a screen-specific fallback", () => {
    expect(
      authErrorKey(
        new Error("some unmapped failure"),
        "auth.errors.signupFailed"
      )
    ).toBe("auth.errors.signupFailed");
  });

  it("does not throw on a null or message-less error", () => {
    expect(authErrorKey(null)).toBe("auth.errors.generic");
    expect(authErrorKey({})).toBe("auth.errors.generic");
  });
});
