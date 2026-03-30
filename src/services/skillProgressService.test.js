import { describe, it, expect, vi } from "vitest";

// Mock supabase and its dependencies before importing service
vi.mock("./supabase", () => ({
  default: {
    auth: { getUser: vi.fn() },
    from: vi.fn(() => ({ select: vi.fn(), insert: vi.fn(), update: vi.fn() })),
  },
}));
vi.mock("./authorizationUtils", () => ({
  verifyStudentDataAccess: vi.fn(),
}));
vi.mock("../data/skillTrail", () => ({
  isNodeUnlocked: vi.fn(),
  getUnlockedNodes: vi.fn(),
}));
vi.mock("./rateLimitService", () => ({
  checkRateLimit: vi.fn(),
}));
vi.mock("../config/subscriptionConfig", () => ({
  isFreeNode: vi.fn(),
}));
vi.mock("./sentryService", () => ({
  Sentry: { captureException: vi.fn() },
}));

import { calculateStarsFromPercentage } from "./skillProgressService";

describe("calculateStarsFromPercentage", () => {
  it("returns 3 stars for 100%", () => {
    expect(calculateStarsFromPercentage(100)).toBe(3);
  });

  it("returns 3 stars for exactly 95%", () => {
    expect(calculateStarsFromPercentage(95)).toBe(3);
  });

  it("returns 2 stars for 94% (just below 3-star threshold)", () => {
    expect(calculateStarsFromPercentage(94)).toBe(2);
  });

  it("returns 2 stars for exactly 80%", () => {
    expect(calculateStarsFromPercentage(80)).toBe(2);
  });

  it("returns 1 star for 79% (just below 2-star threshold)", () => {
    expect(calculateStarsFromPercentage(79)).toBe(1);
  });

  it("returns 1 star for exactly 60%", () => {
    expect(calculateStarsFromPercentage(60)).toBe(1);
  });

  it("returns 0 stars for 59% (just below 1-star threshold)", () => {
    expect(calculateStarsFromPercentage(59)).toBe(0);
  });

  it("returns 0 stars for 0%", () => {
    expect(calculateStarsFromPercentage(0)).toBe(0);
  });
});
